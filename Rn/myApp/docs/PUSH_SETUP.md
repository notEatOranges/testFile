# 个推推送配置指南

## 概述

本项目已集成 `react-native-getui` 推送服务，支持Android和iOS平台的推送消息接收和处理。

## 配置步骤

### 1. 注册个推开发者账号

1. 访问 [个推官网](https://www.getui.com/)
2. 注册开发者账号
3. 创建应用并获取配置信息

### 2. 获取配置信息

在个推控制台获取以下信息：
- **AppID**: 应用的唯一标识
- **AppKey**: 应用的密钥
- **AppSecret**: 应用的密钥

### 3. 配置应用

#### 修改配置文件

编辑 `config/pushConfig.ts` 文件，填入您的配置信息：

```typescript
export const pushConfig = {
  development: {
    android: {
      appId: '您的Android开发环境AppID',
      appKey: '您的Android开发环境AppKey',
      appSecret: '您的Android开发环境AppSecret',
    },
    ios: {
      appId: '您的iOS开发环境AppID',
      appKey: '您的iOS开发环境AppKey',
      appSecret: '您的iOS开发环境AppSecret',
    },
  },
  production: {
    android: {
      appId: '您的Android生产环境AppID',
      appKey: '您的Android生产环境AppKey',
      appSecret: '您的Android生产环境AppSecret',
    },
    ios: {
      appId: '您的iOS生产环境AppID',
      appKey: '您的iOS生产环境AppKey',
      appSecret: '您的iOS生产环境AppSecret',
    },
  },
};
```

### 4. Android配置

#### 4.1 修改AndroidManifest.xml

在 `android/app/src/main/AndroidManifest.xml` 中添加权限：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

#### 4.2 添加个推服务

在 `<application>` 标签内添加：

```xml
<service
    android:name="com.igexin.sdk.PushService"
    android:exported="true" />
<receiver
    android:name="com.igexin.sdk.PushReceiver"
    android:exported="true">
    <intent-filter>
        <action android:name="com.igexin.sdk.action.refreshls" />
        <action android:name="android.intent.action.USER_PRESENT" />
        <action android:name="android.net.conn.CONNECTIVITY_CHANGE" />
    </intent-filter>
</receiver>
<receiver
    android:name="com.igexin.sdk.PushManagerReceiver"
    android:exported="true">
    <intent-filter>
        <action android:name="com.igexin.sdk.action.pushmanager" />
    </intent-filter>
</receiver>
```

### 5. iOS配置

#### 5.1 配置推送证书

1. 在Apple Developer Console创建推送证书
2. 下载并安装证书
3. 在个推控制台上传证书

#### 5.2 修改AppDelegate

在 `ios/YourApp/AppDelegate.m` 中添加：

```objc
#import <UserNotifications/UserNotifications.h>

// 在 didFinishLaunchingWithOptions 中添加
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // 请求推送权限
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  [center requestAuthorizationWithOptions:(UNAuthorizationOptionBadge | UNAuthorizationOptionSound | UNAuthorizationOptionAlert) completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (granted) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [[UIApplication sharedApplication] registerForRemoteNotifications];
      });
    }
  }];
  
  return YES;
}

// 实现推送代理方法
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  // 注册设备Token到个推
  NSString *token = [[deviceToken description] stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"<>"]];
  token = [token stringByReplacingOccurrencesOfString:@" " withString:@""];
  
  // 调用个推SDK注册方法
  // [GeTuiSdk registerDeviceToken:token];
}
```

## 使用方法

### 1. 初始化推送服务

应用启动时会自动初始化推送服务：

```typescript
import { pushService } from '../services/pushService';

// 初始化
await pushService.initialize();
```

### 2. 获取CID

```typescript
const cid = await pushService.getClientId();
console.log('CID:', cid);
```

### 3. 绑定别名

```typescript
// 绑定用户别名，用于精准推送
pushService.bindAlias('user123');
```

### 4. 设置标签

```typescript
// 设置用户标签，用于分组推送
pushService.setTags(['vip', 'android']);
```

### 5. 推送控制

```typescript
// 开启推送
pushService.turnOnPush();

// 关闭推送
pushService.turnOffPush();

// 清除通知
pushService.clearAllNotifications();
```

## 推送消息处理

### 1. 透传消息

透传消息不会在通知栏显示，直接传递给应用处理：

```typescript
// 在 pushService.ts 中的 handlePayloadMessage 方法处理
private handlePayloadMessage(payload: any): void {
  console.log('收到透传消息:', payload);
  // 自定义处理逻辑
}
```

### 2. 通知消息

通知消息会在通知栏显示：

```typescript
// 在 pushService.ts 中的 handleNotificationMessage 方法处理
private handleNotificationMessage(notification: any): void {
  console.log('收到通知消息:', notification);
  // 自定义处理逻辑
}
```

### 3. 通知点击

用户点击通知时的处理：

```typescript
// 在 pushService.ts 中的 handleNotificationClick 方法处理
private handleNotificationClick(notification: any): void {
  console.log('用户点击了通知:', notification);
  // 自定义处理逻辑，如跳转页面
}
```

## 测试推送

### 1. 使用个推控制台

1. 登录个推控制台
2. 选择您的应用
3. 进入"推送管理" -> "创建推送"
4. 选择推送类型和受众
5. 发送测试推送

### 2. 使用API接口

```bash
# 发送单推（通过CID）
curl -X POST "https://restapi.getui.com/v2/{appId}/push/single/cid" \
  -H "Content-Type: application/json" \
  -H "token: {token}" \
  -d '{
    "request_id": "test_request_id",
    "settings": {
      "ttl": 3600000
    },
    "audience": {
      "cid": ["your_cid_here"]
    },
    "push_message": {
      "notification": {
        "title": "测试标题",
        "body": "测试内容"
      },
      "transmission": "透传内容"
    }
  }'
```

## 常见问题

### 1. CID获取失败

- 检查网络连接
- 确认个推配置正确
- 查看控制台日志

### 2. 推送收不到

- 检查推送权限是否开启
- 确认设备Token是否正确
- 验证推送证书配置

### 3. 通知不显示

- 检查应用是否在前台
- 确认通知权限已授权
- 验证通知渠道配置（Android 8.0+）

## 注意事项

1. **隐私合规**: 确保推送功能符合相关隐私法规
2. **用户体验**: 避免过度推送，影响用户体验
3. **测试环境**: 开发时使用测试证书，生产环境使用正式证书
4. **错误处理**: 添加适当的错误处理和重试机制
5. **性能优化**: 合理使用推送，避免影响应用性能

## 相关链接

- [个推官方文档](https://docs.getui.com/)
- [React Native Getui](https://github.com/GetuiLaboratory/react-native-getui)
- [个推控制台](https://dev.getui.com/) 