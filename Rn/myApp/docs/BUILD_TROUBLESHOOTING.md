# 构建故障排除指南

## 🚨 常见构建错误及解决方案

### 1. Manifest合并冲突

#### 错误信息
```
Manifest merger failed : Attribute service#com.igexin.sdk.PushService@exported value=(true) from AndroidManifest.xml:30:9-32
is also present at [:react-native-getui] AndroidManifest.xml:50:13-37 value=(false).
```

#### 解决方案
✅ **已修复**: 移除了重复的个推服务配置，因为react-native-getui库已经提供了完整的配置。

### 2. 原生模块找不到

#### 错误信息
```
Cannot resolve symbol 'PushManager'
```

#### 解决方案
1. 确保已安装react-native-getui依赖：
   ```bash
   npm install react-native-getui
   ```

2. 重新链接原生模块：
   ```bash
   npx react-native link react-native-getui
   ```

3. 清理并重新构建：
   ```bash
   cd android && ./gradlew clean
   npm run android
   ```

### 3. 权限问题

#### 错误信息
```
Permission denied
```

#### 解决方案
1. 确保AndroidManifest.xml包含必要权限：
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   <uses-permission android:name="android.permission.VIBRATE" />
   ```

2. 检查文件权限：
   ```bash
   chmod +x android/gradlew
   ```

### 4. 依赖冲突

#### 错误信息
```
Conflict with dependency
```

#### 解决方案
1. 检查依赖版本：
   ```bash
   npm ls react-native-getui
   ```

2. 清理node_modules：
   ```bash
   rm -rf node_modules
   npm install
   ```

3. 清理Android构建缓存：
   ```bash
   cd android && ./gradlew clean
   ```

## 🔧 构建步骤

### 1. 清理环境
```bash
# 清理node_modules
rm -rf node_modules
npm install

# 清理Android构建缓存
cd android && ./gradlew clean
cd ..
```

### 2. 配置个推
```bash
# 使用自动配置脚本
npm run configure-getui <appId> <appKey> <appSecret>
```

### 3. 构建应用
```bash
# 使用测试构建脚本
npm run test-build

# 或手动构建
npm run android
```

## 📱 验证构建

### 1. 检查应用是否正常启动
- 应用应该能够正常启动
- 没有崩溃或白屏

### 2. 检查推送功能
- 打开推送测试页面
- 查看CID是否获取成功
- 测试各种推送功能

### 3. 查看日志
```bash
# 查看应用日志
adb logcat | grep -E "(Getui|Push|MainActivity)"

# 查看构建日志
cd android && ./gradlew assembleDebug --info
```

## 🐛 调试技巧

### 1. 启用详细日志
```bash
# Android构建详细日志
cd android && ./gradlew assembleDebug --debug

# 应用运行日志
adb logcat | grep -E "(ReactNative|Getui|Push)"
```

### 2. 检查文件结构
```bash
# 检查原生模块文件
ls -la android/app/src/main/java/com/anonymous/myApp/

# 检查配置文件
cat android/app/src/main/AndroidManifest.xml
```

### 3. 验证依赖
```bash
# 检查npm依赖
npm ls react-native-getui

# 检查Android依赖
cd android && ./gradlew dependencies
```

## 📞 获取帮助

如果仍然遇到问题：

1. **查看官方文档**：
   - [React Native Getui](https://github.com/GetuiLaboratory/react-native-getui)
   - [个推官方文档](https://docs.getui.com/)

2. **检查GitHub Issues**：
   - 搜索类似问题
   - 提交新的Issue

3. **联系技术支持**：
   - 个推技术支持
   - React Native社区

## 🔄 重置项目

如果问题无法解决，可以重置项目：

```bash
# 重置项目
npm run reset-project

# 重新配置
npm run configure-getui <appId> <appKey> <appSecret>

# 重新构建
npm run test-build
```

---

💡 **提示**: 大多数构建问题都可以通过清理缓存和重新构建解决。 