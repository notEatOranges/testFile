import { Platform } from 'react-native';

export interface DeviceInfo {
  carrierId?: string;
  carrierName?: string;
  deviceId?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface CarrierInfo {
  carrierId: string;
  carrierName: string;
  mcc: string;
  mnc: string;
}

class DeviceService {
  // 获取设备信息
  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      const deviceInfo: DeviceInfo = {
        deviceModel: await this.getDeviceModel(),
        osVersion: await this.getOSVersion(),
        appVersion: await this.getAppVersion(),
      };

      // 只在Android上获取运营商信息
      if (Platform.OS === 'android') {
        const carrierInfo = await this.getCarrierInfo();
        if (carrierInfo) {
          deviceInfo.carrierId = carrierInfo.carrierId;
          deviceInfo.carrierName = carrierInfo.carrierName;
        }
      }

      return deviceInfo;
    } catch (error) {
      console.error('获取设备信息失败:', error);
      return {};
    }
  }

  // 获取运营商信息 (Android)
  async getCarrierInfo(): Promise<CarrierInfo | null> {
    try {
      // 这里需要调用原生模块
      // 由于我们使用的是Expo，需要创建原生模块
      console.log('获取运营商信息需要原生模块支持');
      return null;
    } catch (error) {
      console.error('获取运营商信息失败:', error);
      return null;
    }
  }

  // 获取设备型号
  async getDeviceModel(): Promise<string> {
    try {
      // 这里可以集成 expo-device 来获取设备信息
      return Platform.OS === 'ios' ? 'iPhone' : 'Android Device';
    } catch (error) {
      console.error('获取设备型号失败:', error);
      return 'Unknown Device';
    }
  }

  // 获取操作系统版本
  async getOSVersion(): Promise<string> {
    try {
      return Platform.Version.toString();
    } catch (error) {
      console.error('获取OS版本失败:', error);
      return 'Unknown';
    }
  }

  // 获取应用版本
  async getAppVersion(): Promise<string> {
    try {
      // 这里可以集成 expo-constants 来获取应用版本
      return '1.0.0';
    } catch (error) {
      console.error('获取应用版本失败:', error);
      return 'Unknown';
    }
  }

  // 获取设备ID (用于个推)
  async getDeviceId(): Promise<string> {
    try {
      // 这里可以生成一个唯一的设备ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      return `device_${timestamp}_${random}`;
    } catch (error) {
      console.error('获取设备ID失败:', error);
      return 'unknown_device';
    }
  }

  // 检查是否有SIM卡
  async hasSimCard(): Promise<boolean> {
    try {
      // 这里需要原生模块支持
      console.log('检查SIM卡状态需要原生模块支持');
      return true; // 默认返回true
    } catch (error) {
      console.error('检查SIM卡状态失败:', error);
      return false;
    }
  }

  // 获取网络类型
  async getNetworkType(): Promise<string> {
    try {
      // 这里可以集成 expo-network 来获取网络信息
      return 'WiFi'; // 默认返回WiFi
    } catch (error) {
      console.error('获取网络类型失败:', error);
      return 'Unknown';
    }
  }
}

export const deviceService = new DeviceService(); 