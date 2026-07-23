import { NativeEventEmitter, Platform } from 'react-native';
import Getui from 'react-native-getui';
import { getPushConfig } from '../config/pushConfig';
import { navigationService } from './navigationService';
import { permissionService } from './permissionService';

export interface PushMessage {
  title: string;
  content: string;
  payload?: any;
  messageId?: string;
  taskId?: string;
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

  // 初始化推送服务
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

    this.initializationPromise = this._initialize().then(() => {
      this.isInitialized = true;
      return true;
    }).catch(() => {
      this.initializationPromise = null;
      return false;
    });
    
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('🚀 开始初始化推送服务...');

      // 检查网络连接
      const isNetworkConnected = await this.checkNetworkConnection();
      if (!isNetworkConnected) {
        console.log('❌ 网络连接失败，推送服务初始化终止');
        return;
      }

      // 请求通知权限
      const hasPermission = await permissionService.ensureNotificationPermission();
      if (!hasPermission) {
        console.log('⚠️ 通知权限未授予，但继续初始化推送服务');
      } else {
        console.log('✅ 通知权限已授予');
      }

      // 初始化个推SDK
      const config = getPushConfig();
      console.log('📱 个推配置:', config);

      try {
        await Getui.initPush();
        console.log('✅ 个推SDK初始化成功');
      } catch (error) {
        console.error('❌ 个推SDK初始化失败:', error);
        return;
      }

      // 设置消息监听器
      this.setupMessageListeners();

      // 获取CID
      this.getClientId();

