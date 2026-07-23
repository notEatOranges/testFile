import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// 登录状态接口
interface LoginState {
  isLoggedIn: boolean;
  loginTime: number;
  expiresAt: number;
  username?: string;
  accessToken?: string;
}

// 指纹登录设置接口
interface FingerprintSettings {
  enabled: boolean;
  username?: string;
  publicKey?: string;
  deviceId?: string;
  deviceModel?: string;
}

// 密钥对接口
interface KeyPair {
  publicKey: string;
  privateKeyAlias: string;
}

// 模拟后端响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface BindFingerprintResponse {
  encryptedRefreshToken: string;
  success: boolean;
}

class AuthService {
  private readonly LOGIN_STATE_KEY = 'login_state';
  private readonly FINGERPRINT_SETTINGS_KEY = 'fingerprint_settings';
  private readonly ENCRYPTED_REFRESH_TOKEN_KEY = 'encrypted_refresh_token';
  private readonly KEY_PAIR_KEY = 'key_pair';
  private readonly LOGIN_DURATION = 2 * 60 * 60 * 1000; // 2小时

  // 检查登录状态
  async checkLoginState(): Promise<LoginState> {
    try {
      const loginStateStr = await SecureStore.getItemAsync(this.LOGIN_STATE_KEY);
      if (!loginStateStr) {
        return { isLoggedIn: false, loginTime: 0, expiresAt: 0 };
      }

      const loginState: LoginState = JSON.parse(loginStateStr);
      const now = Date.now();

      // 检查是否过期
      if (now > loginState.expiresAt) {
        await this.logout();
        return { isLoggedIn: false, loginTime: 0, expiresAt: 0 };
      }

      return loginState;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return { isLoggedIn: false, loginTime: 0, expiresAt: 0 };
    }
  }

  // 登录
  async login(username: string, password: string): Promise<boolean> {
    try {
      // 模拟登录API调用
      const response = await this.mockLoginApi(username, password);
      
      if (response.success && response.data) {
        const now = Date.now();
        const expiresAt = now + this.LOGIN_DURATION;

        const loginState: LoginState = {
          isLoggedIn: true,
          loginTime: now,
          expiresAt,
          username,
          accessToken: response.data.accessToken,
        };

        await SecureStore.setItemAsync(this.LOGIN_STATE_KEY, JSON.stringify(loginState));
        
        // 保存refresh token用于指纹登录
        await SecureStore.setItemAsync(
          this.ENCRYPTED_REFRESH_TOKEN_KEY, 
          response.data.refreshToken
        );
        
        console.log('登录成功:', username);
        return true;
      } else {
        console.error('登录失败:', response.message);
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  }

  // 获取刷新token
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.ENCRYPTED_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('获取刷新token失败:', error);
      return null;
    }
  }

