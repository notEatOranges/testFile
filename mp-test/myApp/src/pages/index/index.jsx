import { useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Input, Button } from '@tarojs/components';
import './index.scss';

// 单条消息组件
function MessageItem({ message }) {
  const isMe = message.from === 'me';
  const username = isMe ? '我' : '机器人';
  const avatar = isMe ? '👤' : '🤖';

  return (
    <View className={`message-item${isMe ? ' me' : ''}`}>
      <View className="message-meta">
        <View className="avatar">{avatar}</View>
        <Text className="username">{username}</Text>
      </View>
      <View className="message-content">
        <View className="message-bubble">
          <Text>{message.text}</Text>
        </View>
      </View>
    </View>
  );
}

// 消息列表组件
function MessageList({ messages }) {
  return (
    <View className="message-list">
      {messages.map((msg, idx) => (
        <MessageItem key={idx} message={msg} />
      ))}
    </View>
  );
}

// 输入框组件
function ChatInput({ onSend }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleVoiceToText = () => {
    // 这里可以添加语音转文字的逻辑
    alert('语音转文字功能待实现');
  };

  return (
    <View className="chat-input">
      <View className="input-container">
        <Input
          type="text"
          value={input}
          onInput={(e) => setInput(e.detail.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入消息..."
        />
        <Button className="voice-btn" onClick={handleVoiceToText}>
          🎤
        </Button>
      </View>
      <Button className="send-btn" onClick={handleSend}>
        发送
      </Button>
    </View>
  );
}

// 主对话界面组件
export default function App() {
  const [messages, setMessages] = useState([
    { from: 'other', text: '你好！有什么可以帮你的吗？' },
  ]);

  // 动态获取状态栏和安全区高度
  const { statusBarHeight = 46, safeArea, screenHeight } = Taro.getSystemInfoSync();
  // 正确计算底部安全距离
  const safeBottom = (safeArea && screenHeight)
    ? (screenHeight - safeArea.bottom)
    : 0;

  const handleSend = (text) => {
    setMessages([...messages, { from: 'me', text }]);
    // 这里可以添加自动回复等逻辑
  };

  return (
    <View className="chat-app">
      <View
        className="chat-header"
        style={{ paddingTop: `${statusBarHeight}px` }}
      >
        <Text className="chat-title">聊天对话</Text>
      </View>
      <View className="chat-body">
        <MessageList messages={messages} />
      </View>
      <View
        className="chat-footer"
        style={{ paddingBottom: `${safeBottom}px` }}
      >
        <ChatInput onSend={handleSend} />
      </View>
    </View>
  );
}
