import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { DeviceInfo, deviceService } from '../services/deviceService';
import { pushService } from '../services/pushService';

interface ReceivedMessage {
  id: string;
  type: string;
  title: string;
  content: string;
  timestamp: number;
  payload?: any;
}

export default function PushTestScreen() {
  const router = useRouter();
  const [cid, setCid] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({});
  const [isLoading, setIsLoading] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<ReceivedMessage[]>([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    loadPushInfo();
    loadDeviceInfo();
    
    // 添加调试日志
    addDebugInfo('🚀 推送测试页面加载');
    addDebugInfo('📱 平台: ' + Platform.OS);
    addDebugInfo('🕐 时间: ' + new Date().toLocaleString());
  }, []);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const loadPushInfo = async () => {
    setIsLoading(true);
    try {
      addDebugInfo('📱 开始加载推送信息');
      
      // 确保推送服务已初始化
      if (!pushService.isServiceInitialized()) {
        addDebugInfo('🔄 推送服务未初始化，正在初始化...');
        await pushService.initialize();
      }
      
      // 获取CID
      addDebugInfo('🆔 获取CID...');
      const clientId = await pushService.getClientId();
      setCid(clientId || '未获取到');
      if (clientId) {
        addDebugInfo(`✅ CID获取成功: ${clientId}`);
      } else {
        addDebugInfo('⚠️ CID获取失败');
      }

      // 获取状态
      addDebugInfo('📊 获取推送状态...');
      const pushStatus = await pushService.getStatus();
      setStatus(pushStatus);
      addDebugInfo(`📊 推送状态: ${pushStatus}`);

      // 获取版本
      addDebugInfo('📦 获取SDK版本...');
      const sdkVersion = await pushService.getVersion();
      setVersion(sdkVersion);
      addDebugInfo(`📦 SDK版本: ${sdkVersion}`);
      
    } catch (error) {
      console.error('加载推送信息失败:', error);
      addDebugInfo(`❌ 加载推送信息失败: ${error}`);
      setCid('获取失败');
      setStatus('未知');
      setVersion('未知');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCid = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 手动刷新CID...');
      addDebugInfo('🔄 开始手动刷新CID');
      
      // 先检查网络连接
      const hasNetwork = await pushService.checkNetworkConnection();
      if (!hasNetwork) {
        addDebugInfo('⚠️ 网络连接异常');
        Alert.alert('网络提示', '网络连接异常，CID获取可能失败。请检查网络连接后重试。');
      } else {
        addDebugInfo('✅ 网络连接正常');
      }
      
      // 使用强制刷新方法
      const clientId = await pushService.forceRefreshClientId();
      setCid(clientId || '未获取到');
      
      if (clientId) {
        addDebugInfo(`✅ CID刷新成功: ${clientId}`);
        Alert.alert('成功', `CID刷新成功: ${clientId}`);
      } else {
        addDebugInfo('❌ CID获取失败');
        Alert.alert('提示', 'CID获取失败，请检查网络连接和个推配置');
      }
    } catch (error) {
      console.error('刷新CID失败:', error);
      addDebugInfo(`❌ 刷新CID异常: ${error}`);
      Alert.alert('错误', '刷新CID失败');
    } finally {
      setIsLoading(false);
    }
  };

  const checkNetworkStatus = async () => {
    try {
      const hasNetwork = await pushService.checkNetworkConnection();
      Alert.alert('网络状态', hasNetwork ? '网络连接正常' : '网络连接异常');
    } catch (error) {
      Alert.alert('网络状态', '网络检查失败');
    }
  };

  const loadDeviceInfo = async () => {
    try {
      const info = await deviceService.getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('加载设备信息失败:', error);
    }
  };

  const handleTestPush = () => {
    Alert.alert(
      '测试推送',
      '选择测试类型',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '开启推送',
          onPress: () => {
            pushService.turnOnPush();
            Alert.alert('成功', '推送服务已开启');
            loadPushInfo();
          },
        },
        {
          text: '关闭推送',
          onPress: () => {
            pushService.turnOffPush();
            Alert.alert('成功', '推送服务已关闭');
            loadPushInfo();
          },
        },
        {
          text: '清除通知',
          onPress: () => {
            pushService.clearAllNotifications();
            Alert.alert('成功', '所有通知已清除');
          },
        },
      ]
    );
  };

  const handleBindAlias = () => {
    Alert.prompt(
      '绑定别名',
      '请输入要绑定的别名',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: (alias) => {
            if (alias && alias.trim()) {
              pushService.bindAlias(alias.trim());
              Alert.alert('成功', `别名 "${alias.trim()}" 绑定成功`);
            } else {
              Alert.alert('错误', '别名不能为空');
            }
          },
        },
      ],
      'plain-text',
      'test_user'
    );
  };

  const handleSetTags = () => {
    Alert.prompt(
      '设置标签',
      '请输入标签，多个标签用逗号分隔',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: (tagsInput) => {
            if (tagsInput && tagsInput.trim()) {
              const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
              const success = pushService.setTags(tags);
              if (success) {
                Alert.alert('成功', `标签设置成功: ${tags.join(', ')}`);
              } else {
                Alert.alert('错误', '标签设置失败');
              }
            } else {
              Alert.alert('错误', '标签不能为空');
            }
          },
        },
      ],
      'plain-text',
      'test,debug'
    );
  };

  const handleSendMessage = () => {
    Alert.prompt(
      '发送消息',
      '请输入要发送的消息内容',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async (message) => {
            if (message && message.trim()) {
              setIsLoading(true);
              try {
                const success = await pushService.sendMessage(message.trim());
                if (success) {
                  Alert.alert('成功', '消息发送成功');
                } else {
                  Alert.alert('错误', '消息发送失败');
                }
              } catch (error) {
                Alert.alert('错误', '消息发送失败');
              } finally {
                setIsLoading(false);
              }
            } else {
              Alert.alert('错误', '消息内容不能为空');
            }
          },
        },
      ],
      'plain-text',
      '测试消息'
    );
  };

  const copyCid = () => {
    if (cid && cid !== '未获取到' && cid !== '获取失败') {
      Alert.alert('CID', `CID: ${cid}\n\n已复制到剪贴板`);
    }
  };

  return (
    <View style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>推送测试</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 推送信息卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>推送信息</Text>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="phone-portrait" size={16} color="#666" />
              <Text style={styles.infoLabel}>个推CID:</Text>
            </View>
            <TouchableOpacity 
              style={styles.infoValue} 
              onPress={copyCid}
              activeOpacity={0.7}
            >
              <Text style={styles.infoText} numberOfLines={2}>
                {cid}
              </Text>
              <Ionicons name="copy" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.refreshCidButton, isLoading && styles.buttonDisabled]} 
            onPress={refreshCid}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color="#007AFF" />
            <Text style={styles.refreshCidButtonText}>
              {isLoading ? '刷新中...' : '刷新CID'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#666" />
              <Text style={styles.infoLabel}>状态:</Text>
            </View>
            <Text style={styles.infoText}>{status}</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="code" size={16} color="#666" />
              <Text style={styles.infoLabel}>版本:</Text>
            </View>
            <Text style={styles.infoText}>{version}</Text>
          </View>
        </View>

        {/* 设备信息卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="phone-portrait" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>设备信息</Text>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="hardware-chip" size={16} color="#666" />
              <Text style={styles.infoLabel}>设备型号:</Text>
            </View>
            <Text style={styles.infoText}>{deviceInfo.deviceModel || '未知'}</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="logo-android" size={16} color="#666" />
              <Text style={styles.infoLabel}>系统版本:</Text>
            </View>
            <Text style={styles.infoText}>{deviceInfo.osVersion || '未知'}</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="apps" size={16} color="#666" />
              <Text style={styles.infoLabel}>应用版本:</Text>
            </View>
            <Text style={styles.infoText}>{deviceInfo.appVersion || '未知'}</Text>
          </View>

          {deviceInfo.carrierId && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="cellular" size={16} color="#666" />
                <Text style={styles.infoLabel}>运营商CID:</Text>
              </View>
              <Text style={styles.infoText}>{deviceInfo.carrierId}</Text>
            </View>
          )}

          {deviceInfo.carrierName && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="business" size={16} color="#666" />
                <Text style={styles.infoLabel}>运营商:</Text>
              </View>
              <Text style={styles.infoText}>{deviceInfo.carrierName}</Text>
            </View>
          )}
        </View>

        {/* 推送控制 */}
        <View style={styles.controlCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>推送控制</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary, isLoading && styles.buttonDisabled]} 
            onPress={handleTestPush}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={20} color="#fff" />
            <Text style={styles.buttonText}>推送设置</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]} 
            onPress={handleBindAlias}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={20} color="#007AFF" />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>绑定别名</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]} 
            onPress={handleSetTags}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetags" size={20} color="#007AFF" />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>设置标签</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]} 
            onPress={handleSendMessage}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="#007AFF" />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>发送消息</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]} 
            onPress={checkNetworkStatus}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="wifi" size={20} color="#007AFF" />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>检查网络</Text>
          </TouchableOpacity>
        </View>

        {/* 说明卡片 */}
        <View style={styles.helpCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="help-circle" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>使用说明</Text>
          </View>
          <Text style={styles.description}>
            1. 个推CID是设备的唯一标识，用于接收推送消息{'\n'}
            2. 运营商CID用于识别手机运营商（仅Android）{'\n'}
            3. 绑定别名后可以通过别名进行精准推送{'\n'}
            4. 设置标签后可以通过标签进行分组推送{'\n'}
            5. 发送消息用于测试上行消息功能{'\n'}
            6. 推送设置可以控制推送服务的开关状态
          </Text>
        </View>

        {/* 刷新按钮 */}
        <TouchableOpacity 
          style={[styles.refreshButton, isLoading && styles.buttonDisabled]} 
          onPress={() => {
            loadPushInfo();
            loadDeviceInfo();
          }}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshButtonText}>
            {isLoading ? '加载中...' : '刷新信息'}
          </Text>
        </TouchableOpacity>

        {/* 消息接收记录 */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="chatbubbles" size={24} color="#007AFF" />
              <Text style={[styles.cardTitle, { flex: 1 }]}>消息接收记录</Text>
            </View>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setReceivedMessages([])}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>清空</Text>
            </TouchableOpacity>
          </View>
          
          {receivedMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>暂无接收到的消息</Text>
              <Text style={styles.emptyStateSubtext}>推送消息将显示在这里</Text>
            </View>
          ) : (
            <ScrollView style={styles.messageList} showsVerticalScrollIndicator={false}>
              {receivedMessages.map((message) => (
                <View key={message.id} style={styles.messageItem}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageType}>{message.type}</Text>
                    <Text style={styles.messageTime}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.messageTitle}>{message.title}</Text>
                  <Text style={styles.messageContent}>{message.content}</Text>
                  {message.payload && (
                    <Text style={styles.messagePayload}>
                      数据: {JSON.stringify(message.payload)}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 调试信息 */}
        <View style={styles.debugCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="bug" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>调试信息</Text>
          </View>
          <ScrollView style={styles.debugInfoList} showsVerticalScrollIndicator={false}>
            {debugInfo.map((info, index) => (
              <Text key={index} style={styles.debugInfoItem}>{info}</Text>
            ))}
          </ScrollView>
        </View>

        {/* 底部安全距离 */}
        <View style={styles.bottomSafeArea} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  controlCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginRight: 8,
    textAlign: 'right',
    flex: 1,
  },
  refreshCidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  refreshCidButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: '48%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonTextSecondary: {
    color: '#007AFF',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
  },
  messageList: {
    marginTop: 10,
  },
  messageItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '700',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  messageContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  messagePayload: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  debugCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  debugInfoList: {
    marginTop: 10,
  },
  debugInfoItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  bottomSafeArea: {
    height: Platform.OS === 'ios' ? 34 : 20,
  },
}); 