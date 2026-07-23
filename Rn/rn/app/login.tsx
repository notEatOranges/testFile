import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from '../components/Toast';
import { authService } from '../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fingerprintAvailable, setFingerprintAvailable] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [hasRefreshToken, setHasRefreshToken] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    checkFingerprintAvailability();
    checkFingerprintSettings();
    checkRefreshToken();
  }, []);

  const checkFingerprintAvailability = async () => {
    const available = await authService.isFingerprintAvailable();
    setFingerprintAvailable(available);
  };

  const checkFingerprintSettings = async () => {
    const settings = await authService.getFingerprintSettings();
    setFingerprintEnabled(settings.enabled);
  };

  const checkRefreshToken = async () => {
    try {
      const refreshToken = await authService.getRefreshToken();
      setHasRefreshToken(!!refreshToken);
    } catch (error) {
      setHasRefreshToken(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    try {
      const success = await authService.login(username.trim(), password);
      if (success) {
        // 检查是否已开启指纹登录
        const settings = await authService.getFingerprintSettings();
        
        if (!settings.enabled && fingerprintAvailable) {
          // 首次登录，提示是否开启指纹登录
          Alert.alert(
            '开启指纹登录',
            '是否要为当前账号开启指纹登录功能？\n\n开启后可以使用指纹快速登录，提升安全性和便利性。',
            [
              {
                text: '暂不开启',
                style: 'cancel',
                onPress: () => router.replace('/tabs'),
              },
              {
                text: '立即开启',
                onPress: () => {
                  router.push('/fingerprint-steps');
                },
              },
            ]
          );
        } else {
          Alert.alert('成功', '登录成功！', [
            {
              text: '确定',
              onPress: () => router.replace('/tabs'),
            },
          ]);
        }
      } else {
        Alert.alert('错误', '登录失败，请重试');
      }
    } catch (error) {
      console.error('登录错误:', error);
      Alert.alert('错误', '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFingerprintLogin = async () => {
    if (!fingerprintAvailable) {
      Alert.alert('提示', '设备不支持指纹认证');
      return;
    }

    if (!fingerprintEnabled) {
      Alert.alert('提示', '请先开启指纹登录功能');
      return;
    }

    if (!hasRefreshToken) {
      Alert.alert('提示', '没有可用的刷新Token，请重新登录');
      return;
    }

    setIsLoading(true);
    try {
              const success = await authService.fingerprintLogin();
        if (success) {
          setToastMessage('指纹登录成功！');
          setToastType('success');
          setShowToast(true);
          router.replace('/tabs');
        } else {
          Alert.alert('错误', '指纹认证失败，请重试');
        }
    } catch (error) {
      console.error('指纹登录错误:', error);
      Alert.alert('错误', '指纹登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupFingerprint = () => {
    if (!fingerprintAvailable) {
      Alert.alert('提示', '设备不支持指纹认证');
      return;
    }

    if (!username.trim()) {
      Alert.alert('提示', '请先输入用户名');
      return;
    }

    router.push('/fingerprint-steps');
  };

  return (
    <View style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>登录</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Logo区域 */}
          <View style={styles.logoContainer}>
            <Ionicons name="person-circle" size={100} color="#007AFF" />
            <Text style={styles.appTitle}>myApp</Text>
            <Text style={styles.appSubtitle}>欢迎回来</Text>
          </View>

          {/* 登录表单 */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="用户名"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="密码"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* 登录按钮 */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? '登录中...' : '登录'}
              </Text>
            </TouchableOpacity>

            {/* 指纹登录按钮 - 只在有刷新token时显示 */}
            {fingerprintAvailable && fingerprintEnabled && hasRefreshToken && (
              <TouchableOpacity
                style={[styles.fingerprintButton, isLoading && styles.fingerprintButtonDisabled]}
                onPress={handleFingerprintLogin}
                disabled={isLoading}
              >
                <Ionicons name="finger-print" size={24} color="#007AFF" />
                <Text style={styles.fingerprintButtonText}>
                  {isLoading ? '验证中...' : '指纹登录'}
                </Text>
              </TouchableOpacity>
            )}

            {/* 设置指纹登录 */}
            {fingerprintAvailable && !fingerprintEnabled && (
              <TouchableOpacity
                style={styles.setupFingerprintButton}
                onPress={handleSetupFingerprint}
              >
                <Text style={styles.setupFingerprintText}>设置指纹登录</Text>
              </TouchableOpacity>
            )}

            {/* 提示信息 */}
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>提示：任意用户名和密码都可以登录</Text>
            </View>
          </View>
        </ScrollView>
              </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fingerprintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    height: 50,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  fingerprintButtonDisabled: {
    borderColor: '#ccc',
  },
  fingerprintButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  setupFingerprintButton: {
    alignItems: 'center',
    marginBottom: 15,
  },
  setupFingerprintText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  tipContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  tipText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
}); 