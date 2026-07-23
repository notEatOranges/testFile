import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { navigationService } from '../services/navigationService';
import { pushService } from '../services/pushService';

export default function PushTestScreen() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string>('未知');
  const [testPage, setTestPage] = useState<string>('message-detail');
  const [testParams, setTestParams] = useState<string>('{"messageId": "test123"}');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // 初始化推送服务
    initializePushService();
    
    // 添加日志监听
    const originalLog = console.log;
    console.log = (...args) => {
      const logMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${logMessage}`]);
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const initializePushService = async () => {
    try {
      const isInitialized = await pushService.initialize();
      if (isInitialized) {
        const cid = await pushService.getClientId();
        setClientId(cid);
        
        const status = await pushService.getStatus();
        setPushStatus(status);
        
        addLog('✅ 推送服务初始化成功');
      } else {
        addLog('❌ 推送服务初始化失败');
      }
    } catch (error) {
      addLog(`❌ 推送服务初始化错误: ${error}`);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testGetClientId = async () => {
    try {
      addLog('🔄 正在获取 Client ID...');
      const cid = await pushService.getClientId();
      if (cid) {
        setClientId(cid);
        addLog(`✅ 获取 Client ID 成功: ${cid}`);
      } else {
        addLog('❌ 获取 Client ID 失败');
      }
    } catch (error) {
      addLog(`❌ 获取 Client ID 错误: ${error}`);
    }
  };

  const testPushStatus = async () => {
    try {
      addLog('🔄 正在检查推送状态...');
      const status = await pushService.getStatus();
      setPushStatus(status);
      addLog(`✅ 推送状态: ${status}`);
    } catch (error) {
      addLog(`❌ 检查推送状态错误: ${error}`);
    }
  };

  const testPageNavigation = () => {
    try {
      addLog(`🧭 测试页面跳转: ${testPage}`);
      
      // 解析参数
      let params = {};
      try {
        params = JSON.parse(testParams);
      } catch (error) {
        addLog('⚠️ 参数格式错误，使用空参数');
      }
      
      // 发送页面跳转事件
      const eventEmitter = navigationService.getEventEmitter();
      if (eventEmitter) {
        eventEmitter.emit('navigateToPage', {
          page: testPage,
          params,
          timestamp: new Date().toISOString()
        });
        addLog(`✅ 页面跳转事件已发送: ${testPage}`);
      } else {
        addLog('❌ 事件发射器不可用');
      }
    } catch (error) {
      addLog(`❌ 页面跳转测试错误: ${error}`);
    }
  };

  const testMessageCenterNavigation = () => {
    try {
      addLog('🧭 测试跳转消息中心');
      
      const eventEmitter = navigationService.getEventEmitter();
      if (eventEmitter) {
        eventEmitter.emit('navigateToMessageCenter', {
          messageId: 'test-' + Date.now(),
          title: '测试推送消息',
          content: '这是一条测试推送消息',
          taskId: 'test-task-' + Date.now(),
        });
        addLog('✅ 消息中心跳转事件已发送');
      } else {
        addLog('❌ 事件发射器不可用');
      }
    } catch (error) {
      addLog(`❌ 消息中心跳转测试错误: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyClientId = () => {
    if (clientId) {
      // 在 React Native 中，可以使用 Clipboard API
      Alert.alert('复制成功', `Client ID: ${clientId}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>个推推送测试</Text>
          <Text style={styles.subtitle}>测试推送服务和页面跳转功能</Text>
        </View>

        {/* 推送状态信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>推送状态</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Client ID:</Text>
            <TouchableOpacity onPress={copyClientId} style={styles.clientIdContainer}>
              <Text style={styles.clientId} numberOfLines={1}>
                {clientId || '未获取'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>推送状态:</Text>
            <Text style={styles.value}>{pushStatus}</Text>
          </View>
        </View>

        {/* 功能测试 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能测试</Text>
          
          <TouchableOpacity style={styles.button} onPress={testGetClientId}>
            <Text style={styles.buttonText}>获取 Client ID</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testPushStatus}>
            <Text style={styles.buttonText}>检查推送状态</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testMessageCenterNavigation}>
            <Text style={styles.buttonText}>测试跳转消息中心</Text>
          </TouchableOpacity>
        </View>

        {/* 页面跳转测试 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>页面跳转测试</Text>
          
          <Text style={styles.label}>目标页面:</Text>
          <TextInput
            style={styles.input}
            value={testPage}
            onChangeText={setTestPage}
            placeholder="输入页面名称，如: message-detail"
          />
          
          <Text style={styles.label}>参数 (JSON):</Text>
          <TextInput
            style={styles.input}
            value={testParams}
            onChangeText={setTestParams}
            placeholder='{"messageId": "test123"}'
            multiline
          />
          
          <TouchableOpacity style={styles.button} onPress={testPageNavigation}>
            <Text style={styles.buttonText}>测试页面跳转</Text>
          </TouchableOpacity>
        </View>

        {/* 日志显示 */}
        <View style={styles.section}>
          <View style={styles.logHeader}>
            <Text style={styles.sectionTitle}>运行日志</Text>
            <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>清空</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.logContainer}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText} numberOfLines={3}>
                {log}
              </Text>
            ))}
            {logs.length === 0 && (
              <Text style={styles.emptyLogText}>暂无日志</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
    width: 100,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  clientIdContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
  },
  clientId: {
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  logText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  emptyLogText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 