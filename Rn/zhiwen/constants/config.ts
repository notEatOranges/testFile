// 应用配置文件
export const APP_CONFIG = {
  // 个推配置
  GETUI: {
    // 请替换为您的个推应用配置
    APP_ID: 'zZ6aAw5JuE6LMn3OvTrW43',
    APP_KEY: 'xj6TBQAoMb5BMPWgJLv4M', 
    APP_SECRET: 'Uc9FVcLuIh93CG8vkXsWn1',
  },
  
  // 应用信息
  APP: {
    NAME: '指纹登录 & 推送',
    VERSION: '1.0.0',
  },
  
  // 功能开关
  FEATURES: {
    BIOMETRIC_AUTH: true,
    PUSH_NOTIFICATIONS: true,
  },
};

// 开发环境配置
export const DEV_CONFIG = {
  // 开发环境下的个推配置（可选）
  GETUI: {
    APP_ID: 'zZ6aAw5JuE6LMn3OvTrW43',
    APP_KEY: 'xj6TBQAoMb5BMPWgJLv4M', 
    APP_SECRET: 'Uc9FVcLuIh93CG8vkXsWn1',
  },
};

// 生产环境配置
export const PROD_CONFIG = {
  // 生产环境下的个推配置
  GETUI: {
    APP_ID: 'zZ6aAw5JuE6LMn3OvTrW43',
    APP_KEY: 'xj6TBQAoMb5BMPWgJLv4M', 
    APP_SECRET: 'Uc9FVcLuIh93CG8vkXsWn1',
  },
};

// 根据环境获取配置
export const getConfig = () => {
  const isDev = __DEV__;
  return isDev ? { ...APP_CONFIG, ...DEV_CONFIG } : { ...APP_CONFIG, ...PROD_CONFIG };
}; 