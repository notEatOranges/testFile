// API服务层
import { clearToken, storeToken } from '../utils/token';

// 用户相关接口
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 登录请求参数
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 待办事项接口
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建待办请求
export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

// 更新待办请求
export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

// 指纹登录相关接口
export interface BiometricLoginRequest {
  deviceId: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  challenge?: string; // 用于防止重放攻击
  encryptedCredentials?: string; // 加密的凭据
  publicKey?: string; // 公钥
  signature?: string; // 数字签名
}

export interface BiometricLoginResponse {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  message: string;
}

export interface BiometricSetupRequest {
  userId: string;
  deviceId: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  publicKey?: string; // 用于加密的公共密钥
  encryptedCredentials?: string; // 加密的凭据
  signature?: string; // 数字签名
}

// 认证相关API
export const api = {
  // 登录
  async login(credentials: LoginRequest) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟登录验证
      if (credentials.username === 'admin' && credentials.password === 'password') {
        const user: User = {
          id: '1',
          username: credentials.username,
          email: 'admin@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const response: LoginResponse = {
          user,
          accessToken: 'mock_access_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          expiresIn: 3600,
        };

        // 存储token
        await storeToken({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn,
          tokenType: 'Bearer',
        });

        return {
          success: true,
          data: response,
          message: '登录成功',
        };
      } else {
        return {
          success: false,
          message: '用户名或密码错误',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '登录失败',
      };
    }
  },

  // 指纹登录（简化版）
  async biometricLogin(request: BiometricLoginRequest): Promise<BiometricLoginResponse> {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟指纹登录验证
      const user: User = {
        id: '1',
        username: 'biometric_user',
        email: 'biometric@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = {
        success: true,
        data: {
          user,
          accessToken: 'biometric_access_token_' + Date.now(),
          refreshToken: 'biometric_refresh_token_' + Date.now(),
          expiresIn: 3600,
        },
        message: '指纹登录成功',
      };

      // 存储token
      if (response.success && response.data) {
        await storeToken({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn,
          tokenType: 'Bearer',
        });
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '指纹登录失败',
      };
    }
  },

  // 设置指纹登录（简化版）
  async setupBiometricLogin(request: BiometricSetupRequest) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        data: {
          deviceId: request.deviceId,
          biometricType: request.biometricType,
          setupAt: new Date().toISOString(),
        },
        message: '指纹登录设置成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '指纹登录设置失败',
      };
    }
  },

  // 检查指纹登录状态
  async checkBiometricStatus(deviceId: string) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          isEnabled: true,
          deviceId,
          biometricType: 'fingerprint',
          lastUsed: new Date().toISOString(),
        },
        message: '获取指纹登录状态成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '获取指纹登录状态失败',
      };
    }
  },

  // 禁用指纹登录
  async disableBiometricLogin(deviceId: string) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        data: {
          deviceId,
          disabledAt: new Date().toISOString(),
        },
        message: '指纹登录已禁用',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '禁用指纹登录失败',
      };
    }
  },

  // 登出
  async logout() {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.warn('登出API调用失败:', error);
    } finally {
      // 无论API是否成功，都清除本地token
      await clearToken();
    }
  },

  // 验证token
  async verifyToken() {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        message: 'Token验证成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Token验证失败',
      };
    }
  },

  // 刷新token
  async refreshToken() {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTokens = {
        accessToken: 'new_access_token_' + Date.now(),
        refreshToken: 'new_refresh_token_' + Date.now(),
        expiresIn: 3600,
      };

      // 存储新token
      await storeToken({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
        tokenType: 'Bearer',
      });

      return {
        success: true,
        data: newTokens,
        message: 'Token刷新成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Token刷新失败',
      };
    }
  },
};

// 用户相关API
export const userAPI = {
  // 获取用户资料
  async getProfile() {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user: User = {
        id: '1',
        username: 'current_user',
        email: 'user@example.com',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: user,
        message: '获取用户信息成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '获取用户信息失败',
      };
    }
  },

  // 更新用户资料
  async updateProfile(data: Partial<User>) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        data: {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        message: '更新用户信息成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '更新用户信息失败',
      };
    }
  },

  // 修改密码
  async changePassword(oldPassword: string, newPassword: string) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: '密码修改成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '密码修改失败',
      };
    }
  },
};

// 待办事项API
export const todoAPI = {
  // 获取待办列表
  async getTodos(params?: {
    page?: number;
    limit?: number;
    completed?: boolean;
    priority?: string;
  }) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 模拟待办事项数据
      const todos: Todo[] = [
        {
          id: '1',
          title: '完成项目文档',
          description: '编写项目技术文档和用户手册',
          completed: false,
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: '代码审查',
          description: '审查团队成员的代码提交',
          completed: true,
          priority: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: '学习新技术',
          description: '学习React Native新特性',
          completed: false,
          priority: 'low',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      return {
        success: true,
        data: {
          todos,
          total: todos.length,
          page: params?.page || 1,
          limit: params?.limit || 10,
        },
        message: '获取待办事项成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '获取待办事项失败',
      };
    }
  },

  // 创建待办
  async createTodo(data: CreateTodoRequest) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newTodo: Todo = {
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        completed: false,
        priority: data.priority || 'medium',
        dueDate: data.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: newTodo,
        message: '创建待办事项成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '创建待办事项失败',
      };
    }
  },

  // 更新待办
  async updateTodo(id: string, data: UpdateTodoRequest) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const updatedTodo: Todo = {
        id,
        title: data.title || 'Updated Todo',
        description: data.description,
        completed: data.completed || false,
        priority: data.priority || 'medium',
        dueDate: data.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: updatedTodo,
        message: '更新待办事项成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '更新待办事项失败',
      };
    }
  },

  // 删除待办
  async deleteTodo(id: string) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: '删除待办事项成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '删除待办事项失败',
      };
    }
  },

  // 完成待办
  async completeTodo(id: string) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        success: true,
        message: '待办事项已完成',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '完成待办事项失败',
      };
    }
  },
};

// 文件上传API
export const uploadAPI = {
  // 上传文件
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    try {
      // 模拟上传进度
      for (let i = 0; i <= 100; i += 10) {
        onProgress?.(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return {
        success: true,
        data: {
          fileId: 'file_' + Date.now(),
          fileName: file.name,
          fileSize: file.size,
          uploadUrl: 'https://example.com/uploads/' + file.name,
        },
        message: '文件上传成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '文件上传失败',
      };
    }
  },

  // 下载文件
  async downloadFile(id: string) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        data: {
          fileId: id,
          fileName: 'downloaded_file.pdf',
          fileSize: 1024 * 1024, // 1MB
          downloadUrl: 'https://example.com/downloads/' + id,
        },
        message: '文件下载成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '文件下载失败',
      };
    }
  },
};

// 导出所有API
export const allAPI = {
  auth: api,
  user: userAPI,
  todo: todoAPI,
  upload: uploadAPI,
};

// 默认导出
export default allAPI; 