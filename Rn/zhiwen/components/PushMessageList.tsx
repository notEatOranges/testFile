import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PushMessage } from '../hooks/useGetuiPush';

interface PushMessageListProps {
  messages: PushMessage[];
  onRefresh?: () => void;
  onClearMessages?: () => void;
  refreshing?: boolean;
}

const MessageItem: React.FC<{ message: PushMessage }> = ({ message }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 1天内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={styles.messageItem}>
      <View style={styles.messageHeader}>
        <View style={styles.titleContainer}>
          <Ionicons name="notifications" size={16} color="#007AFF" />
          <Text style={styles.messageTitle} numberOfLines={1}>
            {message.title}
          </Text>
        </View>
        <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
      </View>
      
      <Text style={styles.messageContent} numberOfLines={3}>
        {message.content}
      </Text>
      
      {message.payload && typeof message.payload === 'object' && (
        <View style={styles.payloadContainer}>
          <Text style={styles.payloadLabel}>附加数据:</Text>
          <Text style={styles.payloadText}>
            {JSON.stringify(message.payload, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
};

export const PushMessageList: React.FC<PushMessageListProps> = ({
  messages,
  onRefresh,
  onClearMessages,
  refreshing = false,
}) => {
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>暂无推送消息</Text>
      <Text style={styles.emptySubtitle}>
        当有新消息时，它们会显示在这里
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        推送消息 ({messages.length})
      </Text>
      {messages.length > 0 && onClearMessages && (
        <TouchableOpacity onPress={onClearMessages} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          <Text style={styles.clearButtonText}>清空</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => `message-${item.timestamp}-${index}`}
        renderItem={({ item }) => <MessageItem message={item} />}
        ListEmptyComponent={renderEmptyList}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  messageItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  payloadContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  payloadLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  payloadText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
}); 