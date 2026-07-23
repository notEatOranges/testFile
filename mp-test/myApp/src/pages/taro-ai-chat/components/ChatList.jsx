import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, ScrollView } from '@tarojs/components';
import { Loading } from '@nutui/nutui-react-taro';
import { Service } from '@nutui/icons-react-taro';
import ChatMessage from './ChatMessage';

const ChatList = ({ chatList, isResponding, onQuestionClick }) => {
  const [scrollTop, setScrollTop] = useState(0);

  // 监听聊天列表变化，自动滚动到底部
  useEffect(() => {
    if (chatList.length > 0) {
      setTimeout(() => {
        setScrollTop(9999);
      }, 100);
    }
  }, [chatList]);

  return (
    <ScrollView
      className="chat-list"
      scrollY
      scrollWithAnimation
      enhanced
      showScrollbar={false}
      scrollTop={scrollTop}
    >
      {chatList.map((item) => (
        <ChatMessage
          key={item.id}
          item={item}
          onQuestionClick={onQuestionClick}
        />
      ))}

      {/* 加载状态 */}
      {isResponding && (
        <View className="loading-item">
          <View className="message-avatar">
            <Service size="20" />
          </View>
          <View className="message-content">
            <Loading type="spinner" size="20" />
            <Text className="loading-text">AI正在思考...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

ChatList.propTypes = {
  chatList: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string,
    isAnswer: PropTypes.bool,
    isOpeningStatement: PropTypes.bool,
    isAborted: PropTypes.bool,
    suggestedQuestions: PropTypes.arrayOf(PropTypes.string),
    chartConfig: PropTypes.shape({
      type: PropTypes.string,
      option: PropTypes.shape({
        title: PropTypes.shape({
          text: PropTypes.string,
        }),
      }),
    }),
  })).isRequired,
  isResponding: PropTypes.bool.isRequired,
  onQuestionClick: PropTypes.func.isRequired,
};

export default ChatList;
