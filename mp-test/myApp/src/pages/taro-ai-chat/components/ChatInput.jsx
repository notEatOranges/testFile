import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from '@tarojs/components';
import { Textarea as NutTextarea } from '@nutui/nutui-react-taro';

const ChatInput = ({
  inputValue,
  setInputValue,
  isResponding,
  onSend,
  onStop,
}) => {
  return (
    <View className="input-section">
      <View className="input-container">
        <NutTextarea
          value={inputValue}
          onChange={(value) => setInputValue(value)}
          placeholder="请输入您的问题..."
          autoSize={{ minRows: 1, maxRows: 5 }}
          disabled={isResponding}
          style={{
            maxHeight: '120px',
            overflowY: 'auto',
            overflowX: 'hidden',
            lineHeight: '1.4',
            padding: '8px 12px',
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <View className="input-actions">
          {/* 语音输入按钮 - 已隐藏 */}
          {/* <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <View
              className={`voice-btn ${isRecording ? 'recording' : ''} ${isProcessingVoice ? 'processing' : ''}`}
              onClick={onVoiceToText}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: 0,
                border: 'none',
                background: isProcessingVoice
                  ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
                  : isRecording
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isResponding || isProcessingVoice) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: (isResponding || isProcessingVoice) ? 0.6 : 1
              }}
            >
              {isProcessingVoice ? (
                <Loading type="spinner" size="16" color="white" />
              ) : (
                <Microphone size="18" />
              )}
            </View>

            {isRecording && (
              <Text style={{
                fontSize: '12px',
                color: '#ff6b6b',
                fontWeight: 'bold',
                minWidth: '30px',
                textAlign: 'center'
              }}>
                {formatTime(recordingTime)}
              </Text>
            )}

            {isProcessingVoice && (
              <Text style={{
                fontSize: '12px',
                color: '#f39c12',
                fontWeight: 'bold',
                minWidth: '50px',
                textAlign: 'center'
              }}>
                识别中...
              </Text>
            )}
          </View> */}

          {/* 发送/停止按钮 - 根据状态切换 */}
          {isResponding ? (
            <View
              className="stop-btn"
              onClick={onStop}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ff3b30',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>停止</Text>
            </View>
          ) : (
            <View
              className="send-btn"
              onClick={onSend}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: inputValue.trim() && !isResponding ? '#007aff' : '#c0c0c0',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && !isResponding ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
              }}
            >
              <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>发送</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

ChatInput.propTypes = {
  inputValue: PropTypes.string.isRequired,
  setInputValue: PropTypes.func.isRequired,
  isResponding: PropTypes.bool.isRequired,
  onSend: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
};

export default ChatInput;
