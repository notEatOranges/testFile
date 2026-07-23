import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from '@tarojs/components';
// import { Button as NutButton } from '@nutui/nutui-react-taro';
import { User, Service } from '@nutui/icons-react-taro';

const ChatMessage = ({ item, onQuestionClick }) => {
  const isUser = !item.isAnswer;
  const isOpening = item.isOpeningStatement;
  const { isAborted } = item;

  return (
    <View className={`message-item ${isUser ? 'user' : 'ai'} ${isOpening ? 'opening' : ''} ${isAborted ? 'aborted' : ''}`}>
      <View className="message-avatar">
        {isUser ? (
          <User size="20" />
        ) : (
          <Service size="20" />
        )}
      </View>

      <View className="message-content">
        <View className="message-text">
          {item.content}
        </View>

        {/* 建议问题 */}
        {item.suggestedQuestions && item.suggestedQuestions.length > 0 && (
          <View className="suggested-questions">
            {item.suggestedQuestions.map((question) => (
              <View
                key={`question-${question}`}
                className="suggested-question-btn"
                onClick={() => onQuestionClick && onQuestionClick(question)}
              >
                {question}
              </View>
            ))}
          </View>
        )}

        {/* 图表 */}
        {item.chartConfig && (
          <View className="chart-container">
            <Text className="chart-title">{item.chartConfig.option.title.text}</Text>
            {/* 这里需要集成ECharts组件 */}
            <View className="chart-placeholder">
              图表: {item.chartConfig.type}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

ChatMessage.propTypes = {
  item: PropTypes.shape({
    isAnswer: PropTypes.bool,
    isOpeningStatement: PropTypes.bool,
    isAborted: PropTypes.bool,
    content: PropTypes.string,
    suggestedQuestions: PropTypes.arrayOf(PropTypes.string),
    chartConfig: PropTypes.shape({
      type: PropTypes.string,
      option: PropTypes.shape({
        title: PropTypes.shape({
          text: PropTypes.string,
        }),
      }),
    }),
  }).isRequired,
  onQuestionClick: PropTypes.func,
};

export default ChatMessage;
