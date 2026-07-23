import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BiometricLogin } from '../../components/BiometricLogin';
import { PushMessageList } from '../../components/PushMessageList';
import { useGetuiPush } from '../../hooks/useGetuiPush';

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'messages'>('home');
  const { 
    clientId, 
    isInitialized, 
    messages, 
    isMockMode,
    requestPermissions, 
    setTags, 
    setAlias, 
    clearMessages,
    sendTestMessage
  } = useGetuiPush();

  useEffect(() => {
    // 应用启动时请求推送权限
    if (isInitialized) {
      requestPermissions();
    }
  }, [isInitialized]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    // 登录成功后设置用户标签和别名
    setTags(['user', 'premium']);
    setAlias('user123');
  };

  const handleLoginFailure = (error: string) => {
    console.error('登录失败:', error);
  };

  const handleRefresh = () => {
    // 刷新推送消息列表
    console.log('刷新消息列表');
  };

  const handleSendTestMessage = () => {
    sendTestMessage();
    Alert.alert('提示', '测试消息已发送，请查看消息列表');
  };

  const renderHomeTab = () => (
    <View style={styles.homeContainer}>
      <View style={styles.welcomeSection}>
        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
        <Text style={styles.welcomeTitle}>欢迎回来！</Text>
        <Text style={styles.welcomeSubtitle}>
          您已成功使用指纹登录
        </Text>
      </View>

      {isMockMode && (
        <View style={styles.mockModeBanner}>
          <Ionicons name="information-circle" size={20} color="#FF9500" />
          <Text style={styles.mockModeText}>
            开发模式：使用模拟推送服务
          </Text>
        </View>
      )}

      <View style={styles.statusSection}>
        <View style={styles.statusCard}>
          <Ionicons name="notifications" size={24} color="#007AFF" />
          <Text style={styles.statusTitle}>推送服务</Text>
          <Text style={styles.statusValue}>
            {isInitialized ? (isMockMode ? '模拟模式' : '已连接') : '未连接'}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Ionicons name="finger-print" size={24} color="#4CAF50" />
          <Text style={styles.statusTitle}>指纹认证</Text>
          <Text style={styles.statusValue}>已启用</Text>
        </View>

        <View style={styles.statusCard}>
          <Ionicons name="chatbubbles" size={24} color="#FF9500" />
          <Text style={styles.statusTitle}>未读消息</Text>
          <Text style={styles.statusValue}>{messages.length}</Text>
        </View>
      </View>

      {clientId && (
        <View style={styles.clientIdSection}>
          <Text style={styles.clientIdLabel}>设备ID:</Text>
          <Text style={styles.clientIdValue} numberOfLines={1}>
            {clientId}
          </Text>
        </View>
      )}

      {isMockMode && (
        <TouchableOpacity 
          style={styles.testButton}
          onPress={handleSendTestMessage}
        >
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles.testButtonText}>发送测试消息</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => setIsLoggedIn(false)}
      >
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMessagesTab = () => (
    <PushMessageList
      messages={messages}
      onRefresh={handleRefresh}
      onClearMessages={clearMessages}
      refreshing={false}
    />
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <BiometricLogin
          onLoginSuccess={handleLoginSuccess}
          onLoginFailure={handleLoginFailure}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>指纹登录 & 推送</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, currentTab === 'home' && styles.activeTab]}
            onPress={() => setCurrentTab('home')}
          >
            <Ionicons 
              name="home" 
              size={20} 
              color={currentTab === 'home' ? '#007AFF' : '#999'} 
            />
            <Text style={[styles.tabText, currentTab === 'home' && styles.activeTabText]}>
              首页
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, currentTab === 'messages' && styles.activeTab]}
            onPress={() => setCurrentTab('messages')}
          >
            <Ionicons 
              name="notifications" 
              size={20} 
              color={currentTab === 'messages' ? '#007AFF' : '#999'} 
            />
            <Text style={[styles.tabText, currentTab === 'messages' && styles.activeTabText]}>
              消息
            </Text>
            {messages.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{messages.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容区域 */}
      <View style={styles.content}>
        {currentTab === 'home' ? renderHomeTab() : renderMessagesTab()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  homeContainer: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mockModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  mockModeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  statusSection: {
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  statusValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  clientIdSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  clientIdLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  clientIdValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28A745',
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
