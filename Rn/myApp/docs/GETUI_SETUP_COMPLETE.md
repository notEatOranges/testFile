# 个推推送完整配置指南

## 🎉 配置完成！

您的React Native应用已经完成了react-native-getui的推送接入配置。以下是配置的详细说明和使用指南。

## 📋 已完成的配置

### 1. 原生模块配置
- ✅ 创建了 `GetuiModule.kt` - 个推原生模块
- ✅ 创建了 `GetuiPackage.kt` - 个推包管理器
- ✅ 创建了 `GetuiIntentService.kt` - 个推消息处理服务
- ✅ 修改了 `MainApplication.kt` - 注册个推包
- ✅ 修改了 `MainActivity.kt` - 添加消息接收器
- ✅ 修改了 `AndroidManifest.xml` - 添加个推服务配置

### 2. JavaScript层配置
- ✅ 改进了 `pushService.ts` - 推送服务逻辑
- ✅ 修改了 `_layout.tsx` - 应用启动时初始化推送
- ✅ 改进了 `push-test.tsx` - 推送测试页面
- ✅ 更新了 `pushConfig.ts` - 推送配置

### 3. 工具脚本
- ✅ 创建了 `configure-getui.js` - 自动配置脚本

## 🚀 快速开始

### 1. 配置个推参数
```bash
# 使用自动配置脚本
npm run configure-getui <appId> <appKey> <appSecret>

# 示例
npm run configure-getui zZ6aAw5JuE6LMn3OvTrW43 xj6TBQAoMb5BMPWgJLv4M Uc9FVcLuIh93CG8vkXsWn1
```

### 2. 重新构建应用
```bash
# Android
npm run android

# iOS
npm run ios
```

### 3. 测试推送功能
1. 打开应用
2. 进入"推送测试"页面
3. 查看CID是否获取成功
4. 测试各种推送功能

## 🔧 功能特性

### 1. 自动初始化
- 应用启动时自动初始化个推SDK
- 智能重试机制，提高CID获取成功率
- 支持网络状态检查

### 2. 稳定的CID获取
- 8次重试机制，使用指数退避算法
- 支持原生模块和回退方法
- 实时网络状态检查

### 3. 完整的消息处理
- 透传消息处理
- 通知消息处理
- 通知点击处理
- 命令消息处理

### 4. 调试功能
- 详细的日志输出
- 调试信息显示
- 网络状态检查
- 错误处理和提示

## 📱 推送测试

### 1. 获取CID
在推送测试页面，您可以：
- 查看当前CID
- 手动刷新CID
- 复制CID到剪贴板

### 2. 推送控制
- 开启/关闭推送
- 清除所有通知
- 检查推送状态

### 3. 用户管理
- 绑定/解绑别名
- 设置用户标签
- 发送测试消息

## 🔍 调试和故障排除

### 1. 查看日志
```bash
# Android日志
adb logcat | grep -E "(Getui|Push|MainActivity)"

# 过滤个推相关日志
adb logcat | grep -E "(GetuiModule|GetuiIntentService|MainActivity)"
```

### 2. 常见问题

#### CID获取失败
- 检查网络连接
- 确保个推配置正确
- 等待3-5秒让SDK完全启动
- 使用手动刷新功能

#### 推送消息不显示
- 检查应用权限
- 确保推送服务已开启
- 查看通知设置

#### 应用崩溃
- 检查原生模块是否正确编译
- 查看错误日志
- 确保所有依赖已安装

### 3. 网络测试
```bash
# 测试个推服务器连接
curl -I https://www.getui.com

# 测试推送API
curl -X POST "https://restapi.getui.com/v2/{appId}/push/single/cid" \
  -H "Content-Type: application/json" \
  -H "token: {token}" \
  -d '{
    "request_id": "test_001",
    "settings": {
      "ttl": 3600000
    },
    "audience": {
      "cid": ["{clientId}"]
    },
    "push_message": {
      "notification": {
        "title": "测试标题",
        "body": "测试内容"
      }
    }
  }'
```

## 📚 API参考

### PushService 方法

#### 初始化
```typescript
await pushService.initialize();
```

#### 获取CID
```typescript
const cid = await pushService.getClientId();
const cid = await pushService.forceRefreshClientId();
```

#### 推送控制
```typescript
pushService.turnOnPush();
pushService.turnOffPush();
pushService.clearAllNotifications();
```

#### 用户管理
```typescript
pushService.bindAlias('user123');
pushService.unbindAlias('user123');
pushService.setTags(['vip', 'android']);
```

#### 状态检查
```typescript
const status = await pushService.getStatus();
const version = await pushService.getVersion();
const hasNetwork = await pushService.checkNetworkConnection();
```

## 🔐 安全注意事项

1. **保护配置信息**
   - 不要在代码中硬编码AppSecret
   - 使用环境变量或配置文件
   - 定期更新密钥

2. **权限管理**
   - 只请求必要的权限
   - 向用户说明权限用途
   - 遵循最小权限原则

3. **数据安全**
   - 加密敏感数据
   - 安全传输CID
   - 保护用户隐私

## 📞 技术支持

如果遇到问题，请：

1. 查看控制台日志
2. 检查网络连接
3. 验证个推配置
4. 参考官方文档
5. 联系技术支持

## 🔗 相关链接

- [个推官方文档](https://docs.getui.com/)
- [React Native Getui](https://github.com/GetuiLaboratory/react-native-getui)
- [个推控制台](https://dev.getui.com/)
- [推送测试工具](https://dev.getui.com/console/push)

---

🎉 **恭喜！您的应用已经成功集成了个推推送服务！** 