# Taro + NutUI AI对话模块

基于Dify项目提取的AI对话功能，适配Taro小程序环境，支持文字问答、语音转文字、文字转语音、ECharts图表生成、Markdown展示等功能。

## 功能特性

- ✅ **文字问答**: 支持与AI进行文字对话
- ✅ **流式响应**: 实时显示AI回复内容
- ✅ **语音转文字**: 支持语音输入转文字
- ✅ **文字转语音**: 支持AI回复转语音播放
- ✅ **终止对话**: 支持随时停止AI回复
- ✅ **ECharts图表**: 支持生成各种类型的图表
- ✅ **Markdown渲染**: 支持Markdown格式内容展示
- ✅ **建议问题**: 支持智能推荐问题
- ✅ **对话历史**: 支持多轮对话上下文
- ✅ **错误处理**: 完善的错误处理机制

## 安装依赖

```bash
# 安装Taro
npm install -g @tarojs/cli

# 安装NutUI
npm install @nutui/nutui-react-taro

# 安装ECharts（可选，用于图表功能）
npm install echarts-for-weixin
```

## 项目结构

```
taro-ai-chat/
├── index.js              # 主模块文件
├── types.js              # 类型定义
├── sse-handler.js        # SSE处理器
├── audio-manager.js      # 音频管理器
├── markdown-renderer.js  # Markdown渲染器
├── chart-renderer.js     # 图表渲染器
├── example.jsx           # 使用示例
├── example.scss          # 样式文件
└── README.md            # 说明文档
```

## 快速开始

### 1. 引入模块

```javascript
import TaroAIChatModule from './taro-ai-chat/index'
```

### 2. 初始化模块

```javascript
const chatModule = new TaroAIChatModule({
  opening_statement: '你好！我是AI助手，有什么可以帮助你的吗？',
  suggested_questions: ['请介绍一下你自己', '如何学习编程？', '推荐一些好书'],
  supportFeedback: true,
  supportAnnotation: false
})
```

### 3. 设置回调函数

```javascript
chatModule.setCallbacks({
  onData: (message, isFirstMessage, moreInfo) => {
    // 处理流式数据
    console.log('收到数据:', message)
  },
  onCompleted: (hasError, errorMessage) => {
    // 处理完成回调
    console.log('对话完成')
  },
  onError: (error) => {
    // 处理错误
    console.error('发生错误:', error)
  },
  onAudioStart: (text) => {
    // 音频开始播放
    console.log('开始播放语音')
  },
  onAudioEnd: () => {
    // 音频播放结束
    console.log('语音播放结束')
  },
  onChartGenerated: (chartConfig) => {
    // 图表生成完成
    console.log('图表配置:', chartConfig)
  }
})
```

### 4. 发送消息

```javascript
// 发送文字消息
await chatModule.handleSend('/api/chat-messages', {
  query: '你好，请介绍一下你自己',
  inputs: {},
  conversation_id: chatModule.getConversationId()
})

// 语音转文字
const text = await chatModule.handleVoiceToText()
console.log('语音识别结果:', text)

// 文字转语音
await chatModule.handleTextToVoice('你好，我是AI助手')
```

### 5. 生成图表

```javascript
const chartData = {
  title: '销售数据',
  xAxis: ['1月', '2月', '3月', '4月', '5月'],
  series: [{
    name: '销售额',
    data: [120, 200, 150, 80, 70]
  }]
}

const chartConfig = await chatModule.generateChart(chartData, 'line')
```

### 6. 渲染Markdown

```javascript
const markdownContent = '# 标题\n这是一段**粗体**文字'
const rendered = chatModule.renderMarkdown(markdownContent)
```

## API 参考

### TaroAIChatModule

#### 构造函数

```javascript
new TaroAIChatModule(config)
```

**参数:**
- `config` (Object): 配置对象
  - `opening_statement` (String): 开场白
  - `suggested_questions` (Array): 建议问题列表
  - `supportFeedback` (Boolean): 是否支持反馈
  - `supportAnnotation` (Boolean): 是否支持标注

#### 方法

##### setCallbacks(callbacks)

设置回调函数。

**参数:**
- `callbacks` (Object): 回调函数对象
  - `onData` (Function): 流式数据回调
  - `onCompleted` (Function): 完成回调
  - `onError` (Function): 错误回调
  - `onAudioStart` (Function): 音频开始回调
  - `onAudioEnd` (Function): 音频结束回调
  - `onChartGenerated` (Function): 图表生成回调

##### handleSend(url, data, options)

发送消息。

**参数:**
- `url` (String): API地址
- `data` (Object): 请求数据
  - `query` (String): 用户输入
  - `files` (Array): 文件列表
  - `inputs` (Object): 输入参数
  - `conversation_id` (String): 对话ID
- `options` (Object): 请求选项

##### handleVoiceToText()

语音转文字。

**返回值:** Promise<String>

##### handleTextToVoice(text, voice)

文字转语音。

**参数:**
- `text` (String): 要转换的文字
- `voice` (String): 语音类型

##### generateChart(chartData, chartType)

生成图表。

**参数:**
- `chartData` (Object): 图表数据
- `chartType` (String): 图表类型 ('line', 'bar', 'pie', 'scatter', 'area', 'radar')

**返回值:** Promise<Object>

##### renderMarkdown(content)

渲染Markdown。

**参数:**
- `content` (String): Markdown内容

**返回值:** String

##### handleStop()

停止对话。

##### handleRestart()

重启对话。

##### getChatList()

获取聊天列表。

**返回值:** Array

##### getIsResponding()

获取是否正在响应。

**返回值:** Boolean

##### getConversationId()

获取对话ID。

**返回值:** String

## 图表类型

### 折线图 (line)

```javascript
const data = {
  title: '销售趋势',
  xAxis: ['1月', '2月', '3月', '4月', '5月'],
  series: [{
    name: '销售额',
    data: [120, 200, 150, 80, 70]
  }]
}
```

### 柱状图 (bar)

```javascript
const data = {
  title: '产品销量',
  xAxis: ['产品A', '产品B', '产品C', '产品D'],
  series: [{
    name: '销量',
    data: [320, 332, 301, 334]
  }]
}
```

### 饼图 (pie)

```javascript
const data = {
  title: '市场份额',
  data: [
    { name: '产品A', value: 335 },
    { name: '产品B', value: 310 },
    { name: '产品C', value: 234 },
    { name: '产品D', value: 135 }
  ]
}
```

## 样式定制

可以通过修改 `example.scss` 文件来自定义样式：

```scss
// 自定义消息样式
.message-item {
  &.user {
    .message-content {
      background-color: #your-color;
    }
  }
  
  &.ai {
    .message-content {
      background-color: #your-color;
    }
  }
}
```

## 注意事项

1. **小程序权限**: 需要在 `app.json` 中配置录音权限：
   ```json
   {
     "permission": {
       "scope.record": {
         "desc": "用于语音输入功能"
       }
     }
   }
   ```

2. **ECharts集成**: 如需使用图表功能，需要集成ECharts小程序版本。

3. **API地址**: 需要根据实际后端API地址修改请求URL。

4. **错误处理**: 建议在生产环境中添加完善的错误处理机制。

5. **性能优化**: 对于大量消息的场景，建议实现虚拟滚动。

## 示例项目

完整的使用示例请参考 `example.jsx` 文件。

## 许可证

MIT License 