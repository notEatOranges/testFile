/**
 * 环境变量配置文件
 * 用于管理不同环境的配置
 */

// 环境变量配置
const envConfig = {
  // 开发环境
  development: {
    NODE_ENV: 'development',
    TARO_ENV: 'weapp',
    REACT_APP_API_KEY: 'app-7haXaWTBcwgCPssPegXRDeGN',
    REACT_APP_API_BASE_URL: 'http://119.96.26.216/v1',
    BUILD_TYPE: 'development',
    MINI_PROGRAM_APPID: 'your-app-id-here',
    MINI_PROGRAM_SECRET: 'your-app-secret-here',
    REACT_APP_DEV_API_URL: 'http://localhost:3000/api',
    REACT_APP_DEV_DEBUG: true,
    REACT_APP_VOICE_MAX_DURATION: 60000,
    REACT_APP_VOICE_SAMPLE_RATE: 16000,
    REACT_APP_UI_THEME: 'light',
    REACT_APP_UI_SHOW_CONTROLS: true,
    REACT_APP_UI_SHOW_SUGGESTED_QUESTIONS: true
  },
  
  // 生产环境
  production: {
    NODE_ENV: 'production',
    TARO_ENV: 'weapp',
    REACT_APP_API_KEY: 'app-7haXaWTBcwgCPssPegXRDeGN',
    REACT_APP_API_BASE_URL: 'https://api.yourdomain.com/api',
    BUILD_TYPE: 'production',
    MINI_PROGRAM_APPID: 'your-app-id-here',
    MINI_PROGRAM_SECRET: 'your-app-secret-here',
    REACT_APP_PROD_API_URL: 'https://api.yourdomain.com/api',
    REACT_APP_PROD_DEBUG: false,
    REACT_APP_VOICE_MAX_DURATION: 60000,
    REACT_APP_VOICE_SAMPLE_RATE: 16000,
    REACT_APP_UI_THEME: 'auto',
    REACT_APP_UI_SHOW_CONTROLS: true,
    REACT_APP_UI_SHOW_SUGGESTED_QUESTIONS: true
  },
  
  // 测试环境
  test: {
    NODE_ENV: 'test',
    TARO_ENV: 'weapp',
    REACT_APP_API_KEY: 'app-7haXaWTBcwgCPssPegXRDeGN',
    REACT_APP_API_BASE_URL: 'http://test-api.yourdomain.com/api',
    BUILD_TYPE: 'test',
    MINI_PROGRAM_APPID: 'your-test-app-id-here',
    MINI_PROGRAM_SECRET: 'your-test-app-secret-here',
    REACT_APP_TEST_API_URL: 'http://test-api.yourdomain.com/api',
    REACT_APP_TEST_DEBUG: true,
    REACT_APP_VOICE_MAX_DURATION: 30000,
    REACT_APP_VOICE_SAMPLE_RATE: 16000,
    REACT_APP_UI_THEME: 'light',
    REACT_APP_UI_SHOW_CONTROLS: true,
    REACT_APP_UI_SHOW_SUGGESTED_QUESTIONS: true
  }
}

// 获取当前环境
const getCurrentEnv = () => {
  // 小程序环境兼容 - 默认使用开发环境
  return 'development'
}

// 获取环境配置
const getEnvConfig = (env = getCurrentEnv()) => {
  return envConfig[env] || envConfig.development
}

// 获取特定环境变量
const getEnvVar = (key, defaultValue = '') => {
  const config = getEnvConfig()
  return config[key] || defaultValue
}

// 导出配置
export default {
  getCurrentEnv,
  getEnvConfig,
  getEnvVar,
  envConfig
}

// 导出常用环境变量
export const NODE_ENV = getEnvVar('NODE_ENV', 'development')
export const TARO_ENV = getEnvVar('TARO_ENV', 'weapp')
export const REACT_APP_API_KEY = getEnvVar('REACT_APP_API_KEY', 'app-7haXaWTBcwgCPssPegXRDeGN')
export const REACT_APP_API_BASE_URL = getEnvVar('REACT_APP_API_BASE_URL', 'http://119.96.26.216/v1')
export const BUILD_TYPE = getEnvVar('BUILD_TYPE', 'development') 