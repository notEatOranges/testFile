#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 获取当前文件的目录
const __dirname = process.cwd();

// 个推配置参数
const appId = process.argv[2];
const appKey = process.argv[3];
const appSecret = process.argv[4];

if (!appId || !appKey || !appSecret) {
  console.error('❌ 请提供个推配置参数');
  console.log('使用方法: node scripts/configure-getui.js <appId> <appKey> <appSecret>');
  console.log('示例: node scripts/configure-getui.js zZ6aAw5JuE6LMn3OvTrW43 xj6TBQAoMb5BMPWgJLv4M Uc9FVcLuIh93CG8vkXsWn1');
  process.exit(1);
}

console.log('🚀 开始配置个推SDK...');
console.log(`📋 配置信息:`);
console.log(`  AppID: ${appId}`);
console.log(`  AppKey: ${appKey}`);
console.log(`  AppSecret: ${appSecret}`);

// 更新配置文件
const configPath = path.join(__dirname, '../config/pushConfig.ts');
const configContent = `// 个推推送配置
import { Platform } from 'react-native';

export const pushConfig = {
  // 开发环境配置
  development: {
    android: {
      appId: '${appId}',
      appKey: '${appKey}',
      appSecret: '${appSecret}',
    },
    ios: {
      appId: '${appId}',
      appKey: '${appKey}',
      appSecret: '${appSecret}',
    },
  },
  // 生产环境配置
  production: {
    android: {
      appId: '${appId}',
      appKey: '${appKey}',
      appSecret: '${appSecret}',
    },
    ios: {
      appId: '${appId}',
      appKey: '${appKey}',
      appSecret: '${appSecret}',
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
`;

try {
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ 配置文件更新成功:', configPath);
} catch (error) {
  console.error('❌ 配置文件更新失败:', error);
  process.exit(1);
}

// 运行个推官方配置脚本
const { execSync } = require('child_process');
try {
  console.log('🔄 运行个推官方配置脚本...');
  execSync(`npm run GetuiConfigure ${appId} ${appKey} ${appSecret}`, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ 个推官方配置完成');
} catch (error) {
  console.error('❌ 个推官方配置失败:', error.message);
  console.log('💡 请手动运行: npm run GetuiConfigure <appId> <appKey> <appSecret>');
}

console.log('🎉 个推配置完成！');
console.log('📝 下一步:');
console.log('  1. 重新构建应用: npm run android');
console.log('  2. 测试推送功能: 打开应用 -> 推送测试');
console.log('  3. 查看日志: adb logcat | grep -E "(Getui|Push)"'); 