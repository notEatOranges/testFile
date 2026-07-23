/**
 * Taro小程序AI对话模块
 * 基于Dify项目提取，适配小程序环境
 */

import Taro from '@tarojs/taro';
import { ChatItem, ChatConfig } from './types';
import { SSEHandler } from './utils/sse-handler';
import { AudioManager } from './utils/audio-manager';
import { MarkdownRenderer } from './utils/markdown-renderer';
import { ChartRenderer } from './utils/chart-renderer';

class TaroAIChatModule {
  constructor(config = {}) {
    this.config = new ChatConfig(config);
    this.chatList = [];
    this.isResponding = false;
    this.conversationId = '';
    this.taskId = '';
    this.hasStopResponded = false;
    this.suggestedQuestions = [];
    this.abortController = null;

    // 初始化子模块
    this.sseHandler = new SSEHandler();
    this.audioManager = new AudioManager();
    this.markdownRenderer = new MarkdownRenderer();
    this.chartRenderer = new ChartRenderer();

    // 回调函数
    this.onData = null;
    this.onCompleted = null;
    this.onThought = null;
    this.onFile = null;
    this.onError = null;
    this.onMessageEnd = null;
    this.onMessageReplace = null;
    this.onAudioStart = null;
    this.onAudioEnd = null;
    this.onChartGenerated = null;

    // 绑定方法
    this.handleSend = this.handleSend.bind(this);
    this.handleStop = this.handleStop.bind(this);
    this.handleRestart = this.handleRestart.bind(this);
    this.handleVoiceToText = this.handleVoiceToText.bind(this);
    this.handleTextToVoice = this.handleTextToVoice.bind(this);
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks = {}) {
    this.onData = callbacks.onData || null;
    this.onCompleted = callbacks.onCompleted || null;
    this.onThought = callbacks.onThought || null;
    this.onFile = callbacks.onFile || null;
    this.onError = callbacks.onError || null;
    this.onMessageEnd = callbacks.onMessageEnd || null;
    this.onMessageReplace = callbacks.onMessageReplace || null;
    this.onAudioStart = callbacks.onAudioStart || null;
    this.onAudioEnd = callbacks.onAudioEnd || null;
    this.onChartGenerated = callbacks.onChartGenerated || null;
  }

