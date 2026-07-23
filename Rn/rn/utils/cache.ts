// 缓存管理工具
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expireTime: number;
}

// 内存缓存存储
const memoryCache = new Map<string, CacheItem>();

// 存储数据到缓存
export const setCache = <T>(key: string, data: T, expireTime: number = 5 * 60 * 1000): void => {
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    expireTime: Date.now() + expireTime,
  };
  
  memoryCache.set(key, cacheItem);
  
  // 同时存储到本地存储（如果可用）
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(cacheItem));
    }
  } catch (error) {
    console.warn('存储到本地缓存失败:', error);
  }
};

// 从缓存获取数据
export const getCache = <T>(key: string): T | null => {
  // 先从内存缓存获取
  const memoryItem = memoryCache.get(key);
  if (memoryItem && Date.now() < memoryItem.expireTime) {
    return memoryItem.data;
  }
  
  // 如果内存中没有或已过期，尝试从本地存储获取
  try {
    if (typeof localStorage !== 'undefined') {
      const localItem = localStorage.getItem(key);
      if (localItem) {
        const cacheItem: CacheItem<T> = JSON.parse(localItem);
        if (Date.now() < cacheItem.expireTime) {
          // 更新内存缓存
          memoryCache.set(key, cacheItem);
          return cacheItem.data;
        } else {
          // 已过期，清除
          localStorage.removeItem(key);
          memoryCache.delete(key);
        }
      }
    }
  } catch (error) {
    console.warn('从本地缓存获取失败:', error);
  }
  
  return null;
};

// 清除缓存
export const clearCache = (key?: string): void => {
  if (key) {
    memoryCache.delete(key);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('清除本地缓存失败:', error);
    }
  } else {
    // 清除所有缓存
    memoryCache.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (error) {
      console.warn('清除所有本地缓存失败:', error);
    }
  }
};

// 检查缓存是否存在且未过期
export const hasCache = (key: string): boolean => {
  return getCache(key) !== null;
};

// 获取缓存信息
export const getCacheInfo = (key: string): { exists: boolean; expireTime?: number } => {
  const memoryItem = memoryCache.get(key);
  if (memoryItem) {
    return {
      exists: Date.now() < memoryItem.expireTime,
      expireTime: memoryItem.expireTime,
    };
  }
  
  try {
    if (typeof localStorage !== 'undefined') {
      const localItem = localStorage.getItem(key);
      if (localItem) {
        const cacheItem: CacheItem = JSON.parse(localItem);
        return {
          exists: Date.now() < cacheItem.expireTime,
          expireTime: cacheItem.expireTime,
        };
      }
    }
  } catch (error) {
    console.warn('获取缓存信息失败:', error);
  }
  
  return { exists: false };
}; 