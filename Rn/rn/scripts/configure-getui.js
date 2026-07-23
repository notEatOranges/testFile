#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 获取当前文件的目录
const __dirname = path.dirname(process.argv[1]);

console.log('🚀 开始配置个推推送服务...');

// 个推配置信息
const getuiConfig = {
  appId: 'zZ6aAw5JuE6LMn3OvTrW43',
  appKey: 'xj6TBQAoMb5BMPWgJLv4M',
  appSecret: 'Uc9FVcLuIh93CG8vkXsWn1'
};

// 更新 Android 配置
function updateAndroidConfig() {
  console.log('📱 更新 Android 配置...');
  
  const androidManifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
  
  if (fs.existsSync(androidManifestPath)) {
    let manifestContent = fs.readFileSync(androidManifestPath, 'utf8');
    
    // 更新个推配置
    manifestContent = manifestContent.replace(
      /android:name="PUSH_APPID" android:value="[^"]*"/g,
      `android:name="PUSH_APPID" android:value="${getuiConfig.appId}"`
    );
    
    manifestContent = manifestContent.replace(
      /android:name="PUSH_APPKEY" android:value="[^"]*"/g,
      `android:name="PUSH_APPKEY" android:value="${getuiConfig.appKey}"`
    );
    
    manifestContent = manifestContent.replace(
      /android:name="PUSH_APPSECRET" android:value="[^"]*"/g,
      `android:name="PUSH_APPSECRET" android:value="${getuiConfig.appSecret}"`
    );
    
    fs.writeFileSync(androidManifestPath, manifestContent);
    console.log('✅ Android 配置更新完成');
  } else {
    console.log('⚠️ Android 配置文件不存在');
  }
}

// 更新 iOS 配置
function updateIOSConfig() {
  console.log('🍎 更新 iOS 配置...');
  
  const iosPath = path.join(__dirname, '../ios');
  if (fs.existsSync(iosPath)) {
    console.log('✅ iOS 目录存在，请手动配置 AppDelegate.m');
    console.log('📝 在 AppDelegate.m 中添加以下代码：');
    console.log('');
    console.log('#import <UserNotifications/UserNotifications.h>');
    console.log('#import <PushKit/PushKit.h>');
    console.log('');
    console.log('// 在 didFinishLaunchingWithOptions 中添加：');
    console.log('[GeTuiSdk startSdkWithAppId:@"' + getuiConfig.appId + '" appKey:@"' + getuiConfig.appKey + '" appSecret:@"' + getuiConfig.appSecret + '" delegate:self];');
  } else {
    console.log('⚠️ iOS 目录不存在');
  }
}

// 更新配置文件
function updateConfigFiles() {
  console.log('⚙️ 更新配置文件...');
  
  // 更新 pushConfig.ts
  const pushConfigPath = path.join(__dirname, '../config/pushConfig.ts');
  if (fs.existsSync(pushConfigPath)) {
    let configContent = fs.readFileSync(pushConfigPath, 'utf8');
    
    // 更新配置值
    configContent = configContent.replace(
      /appId: '[^']*'/g,
      `appId: '${getuiConfig.appId}'`
    );
    
    configContent = configContent.replace(
      /appKey: '[^']*'/g,
      `appKey: '${getuiConfig.appKey}'`
    );
    
    configContent = configContent.replace(
      /appSecret: '[^']*'/g,
      `appSecret: '${getuiConfig.appSecret}'`
    );
    
    fs.writeFileSync(pushConfigPath, configContent);
    console.log('✅ 推送配置文件更新完成');
  }
  
  // 更新 getui.json
  const getuiJsonPath = path.join(__dirname, '../config/getui.json');
  const getuiJsonContent = JSON.stringify(getuiConfig, null, 2);
  fs.writeFileSync(getuiJsonPath, getuiJsonContent);
  console.log('✅ getui.json 配置更新完成');
}

// 显示配置信息
function showConfigInfo() {
  console.log('');
  console.log('📋 个推配置信息：');
  console.log(`   App ID: ${getuiConfig.appId}`);
  console.log(`   App Key: ${getuiConfig.appKey}`);
  console.log(`   App Secret: ${getuiConfig.appSecret}`);
  console.log('');
  console.log('🔧 配置完成！接下来需要：');
  console.log('   1. 运行 npm run android 或 npm run ios 重新构建应用');
  console.log('   2. 确保在个推后台配置了正确的应用信息');
  console.log('   3. 测试推送消息是否正常接收');
  console.log('');
  console.log('📱 推送消息格式示例：');
  console.log('   {');
  console.log('     "title": "测试推送",');
  console.log('     "content": "这是一条测试消息",');
  console.log('     "payload": {');
  console.log('       "page": "message-detail",');
  console.log('       "params": { "messageId": "123" }');
  console.log('     }');
  console.log('   }');
  console.log('');
}

// 主函数
function main() {
  try {
    updateAndroidConfig();
    updateIOSConfig();
    updateConfigFiles();
    showConfigInfo();
    console.log('🎉 个推配置完成！');
  } catch (error) {
    console.error('❌ 配置失败:', error);
    process.exit(1);
  }
}

// 运行配置
main(); 