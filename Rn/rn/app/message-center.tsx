import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import HeaderBar from '../components/HeaderBar';

interface Message {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'system' | 'notification' | 'push';
  messageId?: string;
  taskId?: string;
}

// 定义路由参数类型
type MessageDetailRouteParams = {
  messageId: string;
  title: string;
  content: string;
  timestamp: string;
  type: string;
  pushMessageId: string;
  pushTaskId: string;
}

export default function MessageCenterScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 模拟消息数据
  const mockMessages: Message[] = [
    {
      id: '1',
      title: '系统通知',
      content: '欢迎使用我们的应用！',
      timestamp: '2024-01-15 10:30:00',
      isRead: true,
      type: 'system',
    },
    {
      id: '2',
      title: '推送消息',
      content: '您有一条新的推送消息',
      timestamp: '2024-01-15 09:15:00',
      isRead: false,
      type: 'push',
      messageId: 'msg_001',
    },
    {
      id: '3',
      title: '活动通知',
      content: '新活动已上线，快来参与吧！',
      timestamp: '2024-01-14 14:20:00',
      isRead: false,
      type: 'notification',
    },
    {
      id: '4',
      title: '系统维护通知',
      content: '系统将于今晚22:00-23:00进行维护，请提前做好准备。',
      timestamp: '2024-01-14 09:00:00',
      isRead: true,
      type: 'system',
    },
  ];

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      // 这里可以从API获取消息列表
      // const response = await apiService.getMessages();
      // setMessages(response.data);
      
      // 暂时使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessages(mockMessages);
    } catch (error) {
      console.error('加载消息失败:', error);
      Alert.alert('错误', '加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMessagePress = (message: Message) => {
    // 标记为已读
    if (!message.isRead) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, isRead: true } : msg
        )
      );
    }

    // 跳转到消息详情页面
    const params: MessageDetailRouteParams = {
      messageId: message.id,
      title: message.title,
      content: message.content,
      timestamp: message.timestamp,
      type: message.type,
      pushMessageId: message.messageId || '',
      pushTaskId: message.taskId || '',
    };
    
    router.push({
      pathname: '/message-detail',
      params
    });
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[styles.messageItem, !item.isRead && styles.unreadMessage]}
      onPress={() => handleMessagePress(item)}
      activeOpacity={0.7}
    >
      {/* 消息类型图标 */}
      <View style={[styles.typeIcon, { backgroundColor: getMessageTypeColor(item.type) }]}>
        <Text style={styles.typeIconText}>{getMessageTypeIcon(item.type)}</Text>
      </View>
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageTitle, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return '🔧';
      case 'notification':
        return '📢';
      case 'push':
        return '📱';
      default:
        return '📄';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'system':
        return '#007AFF';
      case 'notification':
        return '#FF9500';
      case 'push':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const formatTime = (timestamp: string) => {
    // 简单的时间格式化，可以根据需求调整
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    }
  };

  // 右侧清除按钮组件
  const ClearButton = () => (
    <TouchableOpacity 
      style={styles.clearButton}
      onPress={() => {
        Alert.alert(
          '清空已读',
          '确定要清空所有已读消息吗？',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '确定', 
              onPress: () => {
                setMessages(prev => prev.filter(msg => !msg.isRead));
                Alert.alert('成功', '已清空所有已读消息');
              }
            }
          ]
        );
      }}
    >
      <Text style={styles.clearButtonText}>清空已读</Text>
    </TouchableOpacity>
  );

  if (loading && messages.length === 0) {
    return (
      <View style={styles.container}>
        <HeaderBar title="消息中心" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="消息中心" 
        showBackButton={true}
        rightComponent={<ClearButton />}
      />
      
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContainer,
          messages.length === 0 && styles.emptyListContainer
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeIconText: {
    fontSize: 18,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
}); 