/**
 * Taro AI对话模块配置文件
 */

// 小程序环境兼容 - 直接定义环境变量，避免路径导入问题
const NODE_ENV = 'development';

export const AI_CHAT_CONFIG = {
  // API配置
  api: {
    // 基础URL
    baseUrl: 'http://119.96.26.216/v1',

    // 聊天消息API
    chatMessages: '/api/chat-messages',

    // 语音转文字API
    audioToText: '/api/audio-to-text',

    // 文字转语音API
    textToAudio: '/api/text-to-audio',

    // 停止对话API
    stopMessage: '/api/chat-messages/{taskId}/stop',

    // 获取建议问题API
    suggestedQuestions: '/api/messages/{messageId}/suggested-questions',

    // 获取对话列表API
    conversations: '/api/conversations',

    // 获取消息列表API
    messages: '/api/messages',
  },

  // 默认配置
  default: {
    // 开场白
    opening_statement: '你好！我是AI助手，有什么可以帮助你的吗？',

    // 建议问题
    suggested_questions: [
      '请介绍一下你自己',
      '如何学习编程？',
      '推荐一些好书',
      '今天天气怎么样？',
      '帮我写一个简单的程序',
    ],

    // 支持的功能
    supportFeedback: true,
    supportAnnotation: false,
    questionEditEnable: false,

    // 系统参数
    system_parameters: {
      audio_file_size_limit: 10, // MB
      file_size_limit: 20, // MB
      image_file_size_limit: 5, // MB
      video_file_size_limit: 50, // MB
      workflow_file_upload_limit: 10, // MB
    },
  },

  // 语音配置
  audio: {
    // 录音配置
    record: {
      duration: 60000, // 最长录音时间（毫秒）
      sampleRate: 16000, // 采样率
      numberOfChannels: 1, // 声道数
      encodeBitRate: 48000, // 编码码率
      format: 'mp3', // 音频格式
    },

    // 播放配置
    play: {
      volume: 1.0, // 音量
      playbackRate: 1.0, // 播放速度
    },
  },

  // 图表配置
  chart: {
    // 默认图表配置
    default: {
      width: '100%',
      height: '400rpx',
      theme: 'default',
    },

    // 支持的图表类型
    types: ['line', 'bar', 'pie', 'scatter', 'area', 'radar'],

    // 图表颜色配置
    colors: [
      '#5470c6',
      '#91cc75',
      '#fac858',
      '#ee6666',
      '#73c0de',
      '#3ba272',
      '#fc8452',
      '#9a60b4',
      '#ea7ccc',
    ],
  },

  // Markdown配置
  markdown: {
    // 是否启用代码高亮
    highlight: true,

    // 是否启用数学公式
    math: false,

    // 是否启用表格
    table: true,

    // 是否启用任务列表
    taskList: true,

    // 是否启用脚注
    footnote: false,
  },

  // UI配置
  ui: {
    // 消息气泡样式
    message: {
      user: {
        backgroundColor: '#007aff',
        color: '#ffffff',
        borderRadius: '20rpx 20rpx 4rpx 20rpx',
      },
      ai: {
        backgroundColor: '#ffffff',
        color: '#333333',
        borderRadius: '20rpx 20rpx 20rpx 4rpx',
        boxShadow: '0 2rpx 8rpx rgba(0, 0, 0, 0.1)',
      },
      opening: {
        backgroundColor: '#f0f8ff',
        color: '#333333',
        border: '2rpx solid #007aff',
        borderRadius: '20rpx',
      },
    },

    // 头像样式
    avatar: {
      size: '80rpx',
      borderRadius: '50%',
      user: {
        backgroundColor: '#007aff',
      },
      ai: {
        backgroundColor: '#34c759',
      },
    },

    // 输入框样式
    input: {
      minHeight: '80rpx',
      maxHeight: '160rpx',
      borderRadius: '20rpx',
      backgroundColor: '#f8f9fa',
      borderColor: '#e0e0e0',
      focusBorderColor: '#007aff',
    },
  },

  // 错误处理配置
  error: {
    // 网络错误重试次数
    retryCount: 3,

    // 重试间隔（毫秒）
    retryInterval: 1000,

    // 超时时间（毫秒）
    timeout: 30000,

    // 错误消息
    messages: {
      network: '网络连接失败，请检查网络设置',
      timeout: '请求超时，请稍后重试',
      server: '服务器错误，请稍后重试',
      unknown: '发生未知错误，请稍后重试',
      voiceRecord: '录音失败，请检查麦克风权限',
      voicePlay: '播放失败，请稍后重试',
      chartGenerate: '图表生成失败，请稍后重试',
    },
  },

  // 调试配置
  debug: {
    // 是否启用调试模式
    enabled: false,

    // 是否显示详细日志
    verbose: false,

    // 是否模拟网络延迟
    simulateDelay: false,

    // 模拟延迟时间（毫秒）
    delayTime: 1000,
  },
};

// 环境配置
export const ENV_CONFIG = {
  development: {
    api: {
      baseUrl: 'http://119.96.26.216/v1',
    },
    debug: {
      enabled: true,
      verbose: true,
    },
  },

  production: {
    api: {
      baseUrl: 'http://119.96.26.216/v1',
    },
    debug: {
      enabled: false,
      verbose: false,
    },
  },
};

// 获取当前环境配置
export const getCurrentConfig = () => {
  // 使用环境变量配置
  const env = NODE_ENV || 'development';
  return {
    ...ENV_CONFIG[env],
    ...AI_CHAT_CONFIG,
  };
};

// 工具函数
export const ConfigUtils = {
  // 获取API完整URL
  getApiUrl: (path) => {
    const config = getCurrentConfig();
    return `${config.api.baseUrl}${path}`;
  },

  // 获取配置项
  get: (key, defaultValue = null) => {
    const config = getCurrentConfig();
    const keys = key.split('.');
    let value = config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  },

  // 设置配置项
  set: (key, value) => {
    const keys = key.split('.');
    const config = getCurrentConfig();
    let current = config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  },

  // 合并配置
  merge: (target, source) => {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = ConfigUtils.merge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  },
};

export default AI_CHAT_CONFIG;
