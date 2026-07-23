import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { getConfig } from '../constants/config';

// 定义个推事件类型
interface GetuiEvent {
  clientId?: string;
  title?: string;
  content?: string;
  payload?: any;
  error?: string;
}

export interface PushMessage {
  title: string;
  content: string;
  payload?: any;
  timestamp: number;
}

// 模拟个推SDK（用于Expo开发环境）
class MockGetuiSDK {
  private listeners: { [key: string]: Function[] } = {};
  private clientId: string = '';

  async init(config: any) {
    console.log('模拟个推SDK初始化:', config);
    // 模拟初始化延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.clientId = 'mock_client_id_' + Date.now();
    
    // 模拟注册成功
    setTimeout(() => {
      this.triggerEvent('receiveRegisterId', { clientId: this.clientId });
    }, 500);
    
    return true;
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeAllListeners() {
    this.listeners = {};
  }

  private triggerEvent(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  async requestPermissions() {
    console.log('模拟请求推送权限');
    return true;
  }

  async setTags(tags: string[]) {
    console.log('模拟设置标签:', tags);
  }

  async setAlias(alias: string) {
    console.log('模拟设置别名:', alias);
  }

  // 模拟发送测试消息
  sendTestMessage() {
    const testMessage = {
      title: '测试推送消息',
      content: '这是一条测试推送消息，时间: ' + new Date().toLocaleString(),
      payload: { type: 'test', timestamp: Date.now() }
    };
    
    setTimeout(() => {
      this.triggerEvent('receivePayload', testMessage);
    }, 2000);
  }
}

// 尝试导入真实的个推SDK，如果失败则使用模拟版本
let Getui: any;
try {
  Getui = require('react-native-getui');
  console.log('成功加载个推SDK');
} catch (error) {
  console.log('个推SDK加载失败，使用模拟版本:', error);
  Getui = new MockGetuiSDK();
}

export const useGetuiPush = () => {
  const [clientId, setClientId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [messages, setMessages] = useState<PushMessage[]>([]);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    initializeGetui();
    setupEventListeners();

    return () => {
      // 清理事件监听器
      if (Getui.removeAllListeners) {
        Getui.removeAllListeners();
      }
    };
  }, []);

  const initializeGetui = async () => {
    try {
      // 检查是否在Expo环境中
      const isExpo = typeof expo !== 'undefined';
      if (isExpo) {
        console.log('检测到Expo环境，使用模拟个推SDK');
        setIsMockMode(true);
      }

      // 初始化个推SDK
      const config = getConfig();
      const getuiConfig = {
        appId: config.GETUI.APP_ID,
        appKey: config.GETUI.APP_KEY,
        appSecret: config.GETUI.APP_SECRET,
      };

      if (Getui.init) {
        await Getui.init(getuiConfig);
        setIsInitialized(true);
        console.log('个推SDK初始化成功');
        
        // 如果是模拟模式，发送测试消息
        if (isMockMode && Getui.sendTestMessage) {
          setTimeout(() => {
            Getui.sendTestMessage();
          }, 3000);
        }
      } else {
        throw new Error('个推SDK初始化方法不存在');
      }
    } catch (error) {
      console.error('个推SDK初始化失败:', error);
      setIsMockMode(true);
      setIsInitialized(true);
      
      // 在模拟模式下显示提示
      if (Platform.OS !== 'web') {
        Alert.alert(
          '开发模式提示', 
          '当前使用模拟推送服务。在生产环境中需要配置真实的个推SDK。',
          [{ text: '确定' }]
        );
      }
    }
  };

  const setupEventListeners = () => {
    if (!Getui.addEventListener) {
      console.log('个推SDK不支持事件监听，使用模拟模式');
      return;
    }

    // 注册成功回调
    Getui.addEventListener('receiveRegisterId', (event: GetuiEvent) => {
      console.log('个推注册成功，ClientId:', event.clientId);
      setClientId(event.clientId || '');
    });

    // 接收透传消息回调
    Getui.addEventListener('receivePayload', (event: GetuiEvent) => {
      console.log('收到透传消息:', event);
      const newMessage: PushMessage = {
        title: event.title || '新消息',
        content: event.content || event.payload || '',
        payload: event.payload,
        timestamp: Date.now(),
      };
      setMessages(prev => [newMessage, ...prev]);
    });

    // 通知点击回调
    Getui.addEventListener('clickPayload', (event: GetuiEvent) => {
      console.log('点击通知:', event);
      // 处理通知点击事件
      handleNotificationClick(event);
    });

    // 注册失败回调
    Getui.addEventListener('receiveRegisterIdError', (event: GetuiEvent) => {
      console.error('个推注册失败:', event);
      if (!isMockMode) {
        Alert.alert('错误', '推送服务注册失败');
      }
    });
  };

  const handleNotificationClick = (event: any) => {
    // 根据payload处理不同的业务逻辑
    if (event.payload) {
      try {
        const payload = typeof event.payload === 'string' 
          ? JSON.parse(event.payload) 
          : event.payload;
        
        // 根据payload类型进行不同的处理
        switch (payload.type) {
          case 'message':
            // 处理消息类型
            break;
          case 'order':
            // 处理订单类型
            break;
          case 'test':
            console.log('收到测试消息:', payload);
            break;
          default:
            // 默认处理
            break;
        }
      } catch (error) {
        console.error('解析通知payload失败:', error);
      }
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'ios' && Getui.requestPermissions) {
        const result = await Getui.requestPermissions();
        console.log('权限请求结果:', result);
        return result;
      }
      return true;
    } catch (error) {
      console.error('请求推送权限失败:', error);
      return false;
    }
  };

  const setTags = async (tags: string[]) => {
    try {
      if (Getui.setTags) {
        await Getui.setTags(tags);
        console.log('设置标签成功:', tags);
      }
    } catch (error) {
      console.error('设置标签失败:', error);
    }
  };

  const setAlias = async (alias: string) => {
    try {
      if (Getui.setAlias) {
        await Getui.setAlias(alias);
        console.log('设置别名成功:', alias);
      }
    } catch (error) {
      console.error('设置别名失败:', error);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const sendTestMessage = () => {
    if (isMockMode && Getui.sendTestMessage) {
      Getui.sendTestMessage();
    }
  };

  return {
    clientId,
    isInitialized,
    messages,
    isMockMode,
    requestPermissions,
    setTags,
    setAlias,
    clearMessages,
    sendTestMessage,
  };
}; 