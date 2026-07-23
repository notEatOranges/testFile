import Taro from '@tarojs/taro';
import { ConfigUtils } from '../config';

// 获取访问令牌
export const getAccessToken = () => {
  return 'app-7haXaWTBcwgCPssPegXRDeGN' || Taro.getStorageSync('access_token');
};

// 获取用户标识
export const getUserId = () => {
  // 从本地存储获取用户ID，如果没有则生成一个
  let userId = Taro.getStorageSync('user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    Taro.setStorageSync('user_id', userId);
  }
  return userId;
};

// 处理API错误
export const handleAPIError = (error, operation = '操作') => {
  console.error(`${operation}失败:`, error);
  let errorMessage = '网络错误，请检查网络连接';

  if (error.statusCode) {
    switch (error.statusCode) {
      case 401:
        errorMessage = '认证失败，请重新登录';
        break;
      case 403:
        errorMessage = '权限不足';
        break;
      case 404:
        errorMessage = 'API接口不存在';
        break;
      case 500:
        errorMessage = '服务器内部错误';
        break;
      case 502:
        errorMessage = '网关错误，服务器暂时不可用';
        break;
      case 503:
        errorMessage = '服务暂时不可用';
        break;
      case 504:
        errorMessage = '网关超时';
        break;
      default:
        errorMessage = `请求失败 (${error.statusCode})`;
    }
  } else if (error.errMsg) {
    errorMessage = error.errMsg;
  }

  return errorMessage;
};

import { API_CONSTANTS } from './constants';

// 测试API连接
export const testAPIConnection = async (config) => {
  try {
    const apiUrl = ConfigUtils.getApiUrl(config.api.chatMessages);
    console.log('Testing API connection to:', apiUrl);

    const response = await Taro.request({
      url: apiUrl,
      method: 'GET',
      header: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      timeout: API_CONSTANTS.TIMEOUT,
    });

    console.log('API test response:', response);
    return { success: true, statusCode: response.statusCode };
  } catch (error) {
    console.error('API连接测试失败:', error);
    return { success: false, error: error.message };
  }
};
