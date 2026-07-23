// 个推推送配置
import { Platform } from 'react-native';

export const pushConfig = {
  // 开发环境配置
  development: {
    android: {
      appId: 'zZ6aAw5JuE6LMn3OvTrW43',
      appKey: 'xj6TBQAoMb5BMPWgJLv4M',
      appSecret: 'Uc9FVcLuIh93CG8vkXsWn1',
    },
    ios: {
      appId: 'zZ6aAw5JuE6LMn3OvTrW43',
      appKey: 'xj6TBQAoMb5BMPWgJLv4M',
      appSecret: 'Uc9FVcLuIh93CG8vkXsWn1',
    },
  },
  // npm run GetuiConfigure zZ6aAw5JuE6LMn3OvTrW43 xj6TBQAoMb5BMPWgJLv4M Uc9FVcLuIh93CG8vkXsWn1
  // 生产环境配置
  production: {
    android: {
      appId: 'zZ6aAw5JuE6LMn3OvTrW43',
      appKey: 'xj6TBQAoMb5BMPWgJLv4M',
      appSecret: 'Uc9FVcLuIh93CG8vkXsWn1',
    },
    ios: {
      appId: 'zZ6aAw5JuE6LMn3OvTrW43',
      appKey: 'xj6TBQAoMb5BMPWgJLv4M',
      appSecret: 'Uc9FVcLuIh93CG8vkXsWn1',
    },
  },
};

// 获取当前环境的配置
export const getPushConfig = () => {
  const isDev = __DEV__;
  const platform = Platform.OS;
  
  const config = isDev ? pushConfig.development : pushConfig.production;
  return config[platform as keyof typeof config];
};

// 推送消息类型
export const pushMessageTypes = {
  NOTIFICATION: 'notification', // 通知消息
  PAYLOAD: 'payload', // 透传消息
  COMMAND: 'command', // 命令消息
};

// 推送操作类型
export const pushActionTypes = {
  NAVIGATE: 'navigate', // 导航
  OPEN_URL: 'open_url', // 打开链接
  SHOW_ALERT: 'show_alert', // 显示弹窗
  UPDATE_BADGE: 'update_badge', // 更新角标
  CUSTOM_ACTION: 'custom_action', // 自定义操作
};

// 默认推送设置
export const defaultPushSettings = {
  enableNotification: true, // 开启通知
  enableSound: true, // 开启声音
  enableVibration: true, // 开启震动
  enableBadge: true, // 开启角标
  enableBackground: true, // 开启后台运行
}; 