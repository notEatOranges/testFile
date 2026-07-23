// 网络请求封装
import {
    apiConfig,
    ApiError,
    ApiResponse,
    RequestConfig,
    RequestHeaders
} from '../config/api';
import { getCache, setCache } from './cache';
import {
    clearToken,
    formatAuthHeader,
    getStoredToken,
    isTokenExpired
} from './token';

// 请求拦截器类型
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onResponse?: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>;
  onError?: (error: ApiError) => ApiError | Promise<ApiError>;
}

// 请求实例类
class RequestInstance {
  private interceptors: RequestInterceptor[] = [];
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  // 添加拦截器
  addInterceptor(interceptor: RequestInterceptor) {
    this.interceptors.push(interceptor);
  }

  // 移除拦截器
  removeInterceptor(interceptor: RequestInterceptor) {
    const index = this.interceptors.indexOf(interceptor);
    if (index > -1) {
      this.interceptors.splice(index, 1);
    }
  }

  // 获取请求头
  private async getHeaders(customHeaders?: RequestHeaders): Promise<RequestHeaders> {
    const headers: RequestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'myApp/1.0.0',
      ...customHeaders,
    };

    // 添加认证头
    const token = await getStoredToken();
    if (token) {
      headers.Authorization = formatAuthHeader(token);
    }

    return headers;
  }

  // 刷新token
  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefreshToken();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // 执行token刷新
  private async performRefreshToken(): Promise<string | null> {
    try {
      // 这里应该调用您的刷新token API
      // const response = await this.request({
      //   method: 'POST',
      //   url: API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      //   data: { refreshToken: await getRefreshToken() }
      // });
      
      // 模拟刷新token
      console.log('刷新token...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 返回新的token（这里应该从API响应中获取）
      return 'new_refreshed_token_' + Date.now();
    } catch (error) {
      console.error('刷新token失败:', error);
      await clearToken();
      return null;
    }
  }

  // 处理请求错误
  private handleRequestError(error: any): ApiError {
    if (error.response) {
      // 服务器响应错误
      return {
        code: error.response.status,
        message: error.response.data?.message || '服务器错误',
        details: error.response.data,
        timestamp: Date.now(),
      };
    } else if (error.request) {
      // 网络错误
      return {
        code: 0,
        message: '网络连接失败',
        details: error.request,
        timestamp: Date.now(),
      };
    } else {
      // 其他错误
      return {
        code: -1,
        message: error.message || '未知错误',
        details: error,
        timestamp: Date.now(),
      };
    }
  }

  // 执行请求
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    let finalConfig = { ...config };
    
    // 应用请求拦截器
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        finalConfig = await interceptor.onRequest(finalConfig);
      }
    }

    // 检查缓存
    if (finalConfig.enableCache && finalConfig.method === 'GET') {
      const cacheKey = `api_${finalConfig.method}_${finalConfig.url}`;
      const cachedData = getCache<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // 构建完整URL
    const fullUrl = `${apiConfig.baseURL}${finalConfig.url}`;
    
    // 获取请求头
    const headers = await this.getHeaders(finalConfig.headers);
    
    // 检查token是否过期
    const tokenExpired = await isTokenExpired();
    if (tokenExpired && headers.Authorization) {
      const newToken = await this.refreshToken();
      if (newToken) {
        headers.Authorization = formatAuthHeader(newToken);
      } else {
        // 刷新失败，清除token
        await clearToken();
        delete headers.Authorization;
      }
    }

    // 构建fetch配置
    const fetchConfig: RequestInit = {
      method: finalConfig.method,
      headers: headers as Record<string, string>,
    };

    // 添加请求体
    if (finalConfig.data && finalConfig.method !== 'GET') {
      fetchConfig.body = JSON.stringify(finalConfig.data);
    }

    // 执行请求（带重试）
    let lastError: ApiError;
    const maxRetries = finalConfig.retryTimes || apiConfig.retryTimes;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(fullUrl, fetchConfig);
        
        // 检查HTTP状态码
        if (!response.ok) {
          // 如果是401错误且不是刷新token的请求，尝试刷新token
          if (response.status === 401 && !finalConfig.url.includes('refresh')) {
                         const newToken = await this.refreshToken();
             if (newToken) {
               headers.Authorization = formatAuthHeader(newToken);
               fetchConfig.headers = headers as Record<string, string>;
               continue; // 重试请求
             }
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // 构建响应对象
        const apiResponse: ApiResponse<T> = {
          success: true,
          data: data.data || data,
          message: data.message || '请求成功',
          code: data.code || response.status,
          timestamp: Date.now(),
        };

        // 应用响应拦截器
        let finalResponse = apiResponse;
        for (const interceptor of this.interceptors) {
          if (interceptor.onResponse) {
            finalResponse = await interceptor.onResponse(finalResponse);
          }
        }

        // 缓存响应
        if (finalConfig.enableCache && finalConfig.method === 'GET') {
          const cacheKey = `api_${finalConfig.method}_${finalConfig.url}`;
          const cacheExpire = finalConfig.cacheExpire || 5 * 60 * 1000; // 默认5分钟
          setCache(cacheKey, finalResponse, cacheExpire);
        }

        return finalResponse;

      } catch (error) {
        lastError = this.handleRequestError(error);
        
        // 如果是最后一次尝试，抛出错误
        if (attempt === maxRetries) {
          break;
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    // 应用错误拦截器
    let finalError = lastError!;
    for (const interceptor of this.interceptors) {
      if (interceptor.onError) {
        finalError = await interceptor.onError(finalError);
      }
    }

    throw finalError;
  }

  // 便捷方法
  async get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config,
    });
  }

  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  async patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }
}

// 创建默认实例
export const request = new RequestInstance();

// 导出便捷方法
export const { get, post, put, delete: del, patch } = request;

// 导出类型
export type { ApiError, ApiResponse, RequestConfig, RequestHeaders };

