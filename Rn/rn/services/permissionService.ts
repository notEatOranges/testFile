import { Alert, Linking, Platform } from 'react-native';
import { check, request, RESULTS } from 'react-native-permissions';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  blocked: boolean;
  unavailable: boolean;
}

class PermissionService {
  // 请求通知权限
  async requestNotificationPermission(): Promise<boolean> {
    try {
      console.log('🔐 开始请求通知权限...');
      
      if (Platform.OS === 'android') {
        // Android 13+ (API 33+) 需要请求 POST_NOTIFICATIONS 权限
        if (Platform.Version >= 33) {
          const result = await request('android.permission.POST_NOTIFICATIONS' as any);
          console.log('📱 Android通知权限结果:', result);
          
          switch (result) {
            case RESULTS.GRANTED:
              console.log('✅ 通知权限已授予');
              return true;
            case RESULTS.DENIED:
              console.log('❌ 通知权限被拒绝');
              this.showPermissionDeniedAlert();
              return false;
            case RESULTS.BLOCKED:
              console.log('🚫 通知权限被阻止');
              this.showPermissionBlockedAlert();
              return false;
            case RESULTS.UNAVAILABLE:
              console.log('⚠️ 通知权限不可用');
              return false;
            default:
              console.log('❓ 通知权限未知状态:', result);
              return false;
          }
        } else {
          // Android 13以下版本，通知权限默认授予
          console.log('📱 Android 13以下版本，通知权限默认授予');
          return true;
        }
      } else if (Platform.OS === 'ios') {
        // iOS 通知权限请求
        const result = await request('ios.permission.NOTIFICATIONS' as any);
        console.log('📱 iOS通知权限结果:', result);
        
        switch (result) {
          case RESULTS.GRANTED:
            console.log('✅ iOS通知权限已授予');
            return true;
          case RESULTS.DENIED:
            console.log('❌ iOS通知权限被拒绝');
            this.showPermissionDeniedAlert();
            return false;
          case RESULTS.BLOCKED:
            console.log('🚫 iOS通知权限被阻止');
            this.showPermissionBlockedAlert();
            return false;
          case RESULTS.UNAVAILABLE:
            console.log('⚠️ iOS通知权限不可用');
            return false;
          default:
            console.log('❓ iOS通知权限未知状态:', result);
            return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ 请求通知权限失败:', error);
      return false;
    }
  }

  // 检查通知权限状态
  async checkNotificationPermission(): Promise<PermissionStatus> {
    try {
      console.log('🔍 检查通知权限状态...');
      
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const result = await check('android.permission.POST_NOTIFICATIONS' as any);
          console.log('📱 Android通知权限状态:', result);
          
          return {
            granted: result === RESULTS.GRANTED,
            denied: result === RESULTS.DENIED,
            blocked: result === RESULTS.BLOCKED,
            unavailable: result === RESULTS.UNAVAILABLE,
          };
        } else {
          // Android 13以下版本，通知权限默认授予
          console.log('📱 Android 13以下版本，通知权限默认授予');
          return {
            granted: true,
            denied: false,
            blocked: false,
            unavailable: false,
          };
        }
      } else if (Platform.OS === 'ios') {
        const result = await check('ios.permission.NOTIFICATIONS' as any);
        console.log('📱 iOS通知权限状态:', result);
        
        return {
          granted: result === RESULTS.GRANTED,
          denied: result === RESULTS.DENIED,
          blocked: result === RESULTS.BLOCKED,
          unavailable: result === RESULTS.UNAVAILABLE,
        };
      }
      
      return {
        granted: false,
        denied: false,
        blocked: false,
        unavailable: true,
      };
    } catch (error) {
      console.error('❌ 检查通知权限失败:', error);
      return {
        granted: false,
        denied: false,
        blocked: false,
        unavailable: true,
      };
    }
  }

  // 显示权限被拒绝的提示
  private showPermissionDeniedAlert(): void {
    Alert.alert(
      '通知权限被拒绝',
      '为了及时接收重要消息，建议您开启通知权限。',
      [
        { text: '稍后再说', style: 'cancel' },
        { text: '去设置', onPress: this.openAppSettings }
      ]
    );
  }

  // 显示权限被阻止的提示
  private showPermissionBlockedAlert(): void {
    Alert.alert(
      '通知权限被阻止',
      '通知权限已被系统阻止，请在设置中手动开启。',
      [
        { text: '取消', style: 'cancel' },
        { text: '去设置', onPress: this.openAppSettings }
      ]
    );
  }

  // 打开应用设置页面
  private openAppSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  // 检查并请求通知权限（如果未授予）
  async ensureNotificationPermission(): Promise<boolean> {
    try {
      console.log('🔐 确保通知权限已授予...');
      
      // 先检查当前权限状态
      const status = await this.checkNotificationPermission();
      
      if (status.granted) {
        console.log('✅ 通知权限已授予');
        return true;
      }
      
      if (status.blocked) {
        console.log('🚫 通知权限被阻止，需要用户手动开启');
        this.showPermissionBlockedAlert();
        return false;
      }
      
      if (status.denied) {
        console.log('❌ 通知权限被拒绝，尝试重新请求');
        return await this.requestNotificationPermission();
      }
      
      if (status.unavailable) {
        console.log('⚠️ 通知权限不可用');
        return false;
      }
      
      // 默认尝试请求权限
      return await this.requestNotificationPermission();
    } catch (error) {
      console.error('❌ 确保通知权限失败:', error);
      return false;
    }
  }
}

// 创建单例实例
export const permissionService = new PermissionService(); 