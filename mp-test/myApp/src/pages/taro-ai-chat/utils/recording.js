import Taro from '@tarojs/taro';
import { RECORDING_CONSTANTS } from './constants';

// 验证录音文件
export const validateRecordingFile = (res) => {
  if (!res.tempFilePath) {
    throw new Error('录音文件生成失败');
  }

  // 检查录音时长
  if (res.duration < RECORDING_CONSTANTS.MIN_DURATION) {
    throw new Error('录音时间太短，请重新录音');
  }

  // 检查文件大小
  if (res.fileSize && res.fileSize > RECORDING_CONSTANTS.MAX_FILE_SIZE) {
    throw new Error('录音文件过大，请重新录音（限制15MB）');
  }

  // 检查文件格式
  const fileFormat = res.format || 'mp3';
  if (!RECORDING_CONSTANTS.SUPPORTED_FORMATS.includes(fileFormat.toLowerCase())) {
    throw new Error(`不支持的音频格式: ${fileFormat}`);
  }

  return true;
};

// 检查录音权限
export const checkRecordingPermission = async () => {
  try {
    const authResult = await Taro.getSetting();
    console.log('当前权限设置:', authResult);

    if (!authResult.authSetting['scope.record']) {
      console.log('请求录音权限...');
      await Taro.authorize({
        scope: 'scope.record',
      });
      console.log('录音权限已授权');
    }

    return true;
  } catch (error) {
    console.error('录音权限检查失败:', error);
    throw new Error('录音权限获取失败');
  }
};

// 测试录音功能
export const testRecording = async () => {
  try {
    console.log('开始测试录音功能...');

    // 检查录音权限
    await checkRecordingPermission();

    // 测试录音管理器
    const recordManager = Taro.getRecorderManager();
    console.log('录音管理器:', recordManager);

    // 测试文件系统管理器
    const fileSystemManager = Taro.getFileSystemManager();
    console.log('文件系统管理器:', fileSystemManager);

    return { success: true, message: '录音功能测试完成' };
  } catch (error) {
    console.error('录音功能测试失败:', error);
    return { success: false, error: error.message };
  }
};

// 获取录音配置
export const getRecordingConfig = () => {
  return {
    duration: RECORDING_CONSTANTS.MAX_DURATION,
    ...RECORDING_CONSTANTS.DEFAULT_CONFIG,
  };
};
