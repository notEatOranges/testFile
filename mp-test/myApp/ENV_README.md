# 环境变量配置说明

## 概述

本项目使用 `env.config.js` 文件来管理环境变量，避免在微信小程序环境中出现 `process is not defined` 的错误。

## 文件结构

```
├── env.config.js          # 环境变量配置文件
├── src/
│   └── pages/
│       └── taro-ai-chat/
│           └── config.js  # 使用环境变量的配置文件
```

## 环境配置

### 开发环境 (development)
- API地址: `http://119.96.26.216/v1`
- 调试模式: 开启
- 录音时长: 60秒

### 生产环境 (production)
- API地址: `https://api.yourdomain.com/api`
- 调试模式: 关闭
- 录音时长: 60秒

### 测试环境 (test)
- API地址: `http://test-api.yourdomain.com/api`
- 调试模式: 开启
- 录音时长: 30秒

## 使用方法

### 1. 在代码中使用环境变量

```javascript
import { 
  NODE_ENV, 
  TARO_ENV, 
  REACT_APP_API_KEY, 
  REACT_APP_API_BASE_URL 
} from '../../../env.config.js'

// 使用环境变量
const apiUrl = REACT_APP_API_BASE_URL
const apiKey = REACT_APP_API_KEY
```

### 2. 修改环境配置

编辑 `env.config.js` 文件中的配置：

```javascript
const envConfig = {
  development: {
    REACT_APP_API_KEY: 'your-api-key',
    REACT_APP_API_BASE_URL: 'your-api-url',
    // ... 其他配置
  }
}
```

### 3. 添加新的环境变量

1. 在 `env.config.js` 中添加新的变量
2. 在 `config.js` 中导入并使用

## 注意事项

1. **不要使用 `process.env`**：在微信小程序环境中，`process` 对象不存在
2. **使用导入的方式**：通过 `import` 导入环境变量
3. **提供默认值**：为所有环境变量提供默认值，避免运行时错误

## 常见问题

### Q: 为什么不能使用 `.env` 文件？
A: 微信小程序环境不支持 `process.env`，所以无法直接读取 `.env` 文件。

### Q: 如何切换环境？
A: 修改 `env.config.js` 中的 `getCurrentEnv()` 函数返回值，或者直接修改导入的环境变量。

### Q: 如何添加新的环境？
A: 在 `envConfig` 对象中添加新的环境配置，例如：

```javascript
staging: {
  NODE_ENV: 'staging',
  TARO_ENV: 'weapp',
  REACT_APP_API_BASE_URL: 'https://staging-api.yourdomain.com/api',
  // ... 其他配置
}
```

## 配置示例

```javascript
// 在组件中使用
import { REACT_APP_API_BASE_URL } from '../../../env.config.js'

const MyComponent = () => {
  const apiUrl = REACT_APP_API_BASE_URL
  
  return (
    <div>
      API地址: {apiUrl}
    </div>
  )
}
``` 