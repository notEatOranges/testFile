/**
 * 音频管理器 - 适配小程序环境
 */

import Taro from '@tarojs/taro';

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.currentAudio = null;
  }

  /**
   * 播放音频
   */
  async playAudio(audioData, isStreaming = false) {
    try {
      if (this.isPlaying) {
        await this.stopAudio();
      }

      // 创建音频上下文
      this.audioContext = Taro.createInnerAudioContext();

      // 设置音频源
      if (typeof audioData === 'string') {
        // 如果是base64数据
        if (audioData.startsWith('data:audio')) {
          this.audioContext.src = audioData;
        } else {
          // 如果是URL
          this.audioContext.src = audioData;
        }
      } else if (audioData.buffer) {
        // 如果是ArrayBuffer
        const blob = new Blob([audioData.buffer], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        this.audioContext.src = url;
      }

      // 设置事件监听
      this.setupAudioEvents();

      // 开始播放
      this.audioContext.play();
      this.isPlaying = true;
      this.currentAudio = audioData;

      return new Promise((resolve, reject) => {
        this.audioContext.onEnded(() => {
          this.isPlaying = false;
          this.currentAudio = null;
          resolve();
        });

        this.audioContext.onError((error) => {
          this.isPlaying = false;
          this.currentAudio = null;
          reject(error);
        });
      });
    } catch (error) {
      console.error('播放音频失败:', error);
      throw error;
    }
  }

  /**
   * 设置音频事件
   */
  setupAudioEvents() {
    if (!this.audioContext) return;

    this.audioContext.onPlay(() => {
      console.log('音频开始播放');
    });

    this.audioContext.onPause(() => {
      console.log('音频暂停');
    });

    this.audioContext.onStop(() => {
      console.log('音频停止');
      this.isPlaying = false;
    });

    this.audioContext.onEnded(() => {
      console.log('音频播放结束');
      this.isPlaying = false;
      this.currentAudio = null;
    });

    this.audioContext.onError((error) => {
      console.error('音频播放错误:', error);
      this.isPlaying = false;
      this.currentAudio = null;
    });

    this.audioContext.onTimeUpdate(() => {
      // 可以在这里处理播放进度
      const { currentTime } = this.audioContext;
      const { duration } = this.audioContext;
      const progress = (currentTime / duration) * 100;

      // 触发进度回调
      this.onProgress?.(progress, currentTime, duration);
    });
  }

  /**
   * 暂停音频
   */
  pauseAudio() {
    if (this.audioContext && this.isPlaying) {
      this.audioContext.pause();
    }
  }

  /**
   * 恢复音频
   */
  resumeAudio() {
    if (this.audioContext && !this.isPlaying) {
      this.audioContext.play();
    }
  }

  /**
   * 停止音频
   */
  async stopAudio() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.isPlaying = false;
      this.currentAudio = null;
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume) {
    if (this.audioContext) {
      this.audioContext.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 获取当前播放状态
   */
  getPlayState() {
    return {
      isPlaying: this.isPlaying,
      currentAudio: this.currentAudio,
      currentTime: this.audioContext?.currentTime || 0,
      duration: this.audioContext?.duration || 0,
    };
  }

  /**
   * 销毁音频上下文
   */
  destroy() {
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
      this.isPlaying = false;
      this.currentAudio = null;
    }
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback) {
    this.onProgress = callback;
  }
}
