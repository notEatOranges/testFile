import React from 'react';
import { View, Text } from '@tarojs/components';

const DebugInfo = ({ debugInfo, inputValue, isResponding, isRecording, isProcessingVoice }) => {
  if (!debugInfo) return null;

  return (
    <View className="debug-info">
      <Text className="debug-text">
        {debugInfo} |
        输入长度: {inputValue.length} |
        响应中: {isResponding ? '是' : '否'} |
        录音中: {isRecording ? '是' : '否'} |
        语音处理中: {isProcessingVoice ? '是' : '否'}
      </Text>
    </View>
  );
};

export default DebugInfo;
