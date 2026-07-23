import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Clipboard,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import HeaderBar from '../components/HeaderBar';

// 定义路由参数类型
type MessageDetailParams = {
  messageId?: string;
  title?: string;
  content?: string;
  timestamp?: string;
  type?: string;
  pushMessageId?: string;
  pushTaskId?: string;
}

export default function MessageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<MessageDetailParams>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 标记消息为已读
    markMessageAsRead();
  }, []);

  const markMessageAsRead = async () => {
    try {
      // 这里可以调用API标记消息为已读
      if (params.messageId) {
        console.log('📖 标记消息为已读:', params.messageId);
        // await apiService.markMessageAsRead(params.messageId);
      }
    } catch (error) {
      console.error('标记消息为已读失败:', error);
    }
  };

  const handleDeleteMessage = () => {
    Alert.alert(
      '删除消息',
      '确定要删除这条消息吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // 这里可以调用API删除消息
              console.log('🗑️ 删除消息:', params.messageId);
              // await apiService.deleteMessage(params.messageId);
              
              Alert.alert('成功', '消息已删除', [
                { text: '确定', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('删除消息失败:', error);
              Alert.alert('错误', '删除消息失败');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleShareMessage = async () => {
    try {
      const title = params.title || '消息';
      const content = params.content || '';
      const timestamp = params.timestamp || '';
      
      await Share.share({
        message: `${title}\n\n${content}\n\n时间: ${timestamp}`,
        title: title,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const handleCopyContent = () => {
    const title = params.title || '消息';
    const content = params.content || '';
    const textToCopy = `${title}\n\n${content}`;
    Clipboard.setString(textToCopy);
    Alert.alert('成功', '内容已复制到剪贴板');
  };

  const getMessageTypeInfo = (type: string) => {
    switch (type) {
      case 'system':
        return { icon: '🔧', label: '系统通知', color: '#007AFF' };
      case 'notification':
        return { icon: '📢', label: '通知消息', color: '#FF9500' };
      case 'push':
        return { icon: '📱', label: '推送消息', color: '#34C759' };
      default:
        return { icon: '📄', label: '普通消息', color: '#8E8E93' };
    }
  };

  const typeInfo = getMessageTypeInfo(params.type);

  // 右侧删除按钮组件
  const DeleteButton = () => (
    <TouchableOpacity 
      style={styles.headerButton}
      onPress={handleDeleteMessage}
    >
      <Ionicons name="trash-outline" size={22} color="#FF3B30" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="消息详情" 
        showBackButton={true}
        rightComponent={<DeleteButton />}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 消息类型标签 */}
        <View style={[styles.typeTag, { backgroundColor: typeInfo.color }]}>
          <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
          <Text style={styles.typeLabel}>{typeInfo.label}</Text>
        </View>

        {/* 消息标题 */}
        <Text style={styles.title}>{params.title}</Text>

        {/* 消息时间 */}
        <Text style={styles.timestamp}>{params.timestamp}</Text>

        {/* 消息内容 */}
        <View style={styles.contentContainer}>
          <Text style={styles.contentText}>{params.content}</Text>
        </View>

        {/* 推送消息额外信息 */}
        {params.type === 'push' && (params.pushMessageId || params.pushTaskId) && (
          <View style={styles.pushInfo}>
            <Text style={styles.pushInfoTitle}>推送信息</Text>
            {params.pushMessageId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>消息ID:</Text>
                <Text style={styles.infoValue}>{params.pushMessageId}</Text>
              </View>
            )}
            {params.pushTaskId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>任务ID:</Text>
                <Text style={styles.infoValue}>{params.pushTaskId}</Text>
              </View>
            )}
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShareMessage}
          >
            <Ionicons name="share-outline" size={20} color="white" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>分享</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#34C759' }]}
            onPress={handleCopyContent}
          >
            <Ionicons name="copy-outline" size={20} color="white" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>复制</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 32,
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  pushInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pushInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 