      console.log('✅ 推送服务初始化完成');
    } catch (error) {
      console.error('❌ 推送服务初始化失败:', error);
    }
  }

  // 设置消息监听器
  private setupMessageListeners(): void {
    try {
      console.log('🔧 设置个推消息监听器...');
      
      // 使用react-native-getui的事件监听
      if (Platform.OS === 'android') {
        // 监听个推消息事件
        const { NativeAppEventEmitter } = require('react-native');
        
        console.log('📡 开始监听个推事件...');
        
        // 监听透传消息
        const receiveRemoteNotificationSub = NativeAppEventEmitter.addListener(
          'receiveRemoteNotification',
          (notification: any) => {
            try {
              console.log('🔔 [EVENT] 收到个推透传消息事件');
              console.log('📨 原始消息数据:', JSON.stringify(notification, null, 2));
              
              switch (notification.type) {
                case 'payload':
                  console.log('📦 处理透传消息类型: payload', notification);
                  this.handlePayloadMessage(notification);
                  break;
                case 'apns':
                  console.log('📦 处理通知消息类型: apns');
                  this.handleNotificationMessage(notification);
                  break;
                default:
                  console.log('❓ 未知消息类型:', notification.type);
                  console.log('📨 完整消息内容:', notification);
              }
            } catch (error: any) {
              console.error('❌ 处理个推消息失败:', error);
              console.error('❌ 错误详情:', error.message);
              console.error('❌ 错误堆栈:', error.stack);
            }
          }
        );
        
        // 监听通知点击
        const clickRemoteNotificationSub = NativeAppEventEmitter.addListener(
          'clickRemoteNotification',
          (notification: any) => {
            try {
              console.log('🔔 [EVENT] 点击通知事件');
              console.log('📨 点击通知数据:', JSON.stringify(notification, null, 2));
              this.handleNotificationClick(notification);
            } catch (error: any) {
              console.error('❌ 处理通知点击失败:', error);
              console.error('❌ 错误详情:', error.message);
            }
          }
        );
        
        // 监听个推状态变化
        const getuiStatusSub = NativeAppEventEmitter.addListener(
          'GeTuiSdkDidReceivePayload',
          (payload: any) => {
            console.log('🔔 [EVENT] 个推SDK收到payload');
            console.log('📨 Payload数据:', JSON.stringify(payload, null, 2));
            this.handlePayloadMessage(payload);
          }
        );
        
        // 监听个推注册成功
        const getuiRegisterSub = NativeAppEventEmitter.addListener(
          'GeTuiSdkDidRegisterClient',
          (clientId: string) => {
            console.log('🔔 [EVENT] 个推SDK注册成功');
            console.log('🆔 注册的CID:', clientId);
            this.handleRegisterSuccess(clientId);
          }
        );
        
        // 监听个推通知到达
        const getuiNotificationArrivedSub = NativeAppEventEmitter.addListener(
          'GeTuiSdkDidReceiveNotification',
          (notification: any) => {
            console.log('🔔 [EVENT] 个推通知到达');
            console.log('📨 通知数据:', JSON.stringify(notification, null, 2));
            this.handleNotificationMessage(notification);
          }
        );
        
        // 监听个推通知点击
        const getuiNotificationClickedSub = NativeAppEventEmitter.addListener(
          'GeTuiSdkDidClickNotification',
          (notification: any) => {
            console.log('🔔 [EVENT] 个推通知被点击');
            console.log('📨 点击通知数据:', JSON.stringify(notification, null, 2));
            this.handleNotificationClick(notification);
          }
        );
        
        this.eventListeners.push(
          receiveRemoteNotificationSub, 
          clickRemoteNotificationSub,
          getuiStatusSub,
          getuiRegisterSub,
          getuiNotificationArrivedSub,
          getuiNotificationClickedSub
        );
        console.log('✅ 个推消息监听器设置完成，共监听6个事件');
      }
      
    } catch (error) {
      console.error('❌ 设置消息监听器失败:', error);
    }
  }

  // 处理透传消息
  private handlePayloadMessage(payload: any): void {
    try {
      console.log('📦 [HANDLER] 处理透传消息');
      console.log('📨 Payload内容:', JSON.stringify(payload, null, 2));
      
      // 解析payload中的页面跳转信息
      if (payload.payload) {
        let payloadData = payload.payload;
        if (typeof payloadData === 'string') {
          try {
            payloadData = JSON.parse(payloadData);
          } catch (e) {
            console.warn('解析payload失败:', e);
            return;
          }
        }
        
        // 检查是否有页面跳转信息
        if (payloadData.page) {
          console.log('🎯 检测到页面跳转指令:', payloadData.page);
          this.navigateToPage(payloadData.page, payloadData);
        }
      }
    } catch (error) {
      console.error('❌ 处理透传消息失败:', error);
    }
  }

  // 处理通知消息
  private handleNotificationMessage(notification: any): void {
    try {
      console.log('📨 [HANDLER] 处理通知消息');
      console.log('📨 通知数据:', JSON.stringify(notification, null, 2));
      
      // 保存消息到本地存储
      this.savePushMessageToLocal(notification);
      
      // 如果有payload，处理payload内容
      if (notification.payload) {
        this.handleNotificationPayload(notification.payload);
      }
    } catch (error) {
      console.error('❌ 处理通知消息失败:', error);
    }
  }

  // 处理通知点击
  private handleNotificationClick(notification: any): void {
    try {
      console.log('👆 [HANDLER] 开始处理通知点击');
      console.log('📨 点击通知数据:', JSON.stringify(notification, null, 2));
      
      // 保存推送消息到本地存储（用于消息中心显示）
      this.savePushMessageToLocal(notification);
      
      // 解析payload中的页面跳转信息
      let targetPage = null;
      let pageParams = {};
      
      if (notification.payload) {
        try {
          // 尝试解析payload
          let payload = notification.payload;
          if (typeof payload === 'string') {
            payload = JSON.parse(payload);
          }
          
          // 检查是否有页面跳转信息
          if (payload.page) {
            targetPage = payload.page;
            pageParams = payload.params || {};
            console.log('🎯 检测到页面跳转指令:', targetPage, pageParams);
          }
        } catch (error) {
          console.warn('⚠️ 解析payload失败:', error);
        }
      }
      
      if (targetPage) {
        // 直接跳转到指定页面
        this.navigateToPage(targetPage, pageParams);
      } else {
        // 默认跳转到消息中心页面
        this.navigateToMessageCenter(notification);
      }
      
      // 处理其他payload内容
      if (notification.payload) {
        this.handleNotificationPayload(notification.payload);
      }
    } catch (error) {
      console.error('❌ 处理通知点击失败:', error);
    }
  }

  // 保存推送消息到本地存储
  private savePushMessageToLocal(notification: any): void {
    try {
      console.log('💾 保存推送消息到本地存储');
      
      // 这里可以使用 AsyncStorage 或其他本地存储方案
      // 暂时使用 console.log 记录
      const messageData = {
        id: notification.messageId || Date.now().toString(),
        title: notification.title || '推送消息',
        content: notification.content || '',
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'push',
        messageId: notification.messageId,
        taskId: notification.taskId,
        payload: notification.payload,
      };
      
      console.log('📝 消息数据:', messageData);
      
      // TODO: 使用 AsyncStorage 保存消息
      // await AsyncStorage.setItem(`push_message_${messageData.id}`, JSON.stringify(messageData));
      
    } catch (error) {
      console.error('❌ 保存推送消息失败:', error);
    }
  }

  // 跳转到消息中心页面
  private navigateToMessageCenter(notification: any): void {
    try {
      console.log('🧭 跳转到消息中心页面');
      
      // 使用导航服务发送导航事件
      const eventEmitter = navigationService.getEventEmitter();
      if (eventEmitter) {
        eventEmitter.emit('navigateToMessageCenter', {
          messageId: notification.messageId,
          title: notification.title,
          content: notification.content,
          taskId: notification.taskId,
        });
        console.log('✅ 导航事件已发送');
      } else {
        console.log('⚠️ 事件发射器不可用');
      }
      
    } catch (error) {
      console.error('❌ 跳转到消息中心失败:', error);
    }
  }

  // 处理注册成功
  private handleRegisterSuccess(clientId: string): void {
    console.log('🎉 [HANDLER] 个推注册成功');
    console.log('🆔 注册的CID:', clientId);
    
    // 这里可以将CID发送到您的后端服务器
    this.sendCidToServer(clientId);
  }

  // 发送CID到服务器
  private async sendCidToServer(clientId: string): Promise<void> {
    try {
      // 这里实现将CID发送到您的后端服务器的逻辑
      console.log('📤 发送CID到服务器:', clientId);
      
      // 示例：调用API将CID保存到用户账户
      // await apiService.updateUserPushToken({
      //   cid: clientId,
      //   platform: Platform.OS,
      //   userId: currentUserId
      // });
    } catch (error) {
      console.error('❌ 发送CID到服务器失败:', error);
    }
  }

  // 处理通知payload
  private handleNotificationPayload(payload: any): void {
    try {
      console.log('📦 [HANDLER] 处理通知payload');
      console.log('📨 Payload内容:', JSON.stringify(payload, null, 2));
      
      // 根据payload类型执行不同操作
      if (payload.type === 'navigate') {
        // 导航到特定页面
        this.navigateToPage(payload.page, payload.params);
      } else if (payload.type === 'action') {
        // 执行特定操作
        this.executeAction(payload.action, payload.params);
      }
    } catch (error) {
      console.error('❌ 处理通知payload失败:', error);
    }
  }

  // 导航到页面
  private navigateToPage(page: string, params?: any): void {
    try {
      console.log('🧭 导航到页面:', page, params);
      
      // 使用导航服务发送页面跳转事件
      const eventEmitter = navigationService.getEventEmitter();
      if (eventEmitter) {
        eventEmitter.emit('navigateToPage', {
          page,
          params,
          timestamp: new Date().toISOString()
        });
        console.log('✅ 页面跳转事件已发送:', page);
      } else {
        console.log('⚠️ 事件发射器不可用，无法跳转页面');
        // 降级处理：跳转到消息中心
        this.navigateToMessageCenter({
          title: '推送消息',
          content: '收到推送消息，点击查看详情',
          messageId: Date.now().toString()
        });
      }
    } catch (error) {
      console.error('❌ 页面跳转失败:', error);
      // 降级处理：跳转到消息中心
      this.navigateToMessageCenter({
        title: '推送消息',
        content: '收到推送消息，点击查看详情',
        messageId: Date.now().toString()
      });
    }
  }

  // 执行操作
  private executeAction(action: string, params?: any): void {
    console.log('⚡ 执行操作:', action, params);
    // 这里实现具体操作逻辑
  }

  // 显示本地通知
  private showLocalNotification(message: PushMessage): void {
    console.log('🔔 显示本地通知:', message);
    // 这里实现本地通知显示逻辑
  }

  // 获取Client ID
  async getClientId(): Promise<string | null> {
    try {
      if (this.clientId) {
        return this.clientId;
      }

      // 尝试从个推SDK获取CID
      return new Promise((resolve) => {
        Getui.clientId((cid: string) => {
          if (cid && cid.trim() && cid !== 'null' && cid !== 'undefined') {
            this.clientId = cid;
            console.log('✅ 成功获取CID:', cid);
            resolve(cid);
          } else {
            console.log('⚠️ CID为空或无效');
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ 获取Client ID失败:', error);
      return null;
    }
  }

  // 强制刷新Client ID
  async forceRefreshClientId(): Promise<string | null> {
    try {
      console.log('🔄 强制刷新Client ID...');
      this.clientId = null; // 清除缓存的CID
      return this.getClientId();
    } catch (error) {
      console.error('❌ 强制刷新Client ID失败:', error);
      return null;
    }
  }

  // 绑定别名
  bindAlias(alias: string, sn?: string): void {
    try {
      Getui.bindAlias(alias, sn);
      console.log('✅ 绑定别名成功:', alias);
    } catch (error) {
      console.error('❌ 绑定别名失败:', error);
    }
  }

  // 解绑别名
  unbindAlias(alias: string, sn?: string): void {
    try {
      Getui.unbindAlias(alias, sn);
      console.log('✅ 解绑别名成功:', alias);
    } catch (error) {
      console.error('❌ 解绑别名失败:', error);
    }
  }

  // 设置标签
  setTags(tags: string[]): boolean {
    try {
      const result = Getui.setTag(tags);
      console.log('✅ 设置标签成功:', tags);
      return result;
    } catch (error) {
      console.error('❌ 设置标签失败:', error);
      return false;
    }
  }

  // 开启推送
  turnOnPush(): void {
    try {
      Getui.turnOnPush();
      console.log('✅ 推送服务已开启');
    } catch (error) {
      console.error('❌ 开启推送失败:', error);
    }
  }

  // 关闭推送
  turnOffPush(): void {
    try {
      Getui.turnOffPush();
      console.log('✅ 推送服务已关闭');
    } catch (error) {
      console.error('❌ 关闭推送失败:', error);
    }
  }

  // 设置推送模式
  setPushModeForOff(isOff: boolean): void {
    try {
      Getui.setPushModeForOff(isOff);
      console.log('✅ 推送模式设置成功:', isOff ? '关闭' : '开启');
    } catch (error) {
      console.error('❌ 设置推送模式失败:', error);
    }
  }

  // 设置角标
  setBadge(value: number): void {
    try {
      Getui.setBadge(value);
      console.log('✅ 角标设置成功:', value);
    } catch (error) {
      console.error('❌ 设置角标失败:', error);
    }
  }

  // 重置角标
  resetBadge(): void {
    try {
      Getui.resetBadge();
      console.log('✅ 角标重置成功');
    } catch (error) {
      console.error('❌ 重置角标失败:', error);
    }
  }

  // 发送消息
  async sendMessage(body: string): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const msgId = Getui.sendMessage(body, (success: boolean) => {
          console.log('✅ 消息发送成功:', body);
          resolve(success);
        });
        console.log('📤 发送消息ID:', msgId);
      });
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
      return false;
    }
  }

  // 获取推送状态
  async getStatus(): Promise<string> {
    try {
      return new Promise((resolve) => {
        Getui.status((status: string) => {
          console.log('📊 SDK状态:', status);
          resolve(status);
        });
      });
    } catch (error) {
      console.error('❌ 获取推送状态失败:', error);
      return 'unknown';
    }
  }

  // 获取SDK版本
  async getVersion(): Promise<string> {
    try {
      return new Promise((resolve) => {
        Getui.version((version: string) => {
          console.log('📦 SDK版本:', version);
          resolve(version);
        });
      });
    } catch (error) {
      console.error('❌ 获取SDK版本失败:', error);
      return 'unknown';
    }
  }

  // 设置后台运行
  setRunBackgroundEnable(isEnable: boolean): void {
    try {
      Getui.runBackgroundEnable(isEnable);
      console.log('✅ 后台运行设置成功:', isEnable);
    } catch (error) {
      console.error('❌ 设置后台运行失败:', error);
    }
  }

  // 设置LBS定位
  setLbsLocationEnable(isEnable: boolean, isVerify: boolean): void {
    try {
      Getui.lbsLocationEnable(isEnable, isVerify);
      console.log('✅ LBS定位设置成功:', isEnable, isVerify);
    } catch (error) {
      console.error('❌ 设置LBS定位失败:', error);
    }
  }

  // 设置渠道ID
  setChannelId(channelId: string): void {
    try {
      Getui.setChannelId(channelId);
      console.log('✅ 渠道ID设置成功:', channelId);
    } catch (error) {
      console.error('❌ 设置渠道ID失败:', error);
    }
  }

  // 注册设备Token
  registerDeviceToken(deviceToken: string): void {
    try {
      Getui.registerDeviceToken(deviceToken);
      console.log('✅ 设备Token注册成功:', deviceToken);
    } catch (error) {
      console.error('❌ 注册设备Token失败:', error);
    }
  }

  // 清除所有通知
  clearAllNotifications(): void {
    try {
      Getui.clearAllNotificationForNotificationBar();
      console.log('✅ 所有通知已清除');
    } catch (error) {
      console.error('❌ 清除通知失败:', error);
    }
  }

  // 销毁服务
  destroy(): void {
    try {
      console.log('🗑️ 开始销毁推送服务...');
      
      // 移除所有事件监听器
      this.eventListeners.forEach(listener => {
        try {
          listener.remove();
        } catch (error) {
          console.warn('移除事件监听器失败:', error);
        }
      });
      this.eventListeners = [];

      // 销毁个推SDK
      Getui.destroy();
      console.log('✅ 推送服务已销毁');
      
      this.isInitialized = false;
      this.clientId = null;
      this.initializationPromise = null;
    } catch (error) {
      console.error('❌ 销毁推送服务失败:', error);
    }
  }

  // 恢复服务
  resume(): void {
    try {
      Getui.resume();
      console.log('✅ 推送服务已恢复');
    } catch (error) {
      console.error('❌ 恢复推送服务失败:', error);
    }
  }

  // 发送反馈消息
  async sendFeedbackMessage(actionId: number, taskId: string, msgId: string): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        Getui.sendFeedbackMessage(actionId, taskId, msgId, (success: boolean) => {
          console.log('✅ 反馈消息发送成功:', actionId, taskId, msgId);
          resolve(success);
        });
      });
    } catch (error) {
      console.error('❌ 发送反馈消息失败:', error);
      return false;
    }
  }

  // 检查服务是否已初始化
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
      
      const response = await fetch('https://www.baidu.com', { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const isConnected = response.ok;
      console.log('🌐 网络连接状态:', isConnected ? '正常' : '异常');
      return isConnected;
    } catch (error: any) {
      console.error('❌ 网络连接检查失败:', error);
      return false;
    }
  }

  // 带网络检查的CID获取
  async getClientIdWithNetworkCheck(): Promise<string | null> {
    const isConnected = await this.checkNetworkConnection();
    if (!isConnected) {
      console.log('⚠️ 网络连接异常，可能影响CID获取');
    }
    return this.getClientId();
  }
}

// 创建单例实例
export const pushService = new PushService(); 