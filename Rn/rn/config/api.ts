// API配置文件
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryTimes: number;
  enableProxy: boolean;
  proxyConfig?: ProxyConfig;
}

export interface ProxyConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
}

// 环境配置
const ENV = process.env.NODE_ENV || 'development';

// 开发环境配置
const devConfig: ApiConfig = {
  baseURL: 'http://192.168.1.100:8080/api', // 开发环境API地址
  timeout: 10000,
  retryTimes: 3,
  enableProxy: true,
  proxyConfig: {
    host: '127.0.0.1',
    port: 8080,
    protocol: 'http'
  }
};

// 测试环境配置
const testConfig: ApiConfig = {
  baseURL: 'https://test-api.example.com/api',
  timeout: 15000,
  retryTimes: 2,
  enableProxy: false
};

// 生产环境配置
const prodConfig: ApiConfig = {
  baseURL: 'https://api.example.com/api',
  timeout: 20000,
  retryTimes: 1,
  enableProxy: false
};

// 根据环境导出配置
export const apiConfig: ApiConfig = ENV === 'production' 
  ? prodConfig 
  : ENV === 'test' 
    ? testConfig 
    : devConfig;

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    VERIFY_TOKEN: '/auth/verify',
  },
  
  // 用户相关
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/password',
  },
  
  // 待办事项
  TODO: {
    LIST: '/todos',
    CREATE: '/todos',
    UPDATE: '/todos/:id',
    DELETE: '/todos/:id',
    COMPLETE: '/todos/:id/complete',
  },
  
  // 其他API端点
  COMMON: {
    UPLOAD: '/upload',
    DOWNLOAD: '/download/:id',
  }
} as const;

// 请求方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// 请求头类型
export interface RequestHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'Accept'?: string;
  'User-Agent'?: string;
  [key: string]: string | undefined;
}

// 请求配置类型
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  headers?: RequestHeaders;
  timeout?: number;
  retryTimes?: number;
  enableCache?: boolean;
  cacheExpire?: number; // 缓存过期时间（毫秒）
}

// 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code: number;
  timestamp: number;
}

// 错误类型
export interface ApiError {
  code: number;
  message: string;
  details?: any;
  timestamp: number;
} 