// 录音相关常量
export const RECORDING_CONSTANTS = {
  MAX_DURATION: 60000, // 最长录音时间（毫秒）
  MIN_DURATION: 1000, // 最短录音时间（毫秒）
  MAX_FILE_SIZE: 15 * 1024 * 1024, // 最大文件大小（15MB）
  SUPPORTED_FORMATS: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'],
  DEFAULT_CONFIG: {
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 64000,
    format: 'mp3',
    frameSize: 50,
  },
};

// API相关常量
export const API_CONSTANTS = {
  TIMEOUT: 30000, // 30秒超时
  MAX_RETRIES: 1, // 最大重试次数
  RETRY_DELAY: 1000, // 重试延迟（毫秒）
};

// 这些常量目前未使用，已注释保留以备将来使用
// UI相关常量
// export const UI_CONSTANTS = {
//   SCROLL_DELAY: 100, // 滚动延迟（毫秒）
//   TOAST_DURATION: 2000, // Toast显示时长（毫秒）
//   ANIMATION_DURATION: 300 // 动画时长（毫秒）
// }

// 消息类型
// export const MESSAGE_TYPES = {
//   USER: 'user',
//   AI: 'ai',
//   OPENING: 'opening',
//   ERROR: 'error',
//   ABORTED: 'aborted'
// }

// 录音状态
// export const RECORDING_STATES = {
//   IDLE: 'idle',
//   RECORDING: 'recording',
//   PROCESSING: 'processing',
//   ERROR: 'error'
// }
