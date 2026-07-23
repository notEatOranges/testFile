# 指纹登录 & 推送应用

这是一个集成了指纹登录和个推推送功能的React Native应用。

## 功能特性

### 🔐 指纹登录
- 支持指纹、面部识别等生物识别方式
- 自动检测设备生物识别能力
- 优雅的登录界面和错误处理
- 支持备用登录方式

### 📱 推送通知
- 集成个推推送服务
- 实时接收推送消息
- 消息列表展示和管理
- 支持消息分类和标签

## 技术栈

- **React Native** - 跨平台移动应用开发
- **Expo** - 开发工具链和平台
- **Expo Local Authentication** - 生物识别认证
- **React Native Getui** - 个推推送服务
- **TypeScript** - 类型安全
- **Expo Router** - 路由管理

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置个推服务

在 `constants/config.ts` 文件中配置您的个推应用信息：

```typescript
export const APP_CONFIG = {
  GETUI: {
    APP_ID: '您的个推APP_ID',
    APP_KEY: '您的个推APP_KEY', 
    APP_SECRET: '您的个推APP_SECRET',
  },
  // ...
};
```

### 3. 运行应用

```bash
# 启动开发服务器
npm start

# 在iOS模拟器上运行
npm run ios

# 在Android模拟器上运行
npm run android

# 在Web浏览器中运行
npm run web
```

## 项目结构

```
├── app/
│   ├── (tabs)/
│   │   └── index.tsx          # 主应用页面
│   └── _layout.tsx            # 应用布局
├── components/
│   ├── BiometricLogin.tsx     # 指纹登录组件
│   └── PushMessageList.tsx    # 推送消息列表组件
├── hooks/
│   ├── useBiometricAuth.ts    # 指纹认证Hook
│   └── useGetuiPush.ts        # 个推推送Hook
├── constants/
│   └── config.ts              # 应用配置
└── package.json
```

## 使用说明

### 指纹登录

1. 应用启动时会自动检测设备生物识别能力
2. 如果设备支持生物识别，会显示指纹登录界面
3. 点击指纹图标或按钮开始认证
4. 认证成功后进入主界面

### 推送功能

1. 应用启动时自动初始化个推服务
2. 登录成功后自动设置用户标签和别名
3. 在"消息"标签页查看接收到的推送消息
4. 支持下拉刷新和清空消息列表

## 配置说明

### 个推配置

您需要在个推官网注册应用并获取以下信息：
- **APP_ID**: 应用ID
- **APP_KEY**: 应用密钥
- **APP_SECRET**: 应用密钥

### 环境配置

项目支持开发和生产环境配置：

```typescript
// 开发环境
export const DEV_CONFIG = {
  GETUI: {
    APP_ID: '开发环境APP_ID',
    APP_KEY: '开发环境APP_KEY',
    APP_SECRET: '开发环境APP_SECRET',
  },
};

// 生产环境
export const PROD_CONFIG = {
  GETUI: {
    APP_ID: '生产环境APP_ID',
    APP_KEY: '生产环境APP_KEY',
    APP_SECRET: '生产环境APP_SECRET',
  },
};
```

## 注意事项

1. **生物识别权限**: 确保在设备设置中启用了生物识别功能
2. **推送权限**: iOS设备需要用户授权推送通知权限
3. **网络连接**: 推送功能需要网络连接
4. **真机测试**: 生物识别功能需要在真机上测试

## 故障排除

### 指纹识别不工作
- 检查设备是否支持生物识别
- 确认已在设备设置中配置指纹
- 检查应用权限设置

### 推送消息收不到
- 确认个推配置正确
- 检查网络连接
- 确认推送权限已授权
- 查看控制台日志排查问题

## 开发指南

### 添加新的推送消息类型

在 `hooks/useGetuiPush.ts` 中的 `handleNotificationClick` 函数中添加新的消息类型处理：

```typescript
switch (payload.type) {
  case 'message':
    // 处理消息类型
    break;
  case 'order':
    // 处理订单类型
    break;
  case 'newType':
    // 处理新类型
    break;
  default:
    // 默认处理
    break;
}
```

### 自定义生物识别界面

修改 `components/BiometricLogin.tsx` 来自定义登录界面样式和行为。

## 许可证

MIT License
