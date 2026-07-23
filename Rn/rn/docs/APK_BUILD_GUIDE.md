# APK构建指南

本文档介绍如何构建、签名和加密APK文件。

## 目录
- [准备工作](#准备工作)
- [生成签名证书](#生成签名证书)
- [配置签名信息](#配置签名信息)
- [构建APK](#构建apk)
- [代码混淆和优化](#代码混淆和优化)
- [常见问题](#常见问题)

## 准备工作

### 1. 环境要求
- Node.js 18+
- Java JDK 11+
- Android SDK
- React Native CLI
- Expo CLI

### 2. 安装依赖
```bash
npm install
```

## 生成签名证书

### 方法1: 使用keytool命令
```bash
cd android/app
keytool -genkey -v -keystore release.keystore -alias release-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 方法2: 使用Android Studio
1. 打开Android Studio
2. Build → Generate Signed Bundle/APK
3. 选择APK
4. 创建新的keystore

## 配置签名信息

### 1. 更新gradle.properties
在`android/gradle.properties`文件中添加：
```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=release-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

### 2. 更新build.gradle
在`android/app/build.gradle`中添加release签名配置。

## 构建APK

### 方法1: 使用构建脚本（推荐）
```powershell
# 构建debug版本
.\scripts\build-apk.ps1 debug

# 构建release版本
.\scripts\build-apk.ps1 release
```

### 方法2: 使用EAS构建
```bash
# 本地构建
eas build --platform android --local

# 云构建
eas build --platform android --profile production
```

### 方法3: 使用Gradle命令
```bash
cd android
# Debug版本
.\gradlew assembleDebug

# Release版本
.\gradlew assembleRelease
```

## 代码混淆和优化

### 1. ProGuard配置
项目已配置ProGuard规则文件`android/app/proguard-rules.pro`，包含：
- React Native类保护
- Expo模块保护
- 个推SDK保护
- 代码优化和压缩

### 2. 启用优化
在`gradle.properties`中设置：
```properties
android.enableProguardInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
android.enablePngCrunchInReleaseBuilds=true
```

## 安全措施

### 1. 证书安全
- 妥善保管keystore文件
- 使用强密码
- 定期更换证书

### 2. 代码保护
- 启用代码混淆
- 移除调试信息
- 压缩资源文件

### 3. 网络安全
- 使用HTTPS
- 实现证书固定
- 加密敏感数据

## 常见问题

### 1. 构建失败
- 检查Java版本
- 清理构建缓存
- 检查依赖冲突

### 2. 签名失败
- 验证证书信息
- 检查密码正确性
- 确认keystore文件路径

### 3. 应用崩溃
- 检查ProGuard规则
- 验证原生模块配置
- 查看崩溃日志

## 最佳实践

1. **版本管理**: 每次发布递增versionCode
2. **测试**: 在多个设备上测试APK
3. **备份**: 备份keystore文件和密码
4. **文档**: 记录构建配置和步骤
5. **自动化**: 使用CI/CD流程自动化构建

## 联系支持

如遇到问题，请：
1. 查看错误日志
2. 检查配置文件
3. 参考官方文档
4. 联系开发团队
