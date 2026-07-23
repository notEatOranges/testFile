import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

interface BiometricLoginProps {
  onLoginSuccess: () => void;
  onLoginFailure?: (error: string) => void;
}

export const BiometricLogin: React.FC<BiometricLoginProps> = ({
  onLoginSuccess,
  onLoginFailure,
}) => {
  const { isAvailable, authenticate, getBiometricTypeName } = useBiometricAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleBiometricAuth = async () => {
    if (!isAvailable) {
      Alert.alert('提示', '设备不支持生物识别或未设置生物识别');
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await authenticate();
      
      if (result.success) {
        onLoginSuccess();
      } else {
        const errorMessage = result.error || '认证失败';
        onLoginFailure?.(errorMessage);
        Alert.alert('认证失败', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '认证过程中发生错误';
      onLoginFailure?.(errorMessage);
      Alert.alert('错误', errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Ionicons name="finger-print-outline" size={64} color="#999" />
        <Text style={styles.title}>生物识别不可用</Text>
        <Text style={styles.subtitle}>
          您的设备不支持{getBiometricTypeName()}或未设置{getBiometricTypeName()}
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => onLoginSuccess()}>
          <Text style={styles.buttonText}>使用其他方式登录</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name="finger-print" 
          size={80} 
          color={isAuthenticating ? "#007AFF" : "#333"} 
        />
        {isAuthenticating && (
          <ActivityIndicator 
            size="large" 
            color="#007AFF" 
            style={styles.loadingIndicator}
          />
        )}
      </View>
      
      <Text style={styles.title}>使用{getBiometricTypeName()}登录</Text>
      <Text style={styles.subtitle}>
        请将手指放在{getBiometricTypeName()}传感器上
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isAuthenticating && styles.buttonDisabled]}
        onPress={handleBiometricAuth}
        disabled={isAuthenticating}
      >
        <Text style={styles.buttonText}>
          {isAuthenticating ? '验证中...' : `使用${getBiometricTypeName()}登录`}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.alternativeButton}
        onPress={() => onLoginSuccess()}
      >
        <Text style={styles.alternativeButtonText}>使用其他方式登录</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#fff',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativeButton: {
    paddingVertical: 10,
  },
  alternativeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
}); 