  // 退出登录（只清理token，不清理刷新token）
  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.LOGIN_STATE_KEY);
      // 不清理刷新token，保留用于指纹登录
      console.log('退出登录成功，保留刷新token');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  }

  // 获取指纹登录设置
  async getFingerprintSettings(): Promise<FingerprintSettings> {
    try {
      const settingsStr = await SecureStore.getItemAsync(this.FINGERPRINT_SETTINGS_KEY);
      if (!settingsStr) {
        return { enabled: false };
      }
      return JSON.parse(settingsStr);
    } catch (error) {
      console.error('获取指纹设置失败:', error);
      return { enabled: false };
    }
  }

  // 设置指纹登录
  async setFingerprintSettings(enabled: boolean, username?: string): Promise<boolean> {
    try {
      const settings: FingerprintSettings = { enabled, username };
      await SecureStore.setItemAsync(this.FINGERPRINT_SETTINGS_KEY, JSON.stringify(settings));
      console.log('指纹设置更新成功:', settings);
      return true;
    } catch (error) {
      console.error('设置指纹登录失败:', error);
      return false;
    }
  }

  // 检查设备是否支持指纹认证
  async isFingerprintAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('检查指纹可用性失败:', error);
      return false;
    }
  }

  // 指纹认证（只允许指纹，不允许密码）
  async authenticateWithFingerprint(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '请使用指纹验证身份',
        fallbackLabel: '使用密码',
        cancelLabel: '取消',
        disableDeviceFallback: true, // 禁用设备密码回退
      });

      return result.success;
    } catch (error) {
      console.error('指纹认证失败:', error);
      return false;
    }
  }

  // 首次开启指纹登录时的指纹校验
  async verifyFingerprintForSetup(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '请使用指纹验证身份以开启指纹登录',
        fallbackLabel: '使用密码',
        cancelLabel: '取消',
        disableDeviceFallback: true, // 禁用设备密码回退
      });

      return result.success;
    } catch (error) {
      console.error('指纹校验失败:', error);
      return false;
    }
  }

  // 生成RSA密钥对
  async generateKeyPair(): Promise<KeyPair> {
    try {
      // 模拟生成RSA密钥对（实际项目中需要使用原生模块）
      const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdefghijklmnopqrstuvwxyz
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890
-----END PUBLIC KEY-----`;
      
      const privateKeyAlias = `fingerprint_key_${Date.now()}`;
      
      const keyPair: KeyPair = {
        publicKey,
        privateKeyAlias,
      };
      
      // 保存密钥对信息
      await SecureStore.setItemAsync(this.KEY_PAIR_KEY, JSON.stringify(keyPair));
      
      return keyPair;
    } catch (error) {
      console.error('生成密钥对失败:', error);
      throw error;
    }
  }

  // 获取设备信息
  async getDeviceInfo(): Promise<{ deviceId: string; deviceModel: string }> {
    // 模拟获取设备信息
    return {
      deviceId: `device_${Date.now()}`,
      deviceModel: 'iPhone 15 Pro',
    };
  }

  // 关闭指纹登录（清理所有相关数据，包括refresh token）
  async disableFingerprintLogin(): Promise<boolean> {
    try {
      // 1. 清理密钥对信息
      await SecureStore.deleteItemAsync(this.KEY_PAIR_KEY);
      
      // 2. 清理指纹设置
      await SecureStore.deleteItemAsync(this.FINGERPRINT_SETTINGS_KEY);
      
      // 3. 清理加密的refresh token
      await SecureStore.deleteItemAsync(this.ENCRYPTED_REFRESH_TOKEN_KEY);
      
      console.log('指纹登录已关闭，所有相关数据已清理');
      return true;
    } catch (error) {
      console.error('关闭指纹登录失败:', error);
      return false;
    }
  }

  // 绑定指纹登录（不包含指纹校验，因为调用前已经校验过了）
  async bindFingerprintLogin(username: string): Promise<boolean> {
    try {
      // 1. 生成密钥对
      const keyPair = await this.generateKeyPair();
      
      // 2. 获取设备信息
      const deviceInfo = await this.getDeviceInfo();
      
      // 3. 调用后端绑定接口，后端生成新的refresh token
      const response = await this.mockBindFingerprintApi(
        username,
        keyPair.publicKey,
        deviceInfo.deviceId,
        deviceInfo.deviceModel
      );
      
      if (response.success && response.data) {
        // 4. 保存后端返回的新加密refresh token
        await SecureStore.setItemAsync(
          this.ENCRYPTED_REFRESH_TOKEN_KEY,
          response.data.encryptedRefreshToken
        );
        
        // 5. 更新指纹设置
        const settings: FingerprintSettings = {
          enabled: true,
          username,
          publicKey: keyPair.publicKey,
          deviceId: deviceInfo.deviceId,
          deviceModel: deviceInfo.deviceModel,
        };
        
        await SecureStore.setItemAsync(this.FINGERPRINT_SETTINGS_KEY, JSON.stringify(settings));
        
        console.log('指纹登录绑定成功，已生成新的refresh token');
        return true;
      } else {
        console.error('指纹登录绑定失败:', response.message);
        return false;
      }
    } catch (error) {
      console.error('绑定指纹登录失败:', error);
      return false;
    }
  }

  // 指纹登录
  async fingerprintLogin(): Promise<boolean> {
    try {
      // 1. 指纹认证
      const isAuthenticated = await this.authenticateWithFingerprint();
      if (!isAuthenticated) {
        return false;
      }
      
      // 2. 获取加密的refresh token
      const encryptedRefreshToken = await SecureStore.getItemAsync(this.ENCRYPTED_REFRESH_TOKEN_KEY);
      if (!encryptedRefreshToken) {
        throw new Error('未找到加密的refresh token');
      }
      
      // 3. 获取密钥对信息
      const keyPairStr = await SecureStore.getItemAsync(this.KEY_PAIR_KEY);
      if (!keyPairStr) {
        throw new Error('未找到密钥对信息');
      }
      
      const keyPair: KeyPair = JSON.parse(keyPairStr);
      
      // 4. 模拟解密refresh token（实际项目中需要使用私钥解密）
      const refreshToken = this.mockDecryptRefreshToken(encryptedRefreshToken, keyPair.privateKeyAlias);
      
      // 5. 生成签名
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await this.generateSignature(refreshToken, timestamp, keyPair.privateKeyAlias);
      
      // 6. 调用后端获取access token
      const response = await this.mockGetAccessTokenApi(refreshToken, timestamp, signature);
      
      if (response.success && response.data) {
        // 7. 更新登录状态
        const now = Date.now();
        const expiresAt = now + this.LOGIN_DURATION;
        
        const settings = await this.getFingerprintSettings();
        const loginState: LoginState = {
          isLoggedIn: true,
          loginTime: now,
          expiresAt,
          username: settings.username,
          accessToken: response.data.accessToken,
        };
        
        await SecureStore.setItemAsync(this.LOGIN_STATE_KEY, JSON.stringify(loginState));
        
        console.log('指纹登录成功');
        return true;
      } else {
        console.error('指纹登录失败:', response.message);
        return false;
      }
    } catch (error) {
      console.error('指纹登录失败:', error);
      return false;
    }
  }

  // 生成签名
  async generateSignature(refreshToken: string, timestamp: number, privateKeyAlias: string): Promise<string> {
    try {
      // 模拟签名生成（实际项目中需要使用私钥签名）
      const signContent = `refresh_token=${refreshToken}&timestamp=${timestamp}`;
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        signContent + privateKeyAlias
      );
      return signature;
    } catch (error) {
      console.error('生成签名失败:', error);
      throw error;
    }
  }

  // 模拟登录API
  private async mockLoginApi(username: string, password: string): Promise<ApiResponse<TokenResponse>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟任何用户名密码都可以登录
    return {
      success: true,
      data: {
        accessToken: `access_token_${Date.now()}`,
        refreshToken: `refresh_token_${Date.now()}`,
        expiresIn: 7200,
      },
    };
  }

  // 模拟绑定指纹API
  private async mockBindFingerprintApi(
    username: string,
    publicKey: string,
    deviceId: string,
    deviceModel: string
  ): Promise<ApiResponse<BindFingerprintResponse>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟后端生成新的refresh token（每次绑定都生成新的）
    const newRefreshToken = `new_refresh_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const encryptedRefreshToken = `encrypted_${newRefreshToken}_${Date.now()}`;
    
    console.log('后端生成新的refresh token:', newRefreshToken);
    
    return {
      success: true,
      data: {
        encryptedRefreshToken,
        success: true,
      },
    };
  }

  // 模拟获取access token API
  private async mockGetAccessTokenApi(
    refreshToken: string,
    timestamp: number,
    signature: string
  ): Promise<ApiResponse<TokenResponse>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟验证签名和时间戳
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - timestamp > 300) {
      return {
        success: false,
        message: '请求已过期',
      };
    }
    
    return {
      success: true,
      data: {
        accessToken: `access_token_${Date.now()}`,
        refreshToken: `refresh_token_${Date.now()}`,
        expiresIn: 7200,
      },
    };
  }

  // 模拟解密refresh token
  private mockDecryptRefreshToken(encryptedRefreshToken: string, privateKeyAlias: string): string {
    // 模拟解密过程
    return encryptedRefreshToken.replace('encrypted_', '').split('_')[0];
  }
}

export const authService = new AuthService();
export type { FingerprintSettings, KeyPair, LoginState, TokenResponse };

