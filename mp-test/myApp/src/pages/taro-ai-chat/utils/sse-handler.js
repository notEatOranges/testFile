/**
 * SSE处理器 - 适配小程序环境
 */

import Taro from '@tarojs/taro';

export class SSEHandler {
  constructor() {
    this.abortController = null;
  }

  /**
   * SSE POST请求
   */
  async post(url, bodyParams, options = {}) {
    const { onData, onCompleted, onError } = options;

    this.abortController = new AbortController();

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getAccessToken()}`,
    };

    try {
      // 小程序不支持原生SSE，使用轮询模拟
      const response = await this.simulateSSE(url, bodyParams, headers, {
        onData,
        onCompleted,
        onError,
      });

      return response;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  }

  /**
   * 模拟SSE流式响应
   */
  async simulateSSE(url, bodyParams, headers, callbacks) {
    const { onError } = callbacks;

    try {
      // 发送初始请求
      const response = await Taro.request({
        url,
        method: 'POST',
        header: headers,
        data: bodyParams,
        success: (res) => {
          if (res.statusCode === 200) {
            // 开始轮询获取流式数据
            this.startPolling(url, res.data, callbacks);
          } else {
            onError?.(new Error(`HTTP ${res.statusCode}`));
          }
        },
        fail: (error) => {
          onError?.(error);
        },
      });

      return response;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  }

  /**
   * 开始轮询
   */
  startPolling(baseUrl, initialData, callbacks) {
    const { onData, onCompleted, onError } = callbacks;
    let isFirstMessage = true;
    let lastMessageId = initialData.message_id || '';

    const poll = async () => {
      try {
        const response = await Taro.request({
          url: `${baseUrl}/stream`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            'Last-Message-ID': lastMessageId,
          },
        });

        if (response.statusCode === 200 && response.data) {
          const { data } = response;

          if (data.event === 'message' || data.event === 'agent_message') {
            onData?.(data.answer || '', isFirstMessage, {
              conversationId: data.conversation_id,
              taskId: data.task_id,
              messageId: data.id,
            });

            isFirstMessage = false;
            lastMessageId = data.id;
          }

          if (data.event === 'message_end') {
            onCompleted?.();
            return;
          }

          // 继续轮询
          setTimeout(poll, 100);
        } else if (response.statusCode === 204) {
          // 没有新数据，继续轮询
          setTimeout(poll, 100);
        } else {
          onError?.(new Error(`轮询失败: ${response.statusCode}`));
        }
      } catch (error) {
        onError?.(error);
      }
    };

    // 开始轮询
    poll();
  }

  /**
   * 停止轮询
   */
  stop() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * 获取访问令牌
   */
  getAccessToken() {
    return Taro.getStorageSync('access_token') || '';
  }
}
