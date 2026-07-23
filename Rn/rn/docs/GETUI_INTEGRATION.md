# 个推推送服务集成说明

## 概述

本项目已成功集成了个推（`reactnative-getui`）推送服务，支持接收推送消息并实现点击推送消息打开指定页面的功能。

## 功能特性

- ✅ 自动初始化个推SDK
- ✅ 接收透传消息和通知消息
- ✅ 点击推送消息自动跳转指定页面
- ✅ 支持自定义参数传递
- ✅ 完整的错误处理和降级机制
- ✅ 实时日志记录和调试信息

## 配置信息

### 个推应用配置
- **App ID**: `zZ6aAw5JuE6LMn3OvTrW43`
- **App Key**: `xj6TBQAoMb5BMPWgJLv4M`
- **App Secret**: `Uc9FVcLuIh93CG8vkXsWn1`

### 环境配置
- 开发环境：使用 `development` 配置
- 生产环境：使用 `production` 配置
- 自动根据 `__DEV__` 标志切换

## 推送消息格式

### 1. 基础推送消息
```json
{
  "title": "消息标题",
  "content": "消息内容",
  "messageId": "unique_message_id",
  "taskId": "unique_task_id"
}
```

### 2. 带页面跳转的推送消息
```json
{
  "title": "点击查看详情",
  "content": "这是一条重要消息",
  "messageId": "msg_123",
  "taskId": "task_456",
  "payload": {
    "page": "message-detail",
    "params": {
      "messageId": "msg_123",
      "type": "important"
    }
  }
}
```

### 3. 透传消息格式
```json
{
  "type": "payload",
  "payload": {
    "page": "push-test",
    "params": {
      "action": "test",
      "data": "test_data"
    }
  }
}
```

## 支持的页面跳转

| 页面名称 | 路由路径 | 说明 |
|---------|---------|------|
| `message-detail` | `/message-detail` | 消息详情页 |
| `message-center` | `/message-center` | 消息中心页 |
| `push-test` | `/push-test` | 推送测试页 |
| `push-debug` | `/push-debug` | 推送调试页 |
| `login` | `/login` | 登录页 |
| `fingerprint-steps` | `/fingerprint-steps` | 指纹设置页 |
| `index` 或 `Home` | `/` | 首页 |

## 使用方法

### 1. 发送推送消息

在个推后台发送推送消息时，在**自定义消息**或**透传消息**中添加以下格式的 payload：

```json
{
  "page": "message-detail",
  "params": {
    "messageId": "your_message_id",
    "title": "自定义标题",
    "content": "自定义内容"
  }
}
```

### 2. 测试推送功能

1. 打开应用，进入**推送测试**页面
2. 点击**获取 Client ID** 获取设备标识
3. 使用个推后台向该 Client ID 发送测试消息
4. 观察应用是否正常接收并处理消息

### 3. 测试页面跳转

1. 在推送测试页面设置目标页面和参数
2. 点击**测试页面跳转**按钮
3. 观察应用是否正常跳转到指定页面

## 技术实现

### 1. 推送服务架构

```
PushService (推送服务)
├── 初始化个推SDK
├── 监听推送事件
├── 处理消息点击
├── 解析payload参数
└── 触发页面跳转

NavigationService (导航服务)
├── 事件监听器
├── 页面跳转回调
└── 降级处理机制

RootLayout (根布局)
├── 设置导航回调
├── 处理页面跳转
└── 错误处理
```

### 2. 事件流程

1. **推送消息到达** → `GeTuiSdkDidReceiveNotification`
2. **用户点击通知** → `GeTuiSdkDidClickNotification`
3. **解析payload** → 提取 `page` 和 `params`
4. **发送导航事件** → `navigateToPage` 事件
5. **执行页面跳转** → 使用 `expo-router` 跳转

### 3. 错误处理机制

- **payload解析失败**：降级到消息中心页面
- **页面不存在**：降级到消息中心页面
- **导航失败**：降级到消息中心页面
- **网络异常**：记录错误日志，继续尝试

## 调试和日志

### 1. 查看运行日志

在推送测试页面可以实时查看：
- 推送服务初始化状态
- 消息接收和点击事件
- 页面跳转执行情况
- 错误信息和异常堆栈

### 2. 常用调试命令

```bash
# 查看个推相关日志
adb logcat | grep -E "(Getui|Push)"

# 查看应用日志
adb logcat | grep "myApp"

# 重新构建应用
npm run android
npm run ios
```

### 3. 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 推送消息不接收 | 网络问题、权限未授予 | 检查网络、确认通知权限 |
| 点击无反应 | payload格式错误 | 检查payload中的page字段 |
| 页面跳转失败 | 页面名称错误 | 确认页面名称在支持列表中 |
| Client ID获取失败 | SDK未初始化 | 等待应用完全启动 |

## 配置脚本

### 1. 运行配置脚本

```bash
npm run configure-getui
```

该脚本会自动：
- 更新 Android 配置文件
- 更新 iOS 配置信息
- 更新推送配置文件
- 显示配置完成信息

### 2. 手动配置

如果需要手动配置，请参考以下文件：
- `android/app/src/main/AndroidManifest.xml`
- `config/pushConfig.ts`
- `config/getui.json`

## 注意事项

### 1. Android 配置

- 确保 `launchMode="singleTask"` 避免重复启动
- 添加个推相关的服务和接收器
- 配置正确的权限声明

### 2. iOS 配置

- 使用 CocoaPods 安装个推SDK
- 在 `AppDelegate.m` 中初始化SDK
- 配置推送证书和权限

### 3. 推送消息限制

- 单个消息大小不超过 4KB
- 透传消息不会显示通知栏
- 通知消息会显示在通知栏

### 4. 性能优化

- 避免在payload中传递过大的数据
- 合理使用页面跳转，避免频繁跳转
- 及时清理不需要的事件监听器

## 更新日志

### v1.0.0 (当前版本)
- ✅ 完成个推SDK集成
- ✅ 实现点击推送消息跳转指定页面
- ✅ 支持自定义参数传递
- ✅ 完整的错误处理和降级机制
- ✅ 实时日志记录和调试功能

## 技术支持

如果在使用过程中遇到问题，请：

1. 查看应用运行日志
2. 检查个推后台配置
3. 确认网络连接正常
4. 参考个推官方文档：[https://github.com/GetuiLaboratory/reactnative-getui](https://github.com/GetuiLaboratory/reactnative-getui)

---

**最后更新**: 2024年12月
**版本**: 1.0.0
**维护者**: 开发团队 