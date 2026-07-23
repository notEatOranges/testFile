import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType[]>([]);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsAvailable(hasHardware && isEnrolled);
      setBiometricType(supportedTypes);
    } catch (error) {
      console.error('检查生物识别可用性失败:', error);
      setIsAvailable(false);
    }
  };

  const authenticate = async (): Promise<BiometricAuthResult> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '请使用指纹验证身份',
        fallbackLabel: '使用密码',
        cancelLabel: '取消',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || '认证失败' 
        };
      }
    } catch (error) {
      console.error('指纹认证失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '认证过程中发生错误' 
      };
    }
  };

  const getBiometricTypeName = () => {
    if (biometricType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return '指纹';
    } else if (biometricType.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return '面部识别';
    } else if (biometricType.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return '虹膜';
    }
    return '生物识别';
  };

  return {
    isAvailable,
    biometricType,
    authenticate,
    getBiometricTypeName,
    checkBiometricAvailability,
  };
}; 