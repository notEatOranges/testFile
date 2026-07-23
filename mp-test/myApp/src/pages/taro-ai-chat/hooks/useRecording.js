import { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import { Toast } from '@nutui/nutui-react-taro';
import { getCurrentConfig, ConfigUtils } from '../config';
import { getAccessToken, getUserId } from '../utils/api';
import { validateRecordingFile, checkRecordingPermission, getRecordingConfig } from '../utils/recording';

export const useRecording = (onVoiceRecognized) => {
  const config = getCurrentConfig();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef(null);
  const recordManagerRef = useRef(null);

  useEffect(() => {
    // 初始化录音管理器
    recordManagerRef.current = Taro.getRecorderManager();

    // 清理函数
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // 开始录音
  const startRecording = async () => {
    try {
      // 检查录音权限
      await checkRecordingPermission();

      setIsRecording(true);
      setRecordingTime(0);

      // 确保录音管理器已初始化
      if (!recordManagerRef.current) {
        recordManagerRef.current = Taro.getRecorderManager();
      }

      // 设置录音事件监听
      recordManagerRef.current.onStart(() => {
        console.log('录音开始事件触发');

        // 开始计时
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      });

      recordManagerRef.current.onError((error) => {
        console.error('录音错误事件触发', error);
        Toast.show('录音失败，请检查麦克风权限');
        stopRecording();
      });

      recordManagerRef.current.onInterruptionBegin(() => {
        console.log('录音被中断事件触发');
        Toast.show('录音被中断');
        stopRecording();
      });

      // 设置录音结束事件监听
      recordManagerRef.current.onStop((res) => {
        console.log('录音结束事件触发，参数:', res);
        handleRecordingStop(res);
      });

      // 开始录音
      const recordConfig = getRecordingConfig();
      console.log('开始录音，配置:', recordConfig);
      recordManagerRef.current.start(recordConfig);
    } catch (error) {
      console.error('开始录音失败:', error);
      Toast.show('开始录音失败，请检查权限');
      setIsRecording(false);
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (!isRecording) return;

    setIsRecording(false);

    // 清理计时器
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // 停止录音
    if (recordManagerRef.current) {
      recordManagerRef.current.stop();
    }
  };

  // 处理录音结束
  const handleRecordingStop = async (res) => {
    console.log('录音结束，完整结果:', res);
    console.log('录音文件路径:', res.tempFilePath);
    console.log('录音时长:', res.duration);
    console.log('录音文件大小:', res.fileSize);
    console.log('录音格式:', res.format);
    console.log('录音错误信息:', res.errMsg);

    try {
      // 验证录音文件
      validateRecordingFile(res);

      console.log('录音文件信息:', {
        tempFilePath: res.tempFilePath,
        duration: res.duration,
        fileSize: res.fileSize,
        format: res.format,
      });

      setIsProcessingVoice(true);

      // 检查文件是否存在和大小
      try {
        const fileSystemManager = Taro.getFileSystemManager();
        const fileInfo = await new Promise((resolve, reject) => {
          fileSystemManager.getFileInfo({
            filePath: res.tempFilePath,
            success: resolve,
            fail: reject,
          });
        });
        console.log('文件信息:', fileInfo);

        // 再次检查文件大小
        const maxFileSize = 15 * 1024 * 1024; // 15MB
        if (fileInfo.size > maxFileSize) {
          throw new Error('录音文件过大，请重新录音（限制15MB）');
        }

        // 检查文件是否可读
        try {
          const fileContent = await new Promise((resolve, reject) => {
            fileSystemManager.readFile({
              filePath: res.tempFilePath,
              success: (res) => resolve(res.data),
              fail: reject,
            });
          });
          console.log('文件内容长度:', fileContent ? fileContent.length : 0);
        } catch (readError) {
          console.warn('读取文件失败:', readError);
        }
      } catch (fileError) {
        console.warn('获取文件信息失败:', fileError);
      }

      // 再次确认文件存在
      try {
        const fileSystemManager = Taro.getFileSystemManager();
        const fileExists = await new Promise((resolve) => {
          fileSystemManager.access({
            path: res.tempFilePath,
            success: () => resolve(true),
            fail: () => resolve(false),
          });
        });

        if (!fileExists) {
          throw new Error('录音文件不存在，请重新录音');
        }

        console.log('文件存在确认:', fileExists);

        // 获取文件的详细信息
        const fileInfo = await new Promise((resolve, reject) => {
          fileSystemManager.getFileInfo({
            filePath: res.tempFilePath,
            success: resolve,
            fail: reject,
          });
        });

        console.log('上传前文件详细信息:', fileInfo);

        // 检查文件大小是否为0
        if (fileInfo.size === 0) {
          throw new Error('录音文件为空，请重新录音');
        }
      } catch (accessError) {
        console.error('检查文件存在失败:', accessError);
        throw new Error('无法访问录音文件，请重新录音');
      }

      // 上传音频文件到服务器进行语音识别
      console.log('准备上传文件:', {
        url: ConfigUtils.getApiUrl(config.api.audioToText),
        filePath: res.tempFilePath,
        fileName: 'file',
        userId: getUserId(),
      });

      const uploadConfig = {
        url: ConfigUtils.getApiUrl(config.api.audioToText),
        filePath: res.tempFilePath,
        name: 'file', // API要求字段名为 'file'
        header: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        formData: {
          user: getUserId(), // 使用动态生成的用户标识
        },
        timeout: 30000,
      };

      console.log('上传配置:', uploadConfig);
      console.log('完整上传URL:', uploadConfig.url);
      console.log('文件路径:', uploadConfig.filePath);
      console.log('表单数据:', uploadConfig.formData);

      // 使用 Promise 包装 Taro.uploadFile 以便更好的错误处理
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadTask = Taro.uploadFile({
          ...uploadConfig,
          success: (res) => {
            console.log('上传成功回调:', res);
            resolve(res);
          },
          fail: (error) => {
            console.error('上传失败回调:', error);
            reject(error);
          },
        });

        console.log('上传任务对象:', uploadTask);
      });

      console.log('上传结果:', uploadResult);
      console.log('上传状态码:', uploadResult.statusCode);
      console.log('上传响应数据:', uploadResult.data);
      console.log('上传错误信息:', uploadResult.errMsg);

      if (uploadResult.statusCode !== 200) {
        console.error('上传失败:', {
          statusCode: uploadResult.statusCode,
          data: uploadResult.data,
          errMsg: uploadResult.errMsg,
        });
        throw new Error(`上传失败: HTTP ${uploadResult.statusCode}`);
      }

      let data;
      try {
        data = JSON.parse(uploadResult.data);
        console.log('解析后的响应数据:', data);
      } catch (parseError) {
        console.error('解析响应失败:', parseError);
        console.log('原始响应:', uploadResult.data);
        throw new Error('服务器响应格式错误');
      }

      if (data.text && data.text.trim()) {
        const recognizedText = data.text.trim();
        console.log('语音识别完成:', recognizedText);
        Toast.show('语音识别完成');

        // 调用回调函数处理识别结果
        if (onVoiceRecognized) {
          onVoiceRecognized(recognizedText);
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else if (data.message) {
        throw new Error(data.message);
      } else {
        throw new Error('语音识别失败，请重新录音');
      }
    } catch (error) {
      console.error('语音识别失败:', error);
      Toast.show(error.message || '语音识别失败，请重试');
    } finally {
      setIsProcessingVoice(false);
      setRecordingTime(0);
    }
  };

  // 语音按钮点击处理
  const handleVoiceToText = async () => {
    if (isRecording) {
      // 如果正在录音，则停止录音
      stopRecording();
    } else {
      // 如果未录音，则开始录音
      await startRecording();
    }
  };

  return {
    isRecording,
    isProcessingVoice,
    recordingTime,
    startRecording,
    stopRecording,
    handleVoiceToText,
  };
};
