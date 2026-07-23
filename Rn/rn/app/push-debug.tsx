import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import HeaderBar from '../components/HeaderBar';
import { permissionService } from '../services/permissionService';
import { pushService } from '../services/pushService';

export default function PushDebugScreen() {
  const router = useRouter();
  const [cid, setCid] = useState<string>('未获取');
  const [status, setStatus] = useState<string>('未知');
  const [version, setVersion] = useState<string>('未知');
  const [isLoading, setIsLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<string>('未知');

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  useEffect(() => {
    loadPushInfo();
    checkPermission();
  }, []);

  const loadPushInfo = async () => {
    setIsLoading(true);
    try {
      addDebugLog('📱 开始加载推送信息');
      
      // 确保推送服务已初始化
      if (!pushService.isServiceInitialized()) {
        addDebugLog('🔄 推送服务未初始化，正在初始化...');
        await pushService.initialize();
      }
      
      // 获取CID
      addDebugLog('🆔 获取CID...');
      const clientId = await pushService.getClientId();
      setCid(clientId || '未获取到');
      if (clientId) {
        addDebugLog(`✅ CID获取成功: ${clientId}`);
      } else {
        addDebugLog('⚠️ CID获取失败');
      }

      // 获取状态
      addDebugLog('📊 获取推送状态...');
      const pushStatus = await pushService.getStatus();
      setStatus(pushStatus);
      addDebugLog(`📊 推送状态: ${pushStatus}`);

      // 获取版本
      addDebugLog('📦 获取SDK版本...');
      const sdkVersion = await pushService.getVersion();
      setVersion(sdkVersion);
      addDebugLog(`📦 SDK版本: ${sdkVersion}`);
      
    } catch (error) {
      console.error('加载推送信息失败:', error);
      addDebugLog(`❌ 加载推送信息失败: ${error}`);
      setCid('获取失败');
      setStatus('未知');
      setVersion('未知');
    } finally {
      setIsLoading(false);
    }
  };

  const testPushMessage = async () => {
    if (!testMessage.trim()) {
      Alert.alert('提示', '请输入测试消息内容');
      return;
    }

    try {
      addDebugLog(`📤 发送测试消息: ${testMessage}`);
      const result = await pushService.sendMessage(testMessage);
      if (result) {
        addDebugLog('✅ 测试消息发送成功');
        Alert.alert('成功', '测试消息发送成功');
      } else {
        addDebugLog('❌ 测试消息发送失败');
        Alert.alert('失败', '测试消息发送失败');
      }
    } catch (error) {
      addDebugLog(`❌ 发送测试消息异常: ${error}`);
      Alert.alert('错误', `发送测试消息失败: ${error}`);
    }
  };

  const checkNetwork = async () => {
    try {
      addDebugLog('🌐 检查网络连接...');
      const isConnected = await pushService.checkNetworkConnection();
      if (isConnected) {
        addDebugLog('✅ 网络连接正常');
        Alert.alert('网络状态', '网络连接正常');
      } else {
        addDebugLog('❌ 网络连接异常');
        Alert.alert('网络状态', '网络连接异常');
      }
    } catch (error) {
      addDebugLog(`❌ 网络检查失败: ${error}`);
      Alert.alert('错误', `网络检查失败: ${error}`);
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
    addDebugLog('🧹 日志已清空');
  };

  const copyCid = () => {
    if (cid && cid !== '未获取' && cid !== '获取失败') {
      // 这里可以添加复制到剪贴板的功能
      Alert.alert('CID', `CID: ${cid}\n\n已复制到剪贴板`);
    } else {
      Alert.alert('提示', 'CID未获取到，无法复制');
    }
  };

  const checkPermission = async () => {
    try {
      addDebugLog('🔐 检查通知权限...');
      const status = await permissionService.checkNotificationPermission();
      
      if (status.granted) {
        setPermissionStatus('已授予');
        addDebugLog('✅ 通知权限已授予');
      } else if (status.denied) {
        setPermissionStatus('被拒绝');
        addDebugLog('❌ 通知权限被拒绝');
      } else if (status.blocked) {
        setPermissionStatus('被阻止');
        addDebugLog('🚫 通知权限被阻止');
      } else {
        setPermissionStatus('不可用');
        addDebugLog('⚠️ 通知权限不可用');
      }
    } catch (error) {
      addDebugLog(`❌ 检查权限失败: ${error}`);
      setPermissionStatus('检查失败');
    }
  };

  const requestPermission = async () => {
    try {
      addDebugLog('🔐 请求通知权限...');
      const granted = await permissionService.requestNotificationPermission();
      
      if (granted) {
        setPermissionStatus('已授予');
        addDebugLog('✅ 通知权限请求成功');
        Alert.alert('成功', '通知权限已授予');
      } else {
        setPermissionStatus('被拒绝');
        addDebugLog('❌ 通知权限请求失败');
        Alert.alert('提示', '通知权限被拒绝，请在设置中手动开启');
      }
    } catch (error) {
      addDebugLog(`❌ 请求权限失败: ${error}`);
      Alert.alert('错误', `请求权限失败: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="推送调试工具" 
        showBackButton={true}
      />

      <ScrollView style={styles.scrollView}>
        {/* 推送信息卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 推送信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>CID:</Text>
            <Text style={styles.value} numberOfLines={1}>{cid}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyCid}>
              <Text style={styles.copyButtonText}>复制</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>状态:</Text>
            <Text style={styles.value}>{status}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>版本:</Text>
            <Text style={styles.value}>{version}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={loadPushInfo}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '加载中...' : '刷新信息'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 权限管理卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔐 权限管理</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>通知权限:</Text>
            <Text style={styles.infoValue}>{permissionStatus}</Text>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={checkPermission}>
            <Text style={styles.buttonText}>检查权限状态</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>请求通知权限</Text>
          </TouchableOpacity>
        </View>

        {/* 测试功能卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧪 测试功能</Text>
          
          <TextInput
            style={styles.input}
            placeholder="输入测试消息内容"
            value={testMessage}
            onChangeText={setTestMessage}
            multiline
          />
          
          <TouchableOpacity style={styles.button} onPress={testPushMessage}>
            <Text style={styles.buttonText}>发送测试消息</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={checkNetwork}>
            <Text style={styles.buttonText}>检查网络连接</Text>
          </TouchableOpacity>
        </View>

        {/* 调试日志卡片 */}
        <View style={styles.card}>
          <View style={styles.logHeader}>
            <Text style={styles.cardTitle}>📋 调试日志</Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
              <Text style={styles.clearButtonText}>清空</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logContainer} nestedScrollEnabled>
            {debugLogs.length === 0 ? (
              <Text style={styles.noLogs}>暂无日志</Text>
            ) : (
              debugLogs.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>

        {/* 使用说明 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📖 使用说明</Text>
          <Text style={styles.instructionText}>
            1. 确保应用已获取到有效的CID{'\n'}
            2. 在个推控制台发送测试推送{'\n'}
            3. 观察调试日志中的事件接收情况{'\n'}
            4. 如果收到推送但没显示，检查消息处理逻辑{'\n'}
            5. 如果没收到推送，检查网络和CID配置
          </Text>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  // 标题栏样式已由HeaderBar组件提供
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
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
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  logContainer: {
    maxHeight: 200,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  noLogs: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 