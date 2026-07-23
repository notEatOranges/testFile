import { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import { Toast } from '@nutui/nutui-react-taro';
import TaroAIChatModule from '../index';
import { getCurrentConfig, ConfigUtils } from '../config';
import { getAccessToken, handleAPIError } from '../utils/api';

export const useChat = () => {
  const config = getCurrentConfig();
  const [chatModule] = useState(() => new TaroAIChatModule({
    opening_statement: config.default.opening_statement,
    suggested_questions: config.default.suggested_questions,
  }));

  const [chatList, setChatList] = useState([]);
  const [isResponding, setIsResponding] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  const requestTaskRef = useRef(null);

  useEffect(() => {
    // 设置回调函数
    chatModule.setCallbacks({
      onData: handleStreamData,
      onCompleted: handleCompleted,
      onError: handleError,
      onAudioStart: handleAudioStart,
      onAudioEnd: handleAudioEnd,
      onChartGenerated: handleChartGenerated,
    });

    // 初始化开场白
    if (chatModule.config.opening_statement) {
      const openingItem = {
        id: 'opening',
        content: chatModule.config.opening_statement,
        isAnswer: true,
        isOpeningStatement: true,
        suggestedQuestions: chatModule.config.suggested_questions,
      };
      setChatList([openingItem]);
      setSuggestedQuestions(chatModule.config.suggested_questions);
    }
  }, []);

  // 处理流式数据
  const handleStreamData = (message, isFirstMessage, moreInfo) => {
    setDebugInfo(`收到数据: ${message.substring(0, 50)}...`);
    setChatList((prevList) => {
      const newList = [...prevList];
      const lastItem = newList[newList.length - 1];

      if (lastItem && lastItem.isAnswer && !lastItem.isOpeningStatement) {
        lastItem.content += message;
      } else {
        // 创建新的回答项
        const answerItem = {
          id: moreInfo.messageId || `answer-${Date.now()}`,
          content: message,
          isAnswer: true,
          conversationId: moreInfo.conversationId,
        };
        newList.push(answerItem);
      }

      return newList;
    });
  };

  // 处理完成
  const handleCompleted = (hasError, errorMessage) => {
    setIsResponding(false);
    setDebugInfo(hasError ? `错误: ${errorMessage}` : '对话完成');
    if (hasError) {
      Toast.show(errorMessage || '请求失败');
    }
  };

  // 处理错误
  const handleError = (error) => {
    setIsResponding(false);
    setDebugInfo(`错误: ${error}`);
    Toast.show(error || '请求失败');
  };

  // 处理音频开始
  const handleAudioStart = (text) => {
    setDebugInfo('开始播放语音');
    Toast.show('开始播放语音');
  };

  // 处理音频结束
  const handleAudioEnd = () => {
    setDebugInfo('语音播放结束');
    Toast.show('语音播放结束');
  };

  // 处理图表生成
  const handleChartGenerated = (chartConfig) => {
    setDebugInfo('图表生成完成');
    setChatList((prevList) => {
      const newList = [...prevList];
      const lastItem = newList[newList.length - 1];

      if (lastItem && lastItem.isAnswer) {
        lastItem.chartConfig = chartConfig;
      }

      return newList;
    });
  };

  // 发送消息
  const sendMessage = async (message) => {
    if (!message.trim() || isResponding) {
      setDebugInfo('无法发送：输入为空或正在响应中');
      return;
    }

    setDebugInfo('发送消息中...');

    // 添加用户消息
    const userItem = {
      id: `user-${Date.now()}`,
      content: message.trim(),
      isAnswer: false,
    };
    setChatList((prevList) => [...prevList, userItem]);

    setIsResponding(true);

    // 清理之前的请求任务
    if (requestTaskRef.current) {
      requestTaskRef.current.abort();
      requestTaskRef.current = null;
    }

    try {
      // 使用真实API接口
      const apiUrl = ConfigUtils.getApiUrl(config.api.chatMessages);
      setDebugInfo(`发送消息到API: ${apiUrl}`);

      // 添加重试机制
      let retryCount = 0;
      const maxRetries = 1;
      let lastError = null;

      while (retryCount < maxRetries) {
        try {
          // 直接使用Taro.request发送请求
          const response = await new Promise((resolve, reject) => {
            const requestTask = Taro.request({
              url: apiUrl,
              method: 'POST',
              header: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAccessToken()}`,
              },
              data: {
                query: message.trim(),
                inputs: { user_id: '1111', role: '1111' },
                conversation_id: chatModule.getConversationId(),
                response_mode: 'streaming', // 使用流式模式
              },
              timeout: 30000, // 30秒超时
              success: resolve,
              fail: reject,
            });

            // 保存请求任务以便中断
            requestTaskRef.current = requestTask;
          });

          console.log('Response:', response);

          if (response.statusCode === 200) {
            const { data } = response;
            setDebugInfo('收到API回复');

            // 添加AI回复
            const aiItem = {
              id: `ai-${Date.now()}`,
              content: data.answer || '抱歉，我没有收到有效的回复。',
              isAnswer: true,
              conversationId: data.conversation_id,
            };
            setChatList((prevList) => [...prevList, aiItem]);

            // 更新对话ID
            if (data.conversation_id) {
              chatModule.conversationId = data.conversation_id;
            }

            // 成功，跳出重试循环
            break;
          } else {
            throw new Error(`HTTP ${response.statusCode}: ${response.data?.message || '请求失败'}`);
          }
        } catch (error) {
          lastError = error;
          retryCount++;

          console.error(`第${retryCount}次请求失败:`, error);
          setDebugInfo(`第${retryCount}次请求失败: ${error.message}`);

          if (retryCount < maxRetries) {
            // 等待一段时间后重试
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
            setDebugInfo(`正在重试第${retryCount + 1}次...`);
          }
        }
      }

      // 如果所有重试都失败了
      if (retryCount >= maxRetries && lastError) {
        throw lastError;
      }
    } catch (error) {
      // 检查是否是用户主动中断
      if (error.errMsg?.includes('abort') || error.message?.includes('abort')) {
        console.log('请求被用户中断');
        setDebugInfo('请求已中断');

        // 添加中断提示到聊天列表
        const abortItem = {
          id: `abort-${Date.now()}`,
          content: '已停止生成回复',
          isAnswer: true,
          isAborted: true,
        };
        setChatList((prevList) => [...prevList, abortItem]);
      } else {
        console.error('发送消息失败:', error);
        console.error('Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          errMsg: error.errMsg,
        });
        const errorMessage = handleAPIError(error, '发送消息');

        // 添加错误消息到聊天列表
        const errorItem = {
          id: `error-${Date.now()}`,
          content: '抱歉，网络连接出现问题，请稍后重试。',
          isAnswer: true,
          isError: true,
        };
        setChatList((prevList) => [...prevList, errorItem]);
      }
    } finally {
      setIsResponding(false);
      requestTaskRef.current = null; // 清理请求任务
    }
  };

  // 停止对话
  const stopChat = () => {
    // 中断当前请求
    if (requestTaskRef.current) {
      requestTaskRef.current.abort();
      requestTaskRef.current = null;
    }

    // 调用模块的停止方法
    chatModule.handleStop();
    setIsResponding(false);
    setDebugInfo('已停止对话');
    Toast.show('已停止对话');
  };

  return {
    chatList,
    isResponding,
    suggestedQuestions,
    debugInfo,
    sendMessage,
    stopChat,
    setDebugInfo,
  };
};
