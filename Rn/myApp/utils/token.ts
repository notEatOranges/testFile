// Token管理工具
import { clearCache, getCache, setCache } from './cache';

// 存储键名
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRE_KEY = 'token_expire';

// Token信息接口
export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 过期时间戳
  tokenType: string; // 通常是 'Bearer'
}

// 获取存储的token
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = getCache<string>(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('获取token失败:', error);
    return null;
  }
};

// 获取刷新token
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getCache<string>(REFRESH_TOKEN_KEY);
    return refreshToken;
  } catch (error) {
    console.error('获取刷新token失败:', error);
    return null;
  }
};

// 存储token信息
export const storeToken = async (tokenInfo: TokenInfo): Promise<void> => {
  try {
    // 计算过期时间（毫秒）
    const expireTime = tokenInfo.expiresIn - Date.now();
    
    setCache(TOKEN_KEY, tokenInfo.accessToken, expireTime);
    setCache(REFRESH_TOKEN_KEY, tokenInfo.refreshToken, expireTime + 24 * 60 * 60 * 1000); // 刷新token多保存1天
    setCache(TOKEN_EXPIRE_KEY, tokenInfo.expiresIn, expireTime);
  } catch (error) {
    console.error('存储token失败:', error);
    throw error;
  }
};

// 清除token
export const clearToken = async (): Promise<void> => {
  try {
    clearCache(TOKEN_KEY);
    clearCache(REFRESH_TOKEN_KEY);
    clearCache(TOKEN_EXPIRE_KEY);
  } catch (error) {
    console.error('清除token失败:', error);
    throw error;
  }
};

// 检查token是否过期
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const expireTime = getCache<number>(TOKEN_EXPIRE_KEY);
    if (!expireTime) return true;
    
    const currentTimestamp = Date.now();
    
    // 提前5分钟认为过期，给刷新留出时间
    return currentTimestamp >= (expireTime - 5 * 60 * 1000);
  } catch (error) {
    console.error('检查token过期失败:', error);
    return true;
  }
};

// 获取完整的token信息
export const getTokenInfo = async (): Promise<TokenInfo | null> => {
  try {
    const accessToken = getCache<string>(TOKEN_KEY);
    const refreshToken = getCache<string>(REFRESH_TOKEN_KEY);
    const expiresIn = getCache<number>(TOKEN_EXPIRE_KEY);
    
    if (!accessToken || !refreshToken || !expiresIn) {
      return null;
    }
    
    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  } catch (error) {
    console.error('获取token信息失败:', error);
    return null;
  }
};

// 格式化Authorization头
export const formatAuthHeader = (token: string, tokenType: string = 'Bearer'): string => {
  return `${tokenType} ${token}`;
};

// 从Authorization头中提取token
export const extractTokenFromHeader = (authHeader: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // 移除 'Bearer ' 前缀
}; 