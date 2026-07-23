import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from '../components/Toast';
import { authService } from '../services/authService';

interface Step {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  icon: string;
}

export default function FingerprintStepsScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    checkFingerprintStatus();
  }, []);

  const checkFingerprintStatus = async () => {
    try {
      const settings = await authService.getFingerprintSettings();
      setIsFirstTime(!settings.enabled);
      
      if (settings.enabled) {
        // 二次登录流程
        setSteps([
          {
            id: 1,
            title: '指纹验证',
            description: '请使用指纹验证身份',
            status: 'pending',
            icon: 'finger-print',
          },
          {
            id: 2,
            title: '获取私钥',
            description: '从安全存储中获取私钥',
            status: 'pending',
            icon: 'key',
          },
          {
            id: 3,
            title: '解密Token',
            description: '使用私钥解密Refresh Token',
            status: 'pending',
            icon: 'lock-open',
          },
          {
            id: 4,
            title: '生成签名',
            description: '使用私钥对请求进行签名',
            status: 'pending',
            icon: 'document-text',
          },
          {
            id: 5,
            title: '请求Token',
            description: '调用后端接口获取Access Token',
            status: 'pending',
            icon: 'cloud-upload',
          },
          {
            id: 6,
            title: '登录成功',
            description: '更新登录状态，跳转到主页',
            status: 'pending',
            icon: 'checkmark-circle',
          },
        ]);
      } else {
        // 首次绑定流程
        setSteps([
          {
            id: 1,
            title: '指纹校验',
            description: '请使用指纹验证身份以开启指纹登录',
            status: 'pending',
            icon: 'finger-print',
          },
          {
            id: 2,
            title: '生成密钥对',
            description: '生成RSA公钥和私钥',
            status: 'pending',
            icon: 'key',
          },
          {
            id: 3,
            title: '获取设备信息',
            description: '获取设备ID和型号信息',
            status: 'pending',
            icon: 'phone-portrait',
          },
          {
            id: 4,
            title: '调用绑定接口',
            description: '将公钥和设备信息发送给后端',
            status: 'pending',
            icon: 'cloud-upload',
          },
          {
            id: 5,
            title: '加密存储',
            description: '保存后端返回的加密Refresh Token',
            status: 'pending',
            icon: 'lock-closed',
          },
          {
            id: 6,
            title: '更新设置',
            description: '更新指纹登录设置',
            status: 'pending',
            icon: 'settings',
          },
          {
            id: 7,
            title: '绑定完成',
            description: '指纹登录功能已开启',
            status: 'pending',
            icon: 'checkmark-circle',
          },
        ]);
      }
    } catch (error) {
      console.error('检查指纹状态失败:', error);
    }
  };

  const updateStepStatus = (stepId: number, status: Step['status']) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const startProcess = async () => {
    setIsProcessing(true);
    setCurrentStep(0);

    try {
      if (isFirstTime) {
        await handleFirstTimeBinding();
      } else {
        await handleFingerprintLogin();
      }
    } catch (error) {
      console.error('处理失败:', error);
      Alert.alert('错误', '操作失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFirstTimeBinding = async () => {
    try {
      // 步骤1: 指纹校验
      updateStepStatus(1, 'running');
      const isVerified = await authService.verifyFingerprintForSetup();
      if (isVerified) {
        updateStepStatus(1, 'completed');
      } else {
        updateStepStatus(1, 'failed');
        throw new Error('指纹校验失败');
      }

      // 步骤2: 生成密钥对
      updateStepStatus(2, 'running');
      await new Promise(resolve => setTimeout(resolve, 800));
      const keyPair = await authService.generateKeyPair();
      updateStepStatus(2, 'completed');

      // 步骤3: 获取设备信息
      updateStepStatus(3, 'running');
      await new Promise(resolve => setTimeout(resolve, 600));
      const deviceInfo = await authService.getDeviceInfo();
      updateStepStatus(3, 'completed');

      // 步骤4: 调用绑定接口
      updateStepStatus(4, 'running');
      await new Promise(resolve => setTimeout(resolve, 1200));
      const success = await authService.bindFingerprintLogin('testuser');
      if (success) {
        updateStepStatus(4, 'completed');
      } else {
        updateStepStatus(4, 'failed');
        throw new Error('绑定失败');
      }

      // 步骤5: 加密存储
      updateStepStatus(5, 'running');
      await new Promise(resolve => setTimeout(resolve, 600));
      updateStepStatus(5, 'completed');

      // 步骤6: 更新设置
      updateStepStatus(6, 'running');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(6, 'completed');

      // 步骤7: 绑定完成
      updateStepStatus(7, 'running');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus(7, 'completed');

      setToastMessage('指纹登录绑定成功！');
      setToastType('success');
      setShowToast(true);
      router.back();
    } catch (error) {
      console.error('首次绑定失败:', error);
      throw error;
    }
  };

  const handleFingerprintLogin = async () => {
    try {
      // 步骤1: 指纹验证
      updateStepStatus(1, 'running');
      const isAuthenticated = await authService.authenticateWithFingerprint();
      if (isAuthenticated) {
        updateStepStatus(1, 'completed');
      } else {
        updateStepStatus(1, 'failed');
        throw new Error('指纹验证失败');
      }

      // 步骤2: 获取私钥
      updateStepStatus(2, 'running');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus(2, 'completed');

      // 步骤3: 解密Token
      updateStepStatus(3, 'running');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus(3, 'completed');

      // 步骤4: 生成签名
      updateStepStatus(4, 'running');
      await new Promise(resolve => setTimeout(resolve, 600));
      updateStepStatus(4, 'completed');

      // 步骤5: 请求Token
      updateStepStatus(5, 'running');
      const success = await authService.fingerprintLogin();
      if (success) {
        updateStepStatus(5, 'completed');
      } else {
        updateStepStatus(5, 'failed');
        throw new Error('获取Token失败');
      }

      // 步骤6: 登录成功
      updateStepStatus(6, 'running');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus(6, 'completed');

      setToastMessage('指纹登录成功！');
      setToastType('success');
      setShowToast(true);
      router.replace('/tabs');
    } catch (error) {
      console.error('指纹登录失败:', error);
      throw error;
    }
  };

  const handleDisableFingerprint = () => {
    Alert.alert(
      '关闭指纹登录',
      '确定要关闭指纹登录吗？\n\n关闭后将清理所有相关数据，包括密钥对、指纹设置和刷新Token。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定关闭',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await authService.disableFingerprintLogin();
              if (success) {
                Alert.alert('成功', '指纹登录已关闭，所有相关数据已清理', [
                  {
                    text: '确定',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert('错误', '关闭失败，请重试');
              }
            } catch (error) {
              console.error('关闭指纹登录失败:', error);
              Alert.alert('错误', '关闭失败，请重试');
            }
          },
        },
      ]
    );
  };

  const getStepIcon = (step: Step) => {
    const iconColor = step.status === 'completed' ? '#34C759' : 
                     step.status === 'running' ? '#007AFF' : 
                     step.status === 'failed' ? '#FF3B30' : '#C7C7CC';
    
    return (
      <View style={[styles.stepIcon, { backgroundColor: iconColor }]}>
        {step.status === 'running' ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name={step.icon as any} size={20} color="#FFFFFF" />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFirstTime ? '指纹登录绑定' : '指纹登录验证'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.description}>
          <Text style={styles.descriptionTitle}>
            {isFirstTime ? '首次绑定指纹登录' : '使用指纹快速登录'}
          </Text>
          <Text style={styles.descriptionText}>
            {isFirstTime 
              ? '系统将首先验证您的指纹，然后生成密钥对，并将公钥绑定到您的账号。绑定成功后后端会生成新的刷新Token，实现安全的指纹登录功能。'
              : '通过指纹验证获取私钥，解密Token并生成签名，确保登录请求的安全性。'
            }
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepItem}>
              {getStepIcon(step)}
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={24} color="#34C759" />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>安全保障</Text>
            <Text style={styles.securityText}>
              • 私钥存储在AndroidKeyStore中，仅指纹验证后可用{'\n'}
              • 使用RSA签名确保请求未被篡改{'\n'}
              • 时间戳防重放攻击{'\n'}
              • 本地加密存储敏感信息{'\n'}
              • 指纹验证禁用设备密码回退
            </Text>
          </View>
        </View>

        {!isFirstTime && (
          <View style={styles.disableContainer}>
            <TouchableOpacity
              style={styles.disableButton}
              onPress={handleDisableFingerprint}
            >
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
              <Text style={styles.disableButtonText}>关闭指纹登录</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, isProcessing && styles.startButtonDisabled]}
          onPress={startProcess}
          disabled={isProcessing}
        >
          <Text style={styles.startButtonText}>
            {isProcessing ? '处理中...' : (isFirstTime ? '开始绑定' : '开始验证')}
          </Text>
        </TouchableOpacity>
      </View>
      <Toast 
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 10
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 39, // 与backButton宽度相同，保持标题居中
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stepsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  securityInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  securityContent: {
    flex: 1,
    marginLeft: 15,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  disableContainer: {
    marginBottom: 20,
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  disableButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 