  /**
   * 发送消息
   */
  async handleSend(url, data, options = {}) {
    if (this.isResponding) {
      this.onError?.('请等待响应完成');
      return false;
    }

    const { query, files = [], inputs = {}, conversation_id = null, parent_message_id = null } = data;

    // 创建问题项
    const questionId = `question-${Date.now()}`;
    const questionItem = new ChatItem(questionId, query, false);
    questionItem.message_files = files;
    questionItem.parentMessageId = parent_message_id;

    // 创建回答占位符
    const answerId = `answer-placeholder-${Date.now()}`;
    const answerItem = new ChatItem(answerId, '', true);
    answerItem.parentMessageId = questionId;

    // 添加到聊天列表
    this.addToChatList(questionItem, answerItem, parent_message_id);

    this.isResponding = true;
    this.hasStopResponded = false;

    // 准备请求参数
    const bodyParams = {
      response_mode: 'streaming',
      conversation_id: this.conversationId,
      files: this.processFiles(files),
      query,
      inputs: this.processInputs(inputs),
      parent_message_id,
    };

    try {
      await this.sseHandler.post(url, bodyParams, {
        ...options,
        onData: this.handleStreamData.bind(this),
        onCompleted: this.handleCompleted.bind(this),
        onError: this.handleError.bind(this),
      });
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * 处理流式数据
   */
  async handleStreamData(data, isFirstMessage) {
    if (data.status === 400 || !data.event) {
      this.onError?.(data.message || '请求错误', data.code);
      this.onCompleted?.(true, data.message);
      return;
    }

    switch (data.event) {
      case 'message':
      case 'agent_message':
        this.onData?.(data.answer || '', isFirstMessage, {
          conversationId: data.conversation_id,
          taskId: data.task_id,
          messageId: data.id,
        });

        if (data.conversation_id && isFirstMessage) {
          this.conversationId = data.conversation_id;
        }

        if (data.task_id) {
          this.taskId = data.task_id;
        }

        this.updateLastAnswer(data.answer || '');
        break;

      case 'agent_thought':
        this.onThought?.(data);
        this.updateLastThought(data);
        break;

      case 'message_file':
        this.onFile?.(data);
        this.updateLastFile(data);
        break;

      case 'message_end':
        this.onMessageEnd?.(data);
        this.updateLastMessageEnd(data);
        break;

      case 'message_replace':
        this.onMessageReplace?.(data);
        this.updateLastMessageReplace(data);
        break;
    }
  }

  /**
   * 处理完成回调
   */
  handleCompleted(hasError = false, errorMessage = '') {
    this.isResponding = false;
    this.onCompleted?.(hasError, errorMessage);
  }

  /**
   * 停止响应
   */
  handleStop() {
    this.hasStopResponded = true;
    this.isResponding = false;

    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.taskId) {
      this.stopChatMessage(this.taskId);
    }
  }

  /**
   * 重启聊天
   */
  handleRestart() {
    this.conversationId = '';
    this.taskId = '';
    this.handleStop();
    this.chatList = [];
    this.suggestedQuestions = [];
  }

  /**
   * 语音转文字
   */
  async handleVoiceToText() {
    try {
      // 开始录音
      const recordManager = Taro.getRecorderManager();

      return new Promise((resolve, reject) => {
        recordManager.onStart(() => {
          console.log('录音开始');
        });

        recordManager.onStop((res) => {
          console.log('录音结束', res);
          // 上传音频文件到服务器进行语音识别
          this.uploadAudioForTranscription(res.tempFilePath)
            .then(resolve)
            .catch(reject);
        });

        recordManager.onError((error) => {
          console.error('录音错误', error);
          reject(error);
        });

        recordManager.start({
          duration: 60000, // 最长60秒
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'mp3',
        });
      });
    } catch (error) {
      console.error('语音转文字失败:', error);
      throw error;
    }
  }

  /**
   * 上传音频进行语音识别
   */
  async uploadAudioForTranscription(filePath) {
    try {
      const result = await Taro.uploadFile({
        url: '/api/audio-to-text',
        filePath,
        name: 'audio',
        header: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });

      const data = JSON.parse(result.data);
      return data.text;
    } catch (error) {
      console.error('音频上传失败:', error);
      throw error;
    }
  }

  /**
   * 文字转语音
   */
  async handleTextToVoice(text, voice = 'default') {
    try {
      const result = await Taro.request({
        url: '/api/text-to-audio',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        data: {
          text,
          voice,
        },
      });

      if (result.data.audio) {
        await this.audioManager.playAudio(result.data.audio);
        this.onAudioStart?.(text);
      }
    } catch (error) {
      console.error('文字转语音失败:', error);
      throw error;
    }
  }

  /**
   * 生成图表
   */
  async generateChart(chartData, chartType = 'line') {
    try {
      const chartConfig = await this.chartRenderer.generateChartConfig(chartData, chartType);
      this.onChartGenerated?.(chartConfig);
      return chartConfig;
    } catch (error) {
      console.error('图表生成失败:', error);
      throw error;
    }
  }

  /**
   * 渲染Markdown
   */
  renderMarkdown(content) {
    return this.markdownRenderer.render(content);
  }

  /**
   * 添加消息到聊天列表
   */
  addToChatList(questionItem, answerItem, parentId = null) {
    if (!parentId) {
      // 根消息
      this.chatList.push(questionItem);
      this.chatList.push(answerItem);
    } else {
      // 子消息，需要找到父消息并添加
      const parentIndex = this.findParentIndex(parentId);
      if (parentIndex !== -1) {
        this.chatList.splice(parentIndex + 1, 0, questionItem, answerItem);
      }
    }
  }

  /**
   * 更新最后一个回答
   */
  updateLastAnswer(content) {
    const lastAnswer = this.getLastAnswer();
    if (lastAnswer) {
      lastAnswer.content += content;
    }
  }

  /**
   * 更新最后一个思考
   */
  updateLastThought(thought) {
    const lastAnswer = this.getLastAnswer();
    if (lastAnswer) {
      if (!lastAnswer.agent_thoughts) {
        lastAnswer.agent_thoughts = [];
      }

      const existingThought = lastAnswer.agent_thoughts.find((t) => t.id === thought.id);
      if (existingThought) {
        existingThought.thought = thought.thought;
        existingThought.message_files = thought.message_files;
      } else {
        lastAnswer.agent_thoughts.push(thought);
      }
    }
  }

  /**
   * 更新最后一个文件
   */
  updateLastFile(file) {
    const lastAnswer = this.getLastAnswer();
    if (lastAnswer && lastAnswer.agent_thoughts && lastAnswer.agent_thoughts.length > 0) {
      const lastThought = lastAnswer.agent_thoughts[lastAnswer.agent_thoughts.length - 1];
      if (!lastThought.message_files) {
        lastThought.message_files = [];
      }
      lastThought.message_files.push(file);
    }
  }

  /**
   * 更新最后一个消息结束
   */
  updateLastMessageEnd(messageEnd) {
    const lastAnswer = this.getLastAnswer();
    if (lastAnswer) {
      lastAnswer.citation = messageEnd.metadata?.retriever_resources || [];
      lastAnswer.id = messageEnd.id;
    }
  }

  /**
   * 更新最后一个消息替换
   */
  updateLastMessageReplace(messageReplace) {
    const lastAnswer = this.getLastAnswer();
    if (lastAnswer) {
      lastAnswer.content = messageReplace.answer;
    }
  }

  /**
   * 获取最后一个回答
   */
  getLastAnswer() {
    for (let i = this.chatList.length - 1; i >= 0; i--) {
      if (this.chatList[i].isAnswer) {
        return this.chatList[i];
      }
    }
    return null;
  }

  /**
   * 查找父消息索引
   */
  findParentIndex(parentId) {
    return this.chatList.findIndex((item) => item.id === parentId);
  }

  /**
   * 处理文件
   */
  processFiles(files) {
    return files.map((file) => {
      if (file.transfer_method === 'local_file') {
        return {
          ...file,
          url: '',
        };
      }
      return file;
    });
  }

  /**
   * 处理输入参数
   */
  processInputs(inputs) {
    return inputs;
  }

  /**
   * 获取访问令牌
   */
  getAccessToken() {
    return Taro.getStorageSync('access_token') || '';
  }

  /**
   * 停止聊天消息
   */
  async stopChatMessage(taskId) {
    try {
      await Taro.request({
        url: `/api/chat-messages/${taskId}/stop`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });
    } catch (error) {
      console.error('停止聊天失败:', error);
    }
  }

  /**
   * 处理错误
   */
  handleError(error) {
    this.isResponding = false;
    this.onError?.(error.message || '请求失败');
    this.onCompleted?.(true, error.message);
  }

  /**
   * 获取聊天列表
   */
  getChatList() {
    return this.chatList;
  }

  /**
   * 获取建议问题
   */
  getSuggestedQuestions() {
    return this.suggestedQuestions;
  }

  /**
   * 设置建议问题
   */
  setSuggestedQuestions(questions) {
    this.suggestedQuestions = questions;
  }

  /**
   * 获取是否正在响应
   */
  getIsResponding() {
    return this.isResponding;
  }

  /**
   * 获取对话ID
   */
  getConversationId() {
    return this.conversationId;
  }
}

export default TaroAIChatModule;
