# CID 获取故障排除指南

## 📱 常见问题

### 1. CID 为空或获取失败

#### 可能原因
- **网络连接问题**: 需要网络连接才能从个推服务器获取CID
- **SDK初始化时间**: 个推SDK需要时间完全启动
- **设备状态**: 设备可能还在启动过程中
- **权限问题**: 应用可能缺少必要权限

#### 解决方案

##### 1.1 检查网络连接
```typescript
// 确保设备有网络连接
// 可以尝试切换WiFi或移动数据
```

##### 1.2 等待SDK初始化
```typescript
// SDK初始化需要时间，通常3-5秒
// 我们已经添加了延迟获取机制
```

##### 1.3 手动刷新CID
在推送测试页面：
1. 点击右上角的刷新按钮
2. 或点击"刷新CID"按钮
3. 等待2-3秒后重试

##### 1.4 检查权限
确保应用有以下权限：
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 2. SDK状态异常

#### 状态码说明
- **0**: 未启动
- **1**: 已启动 ✅
- **2**: 已停止
- **3**: 已销毁

#### 解决方案
```typescript
// 检查SDK状态
const status = await pushService.getStatus();
console.log('SDK状态:', status);

// 如果状态异常，重新初始化
if (status !== '1') {
  await pushService.initialize();
}
```

### 3. 版本兼容性问题

#### 检查版本
```typescript
// 获取SDK版本
const version = await pushService.getVersion();
console.log('SDK版本:', version);
```

#### 解决方案
- 确保使用最新版本的 `react-native-getui`
- 检查个推官方文档的版本兼容性说明

## 🔧 调试步骤

### 步骤1: 检查日志
查看控制台日志，寻找以下信息：
```
✅ 个推SDK初始化完成
🔄 开始获取CID...
✅ 成功获取CID: [CID值]
```

### 步骤2: 网络测试
```typescript
// 测试网络连接
try {
  const response = await fetch('https://www.getui.com');
  console.log('网络连接正常');
} catch (error) {
  console.log('网络连接异常');
}
```

### 步骤3: 权限检查
```typescript
// 检查必要权限
import { PermissionsAndroid } from 'react-native';

const checkPermissions = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.INTERNET
    );
    console.log('权限状态:', granted);
  } catch (error) {
    console.error('权限检查失败:', error);
  }
};
```

## 📊 状态监控

### 正常状态
```
✅ 个推SDK初始化完成
✅ 个推初始化成功
🔄 开始获取CID...
✅ 成功获取CID: mob64ca12d4650e2024-12-13 10:14:51
LOG  SDK状态: 1
LOG  SDK版本: 3.3.11.0
```

### 异常状态
```
❌ 个推初始化失败: [错误信息]
⚠️ CID为空，第1次重试...
⚠️ CID为空，第2次重试...
❌ 获取CID失败，已达到最大重试次数
```

## 🛠️ 优化建议

### 1. 添加重试机制
我们已经实现了自动重试机制：
- 最多重试3次
- 每次间隔2秒
- 自动检测CID是否有效

### 2. 延迟初始化
```typescript
// 延迟3秒后获取CID，确保SDK完全启动
setTimeout(async () => {
  await pushService.getClientId();
}, 3000);
```

### 3. 用户反馈
- 在界面上显示获取状态
- 提供手动刷新功能
- 显示详细的错误信息

## 📱 测试建议

### 1. 真机测试
- 在真机上测试，模拟器可能有限制
- 确保设备有SIM卡和网络连接

### 2. 网络环境
- 测试WiFi和移动数据环境
- 测试网络切换场景

### 3. 应用状态
- 测试前台和后台状态
- 测试应用重启场景

## 🎯 最佳实践

### 1. 初始化时机
```typescript
// 在应用启动时初始化
useEffect(() => {
  const initPush = async () => {
    await pushService.initialize();
  };
  initPush();
}, []);
```

### 2. 错误处理
```typescript
// 添加完善的错误处理
try {
  const cid = await pushService.getClientId();
  if (cid) {
    // 处理成功情况
  } else {
    // 处理失败情况
  }
} catch (error) {
  console.error('获取CID失败:', error);
}
```

### 3. 用户提示
```typescript
// 向用户显示状态
if (cid === '未获取到') {
  Alert.alert('提示', 'CID获取中，请稍后重试');
}
```

## 📞 技术支持

如果问题仍然存在，请提供以下信息：
1. 设备型号和系统版本
2. 应用版本和个推SDK版本
3. 完整的错误日志
4. 网络环境信息
5. 重现步骤

## 🔗 相关链接

- [个推官方文档](https://docs.getui.com/)
- [React Native Getui](https://github.com/GetuiLaboratory/react-native-getui)
- [个推控制台](https://dev.getui.com/) 