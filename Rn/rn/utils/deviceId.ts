import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * 获取设备ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    // 使用设备信息生成唯一ID
    const deviceName = Device.deviceName || 'Unknown';
    const osVersion = Device.osVersion || 'Unknown';
    const deviceType = Device.deviceType || 'Unknown';
    
    // 生成基于设备信息的ID
    const deviceInfo = `${deviceName}_${osVersion}_${deviceType}_${Platform.OS}`;
    const hash = await generateHash(deviceInfo);
    
    return `device_${hash}`;
  } catch (error) {
    console.error('获取设备ID失败:', error);
    // 返回基于时间戳的备用ID
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 生成简单的哈希值
 */
async function generateHash(input: string): Promise<string> {
  try {
    // 简单的哈希算法
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error('生成哈希失败:', error);
    return Date.now().toString(36);
  }
} 