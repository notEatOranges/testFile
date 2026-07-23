#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 开始测试构建...');

try {
  // 清理构建缓存
  console.log('🧹 清理构建缓存...');
  execSync('cd android && ./gradlew clean', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // 构建应用
  console.log('🔨 开始构建应用...');
  execSync('npm run android', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ 构建成功！');
  console.log('📱 现在可以测试推送功能了');
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  console.log('💡 请检查以下内容:');
  console.log('  1. 确保Android SDK已正确安装');
  console.log('  2. 确保所有依赖已安装: npm install');
  console.log('  3. 检查个推配置是否正确');
  console.log('  4. 查看详细错误日志');
  
  process.exit(1);
} 