# 个推消息接收测试指南

## 问题诊断

如果您没有收到推送消息，请按以下步骤进行排查：

### 1. 检查基础配置

#### Android配置检查
- ✅ `AndroidManifest.xml` 中已配置个推权限和服务
- ✅ `MainActivity.kt` 中已调用 `GetuiModule.initPush(this)`
- ✅ 已创建 `GetuiMessageReceiver.kt` 消息接收器
- ✅ 已在 `AndroidManifest.xml` 中注册消息接收器

#### JavaScript配置检查
- ✅ `pushService.ts` 中已设置原生事件监听器
- ✅ 应用启动时已初始化推送服务
- ✅ 已获取到有效的CID

### 2. 检查网络连接

```bash
# 在推送测试页面点击"检查网络"按钮
# 确保设备有稳定的网络连接
```

### 3. 检查推送权限

```bash
# 在推送测试页面点击"推送设置"按钮
# 确保推送服务已开启
```

### 4. 检查CID获取

```bash
# 在推送测试页面查看CID是否已获取
# 如果CID为空，点击"刷新CID"按钮
```

## 测试推送消息

### 方法1：使用个推控制台

1. 登录个推控制台
2. 选择您的应用
3. 进入"推送管理" -> "创建推送"
4. 选择推送类型：
   - **通知消息**：会在通知栏显示
   - **透传消息**：不会在通知栏显示，直接传递给应用
5. 选择推送对象：
   - **单推**：输入您的CID
   - **群推**：选择所有设备
6. 填写推送内容：
   ```json
   {
     "title": "测试标题",
     "content": "测试内容",
     "payload": {
       "type": "test",
       "data": "测试数据"
     }
   }
   ```
7. 发送推送

### 方法2：使用API接口

```bash
# 发送通知消息
curl -X POST "https://restapi.getui.com/v2/zZ6aAw5JuE6LMn3OvTrW43/push/single/cid" \
  -H "Content-Type: application/json" \
  -H "token: YOUR_TOKEN" \
  -d '{
    "request_id": "test_notification_001",
    "settings": {
      "ttl": 3600000
    },
    "audience": {
      "cid": ["YOUR_CID_HERE"]
    },
    "push_message": {
      "notification": {
        "title": "测试通知",
        "body": "这是一条测试通知消息",
        "click_type": "intent",
        "intent": "intent://com.anonymous.myApp#Intent;scheme=myApp;launchFlags=0x10000000;end"
      }
    }
  }'

# 发送透传消息
curl -X POST "https://restapi.getui.com/v2/zZ6aAw5JuE6LMn3OvTrW43/push/single/cid" \
  -H "Content-Type: application/json" \
  -H "token: YOUR_TOKEN" \
  -d '{
    "request_id": "test_payload_001",
    "settings": {
      "ttl": 3600000
    },
    "audience": {
      "cid": ["YOUR_CID_HERE"]
    },
    "push_message": {
      "transmission": "{\"type\":\"test\",\"title\":\"测试透传\",\"content\":\"这是一条测试透传消息\",\"data\":\"test_data\"}"
    }
  }'
```

## 消息接收验证

### 1. 查看控制台日志

推送消息接收时，控制台会显示：
```
📨 收到个推消息 [payload]: {"type":"test","title":"测试透传","content":"这是一条测试透传消息","data":"test_data"}
📨 收到个推消息 [notification]: {"title":"测试通知","body":"这是一条测试通知消息"}
```

### 2. 查看应用内消息记录

在推送测试页面的"消息接收记录"区域会显示：
- 消息类型（透传/通知）
- 消息标题和内容
- 接收时间
- 消息数据

### 3. 检查通知栏

通知消息会在系统通知栏显示，点击后会触发应用内的点击处理。

## 常见问题解决

### 1. 收不到推送消息

**可能原因：**
- 网络连接问题
- CID获取失败
- 推送服务未开启
- 个推配置错误

**解决方案：**
1. 检查网络连接
2. 重新获取CID
3. 开启推送服务
4. 验证个推配置

### 2. 透传消息收不到

**可能原因：**
- 应用被系统杀死
- 原生模块未正确配置

**解决方案：**
1. 确保应用在后台运行
2. 检查 `GetuiMessageReceiver.kt` 配置
3. 重新构建应用

### 3. 通知消息不显示

**可能原因：**
- 通知权限未授权
- 通知渠道配置问题（Android 8.0+）

**解决方案：**
1. 检查通知权限
2. 配置通知渠道
3. 确保应用在前台或后台

### 4. 通知点击无响应

**可能原因：**
- 点击处理逻辑未实现
- Intent配置错误

**解决方案：**
1. 检查 `handleNotificationClick` 方法
2. 验证Intent配置
3. 查看控制台日志

## 调试技巧

### 1. 启用详细日志

在 `GetuiMessageReceiver.kt` 中添加更多日志：
```kotlin
Log.d(TAG, "收到Intent: ${intent.action}")
Log.d(TAG, "Intent数据: ${intent.extras}")
```

### 2. 检查原生模块

确保原生模块正确编译：
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### 3. 使用真机测试

模拟器可能有限制，建议使用真机进行测试。

### 4. 检查个推控制台

在个推控制台查看推送状态和送达情况。 