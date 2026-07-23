import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import Getui from 'react-native-getui';
import { getPushConfig } from '../config/pushConfig';

export interface PushMessage {
  title: string;
  content: string;
  payload?: any;
  messageId?: string;
}

export interface PushToken {
  token: string;
  platform: 'android' | 'ios';
}

class PushService {
  private isInitialized = false;
  private clientId: string | null = null;
  private eventEmitter: NativeEventEmitter | null = null;
  private eventListeners: { remove: () => void }[] = [];
  private initializationPromise: Promise<boolean> | null = null;

  // 初始化个推
  async initialize(): Promise<boolean> {
    // 如果已经在初始化中，返回现有的Promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // 如果已经初始化，直接返回
    if (this.isInitialized) {
      console.log('✅ 个推已初始化');
      return true;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<boolean> {
    try {
      console.log('🔄 开始初始化个推SDK...');
      
      // 获取配置
      const config = getPushConfig();
      console.log('📋 个推配置:', {
        appId: config.appId,
        appKey: config.appKey,
        // 不打印appSecret以保护安全
      });

        // 初始化个推（Android）
  if (Platform.OS === 'android') {
    console.log('🤖 Android平台初始化...');
    try {
      // 使用原生模块注册意图服务
      const GetuiModule = NativeModules.GetuiModule;
      if (GetuiModule) {
        await new Promise<void>((resolve, reject) => {
          GetuiModule.initPush((success: boolean) => {
            if (success) {
              console.log('✅ Android个推意图服务注册完成');
              resolve();
            } else {
              reject(new Error('个推意图服务注册失败'));
            }
          });
        });
      }
      
      // 使用react-native-getui库初始化
      Getui.initPush();
      console.log('✅ Android个推SDK初始化完成');
    } catch (error) {
      console.error('❌ Android个推SDK初始化失败:', error);
      // 回退到原来的方法
      Getui.initPush();
      console.log('✅ Android个推SDK初始化完成（回退方法）');
    }
  }

      // 设置消息监听器
      this.setupMessageListeners();

      // 延迟获取CID，确保SDK完全启动
      setTimeout(async () => {
        console.log('🔄 开始获取CID...');
        console.log('💡 请确保设备有网络连接');
        await this.getClientId();
      }, 3000); // 减少到3秒

      this.isInitialized = true;
      console.log('✅ 个推初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 个推初始化失败:', error);
      this.initializationPromise = null;
      return false;
    }
  }

  // 设置消息监听器
  private setupMessageListeners(): void {
    try {
      console.log('🔧 设置个推消息监听器...');
      
      // 创建原生事件发射器
      if (Platform.OS === 'android') {
        this.eventEmitter = new NativeEventEmitter(NativeModules.GetuiModule);
        
        // 监听个推消息事件
        const listener = this.eventEmitter.addListener('GetuiMessage', (event) => {
          try {
            console.log('🔔 收到原生事件:', event);
            const { type, data, timestamp } = JSON.parse(event);
            console.log(`📨 收到个推消息 [${type}]:`, data);
            
            switch (type) {
              case 'payload':
                this.handlePayloadMessage(JSON.parse(data));
                break;
              case 'notification':
                this.handleNotificationMessage(JSON.parse(data));
                break;
              case 'notificationClick':
                this.handleNotificationClick(JSON.parse(data));
                break;
              case 'cid':
                this.clientId = data;
                console.log('🆔 CID更新:', data);
                break;
              case 'connectionStatus':
                console.log('🔗 连接状态:', data);
                break;
              default:
                console.log('❓ 未知消息类型:', type);
            }
          } catch (error) {
            console.error('❌ 处理个推消息失败:', error);
            console.error('❌ 原始事件数据:', event);
          }
        });
        
        this.eventListeners.push(listener);
        console.log('✅ 原生消息监听器设置完成');
      }
      
    } catch (error) {
      console.error('❌ 设置消息监听器失败:', error);
    }
  }

  // 获取CID
  getClientId(): Promise<string | null> {
    return new Promise((resolve) => {
      // 添加重试机制
      let retryCount = 0;
      const maxRetries = 8; // 增加重试次数
      
      const tryGetClientId = () => {
        console.log(`🔄 第${retryCount + 1}次尝试获取CID...`);
        
        try {
          // 优先使用原生模块
          const GetuiModule = NativeModules.GetuiModule;
          if (GetuiModule) {
            GetuiModule.getClientId((clientId: string | null) => {
              console.log(`📱 原生模块返回CID: "${clientId}"`);
              
              if (clientId && clientId.trim() && clientId !== 'null' && clientId !== 'undefined') {
                this.clientId = clientId;
                console.log('✅ 成功获取CID:', clientId);
                resolve(clientId);
              } else {
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`⚠️ CID为空或无效，第${retryCount}次重试...`);
                  // 增加重试间隔时间，使用指数退避
                  const delay = Math.min(2000 + retryCount * 1000, 8000); // 2秒到8秒
                  setTimeout(tryGetClientId, delay);
                } else {
                  console.log('❌ 获取CID失败，已达到最大重试次数');
                  console.log('💡 建议检查网络连接和个推配置');
                  resolve(null);
                }
              }
            });
          } else {
            // 回退到原来的方法
            Getui.clientId((clientId: string) => {
              console.log(`📱 个推回调返回CID: "${clientId}"`);
              
              if (clientId && clientId.trim() && clientId !== 'null' && clientId !== 'undefined') {
                this.clientId = clientId;
                console.log('✅ 成功获取CID:', clientId);
                resolve(clientId);
              } else {
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`⚠️ CID为空或无效，第${retryCount}次重试...`);
                  // 增加重试间隔时间，使用指数退避
                  const delay = Math.min(2000 + retryCount * 1000, 8000); // 2秒到8秒
                  setTimeout(tryGetClientId, delay);
                } else {
                  console.log('❌ 获取CID失败，已达到最大重试次数');
                  console.log('💡 建议检查网络连接和个推配置');
                  resolve(null);
                }
              }
            });
          }
        } catch (error) {
          console.error('❌ 获取CID异常:', error);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`⚠️ 获取CID异常，第${retryCount}次重试...`);
            const delay = Math.min(2000 + retryCount * 1000, 8000);
            setTimeout(tryGetClientId, delay);
          } else {
            console.log('❌ 获取CID失败，已达到最大重试次数');
            resolve(null);
          }
        }
      };
      
      tryGetClientId();
    });
  }

  // 强制刷新CID
  async forceRefreshClientId(): Promise<string | null> {
    console.log('🔄 强制刷新CID...');
    this.clientId = null; // 清除缓存的CID
    return this.getClientId();
  }

  // 绑定别名
  bindAlias(alias: string, sn?: string): void {
    try {
      Getui.bindAlias(alias, sn);
      console.log('绑定别名:', alias);
    } catch (error) {
      console.error('绑定别名失败:', error);
    }
  }

  // 解绑别名
  unbindAlias(alias: string, sn?: string): void {
    try {
      Getui.unbindAlias(alias, sn);
      console.log('解绑别名:', alias);
    } catch (error) {
      console.error('解绑别名失败:', error);
    }
  }

  // 设置标签
  setTags(tags: string[]): boolean {
    try {
      const result = Getui.setTag(tags);
      console.log('设置标签:', tags, '结果:', result);
      return result;
    } catch (error) {
      console.error('设置标签失败:', error);
      return false;
    }
  }

  // 开启推送
  turnOnPush(): void {
    try {
      Getui.turnOnPush();
      console.log('开启推送服务');
    } catch (error) {
      console.error('开启推送失败:', error);
    }
  }

  // 关闭推送
  turnOffPush(): void {
    try {
      Getui.turnOffPush();
      console.log('关闭推送服务');
    } catch (error) {
      console.error('关闭推送失败:', error);
    }
  }

  // 设置推送模式
  setPushModeForOff(isOff: boolean): void {
    try {
      Getui.setPushModeForOff(isOff);
      console.log('设置推送模式:', isOff ? '关闭' : '开启');
    } catch (error) {
      console.error('设置推送模式失败:', error);
    }
  }

  // 设置角标
  setBadge(value: number): void {
    try {
      Getui.setBadge(value);
      console.log('设置角标:', value);
    } catch (error) {
      console.error('设置角标失败:', error);
    }
  }

  // 重置角标
  resetBadge(): void {
    try {
      Getui.resetBadge();
      console.log('重置角标');
    } catch (error) {
      console.error('重置角标失败:', error);
    }
  }

  // 发送消息
  sendMessage(body: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const msgId = Getui.sendMessage(body, (success: boolean) => {
          console.log('发送消息结果:', success);
          resolve(success);
        });
        console.log('发送消息ID:', msgId);
      } catch (error) {
        console.error('发送消息失败:', error);
        resolve(false);
      }
    });
  }

  // 获取SDK状态
  getStatus(): Promise<string> {
    return new Promise((resolve) => {
      Getui.status((status: string) => {
        console.log('SDK状态:', status);
        resolve(status);
      });
    });
  }

  // 获取SDK版本
  getVersion(): Promise<string> {
    return new Promise((resolve) => {
      Getui.version((version: string) => {
        console.log('SDK版本:', version);
        resolve(version);
      });
    });
  }

  // 设置后台运行
  setRunBackgroundEnable(isEnable: boolean): void {
    try {
      Getui.runBackgroundEnable(isEnable);
      console.log('设置后台运行:', isEnable);
    } catch (error) {
      console.error('设置后台运行失败:', error);
    }
  }

  // 设置地理围栏
  setLbsLocationEnable(isEnable: boolean, isVerify: boolean): void {
    try {
      Getui.lbsLocationEnable(isEnable, isVerify);
      console.log('设置地理围栏:', isEnable, isVerify);
    } catch (error) {
      console.error('设置地理围栏失败:', error);
    }
  }

  // 设置渠道ID
  setChannelId(channelId: string): void {
    try {
      Getui.setChannelId(channelId);
      console.log('设置渠道ID:', channelId);
    } catch (error) {
      console.error('设置渠道ID失败:', error);
    }
  }

  // 注册设备Token
  registerDeviceToken(deviceToken: string): void {
    try {
      Getui.registerDeviceToken(deviceToken);
      console.log('注册设备Token:', deviceToken);
    } catch (error) {
      console.error('注册设备Token失败:', error);
    }
  }

  // 清除所有通知
  clearAllNotifications(): void {
    try {
      Getui.clearAllNotificationForNotificationBar();
      console.log('清除所有通知');
    } catch (error) {
      console.error('清除通知失败:', error);
    }
  }

  // 销毁推送服务
  destroy(): void {
    try {
      // 移除所有事件监听器
      this.eventListeners.forEach(listener => {
        try {
          listener.remove();
        } catch (error) {
          console.error('移除事件监听器失败:', error);
        }
      });
      this.eventListeners = [];
      
      // 销毁个推SDK
      Getui.destroy();
      
      this.isInitialized = false;
      this.clientId = null;
      this.eventEmitter = null;
      
      console.log('✅ 推送服务已销毁');
    } catch (error) {
      console.error('❌ 销毁推送服务失败:', error);
    }
  }

  // 恢复SDK
  resume(): void {
    try {
      Getui.resume();
      console.log('个推SDK已恢复');
    } catch (error) {
      console.error('恢复SDK失败:', error);
    }
  }

  // 发送反馈消息
  sendFeedbackMessage(actionId: number, taskId: string, msgId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        Getui.sendFeedbackMessage(actionId, taskId, msgId, (success: boolean) => {
          console.log('发送反馈消息结果:', success);
          resolve(success);
        });
      } catch (error) {
        console.error('发送反馈消息失败:', error);
        resolve(false);
      }
    });
  }

  // 处理透传消息
  private handlePayloadMessage(payload: any): void {
    try {
      const message: PushMessage = {
        title: payload.title || '透传消息',
        content: payload.content || payload.message || '',
        payload: payload.payload,
        messageId: payload.messageId,
      };

      console.log('处理透传消息:', message);
      
      // 这里可以添加自定义的消息处理逻辑
      // 比如显示本地通知、更新UI等
      this.showLocalNotification(message);
    } catch (error) {
      console.error('处理透传消息失败:', error);
    }
  }

  // 处理通知消息
  private handleNotificationMessage(notification: any): void {
    try {
      const message: PushMessage = {
        title: notification.title || '通知消息',
        content: notification.content || notification.message || '',
        payload: notification.payload,
        messageId: notification.messageId,
      };

      console.log('处理通知消息:', message);
      
      // 这里可以添加自定义的通知处理逻辑
    } catch (error) {
      console.error('处理通知消息失败:', error);
    }
  }

  // 处理通知点击
  private handleNotificationClick(notification: any): void {
    try {
      console.log('用户点击了通知:', notification);
      
      // 这里可以添加点击通知后的处理逻辑
      // 比如跳转到特定页面、执行特定操作等
      
      if (notification.payload) {
        // 根据payload内容执行相应操作
        this.handleNotificationPayload(notification.payload);
      }
    } catch (error) {
      console.error('处理通知点击失败:', error);
    }
  }

  // 处理注册成功
  private handleRegisterSuccess(clientId: string): void {
    console.log('个推注册成功，CID:', clientId);
    
    // 这里可以将CID发送到您的后端服务器
    this.sendCidToServer(clientId);
  }

  // 发送CID到服务器
  private async sendCidToServer(clientId: string): Promise<void> {
    try {
      // 这里实现将CID发送到您的后端服务器的逻辑
      console.log('发送CID到服务器:', clientId);
      
      // 示例：调用API将CID保存到用户账户
      // await apiService.updateUserPushToken({
      //   cid: clientId,
      //   platform: Platform.OS,
      //   userId: currentUserId
      // });
    } catch (error) {
      console.error('发送CID到服务器失败:', error);
    }
  }

  // 处理通知payload
  private handleNotificationPayload(payload: any): void {
    try {
      console.log('处理通知payload:', payload);
      
      // 根据payload类型执行不同操作
      if (payload.type === 'navigate') {
        // 导航到特定页面
        this.navigateToPage(payload.page, payload.params);
      } else if (payload.type === 'action') {
        // 执行特定操作
        this.executeAction(payload.action, payload.params);
      }
    } catch (error) {
      console.error('处理通知payload失败:', error);
    }
  }

  // 导航到页面
  private navigateToPage(page: string, params?: any): void {
    console.log('导航到页面:', page, params);
    // 这里实现页面导航逻辑
    // 可以使用React Navigation或其他导航库
  }

  // 执行操作
  private executeAction(action: string, params?: any): void {
    console.log('执行操作:', action, params);
    // 这里实现具体的操作逻辑
  }

  // 显示本地通知
  private showLocalNotification(message: PushMessage): void {
    // 这里可以实现显示本地通知的逻辑
    console.log('显示本地通知:', message);
  }

  // 检查是否已初始化
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // 获取当前CID
  getCurrentClientId(): string | null {
    return this.clientId;
  }

  // 检查网络连接
  async checkNetworkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.getui.com', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('✅ 网络连接正常');
      return true;
    } catch (error) {
      console.log('❌ 网络连接异常:', error);
      return false;
    }
  }

  // 获取CID（带网络检查）
  async getClientIdWithNetworkCheck(): Promise<string | null> {
    // 先检查网络连接
    const hasNetwork = await this.checkNetworkConnection();
    if (!hasNetwork) {
      console.log('⚠️ 网络连接异常，CID获取可能失败');
    }
    
    return this.getClientId();
  }
}

export const pushService = new PushService(); 