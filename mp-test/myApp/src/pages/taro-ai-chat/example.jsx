/**
 * Taro + NutUI AI对话页面示例 - 重构版本
 */

import React, { useState, useEffect } from 'react';
import { View } from '@tarojs/components';
import { useChat, useRecording } from './hooks';
import { testRecording } from './utils';
import { ChatList, ChatInput, DebugInfo } from './components';
import './styles/example.scss';

const AIChatPage = () => {
  const [inputValue, setInputValue] = useState('');

  // 使用自定义hooks
  const {
    chatList,
    isResponding,
    // suggestedQuestions,
    debugInfo,
    sendMessage,
    stopChat,
    setDebugInfo,
  } = useChat();

  const {
    isRecording,
    isProcessingVoice,
    recordingTime,
    handleVoiceToText,
  } = useRecording((recognizedText) => {
    // 语音识别完成后的回调
    setInputValue(recognizedText);
  });

  useEffect(() => {
    // 测试录音功能
    testRecording().then((result) => {
      if (result.success) {
        setDebugInfo('录音功能测试完成');
      } else {
        setDebugInfo(`录音功能测试失败: ${result.error}`);
      }
    });
  }, []);

  // 处理发送消息
  const handleSend = () => {
    if (!inputValue.trim() || isResponding) {
      setDebugInfo('无法发送：输入为空或正在响应中');
      return;
    }
    sendMessage(inputValue);
    setInputValue('');
  };

  // 处理建议问题点击 - 直接发送
  const handleQuestionClick = (question) => {
    sendMessage(question);
  };

  return (
    <View className="ai-chat-page">
      {/* 调试信息 */}
      <DebugInfo
        debugInfo={debugInfo}
        inputValue={inputValue}
        isResponding={isResponding}
        isRecording={isRecording}
        isProcessingVoice={isProcessingVoice}
      />

      {/* 聊天列表 */}
      <ChatList
        chatList={chatList}
        isResponding={isResponding}
        onQuestionClick={handleQuestionClick}
      />

      {/* 输入区域 */}
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        isResponding={isResponding}
        isRecording={isRecording}
        isProcessingVoice={isProcessingVoice}
        recordingTime={recordingTime}
        onSend={handleSend}
        onStop={stopChat}
        onVoiceToText={handleVoiceToText}
      />
    </View>
  );
};

export default AIChatPage;
