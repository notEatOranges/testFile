import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { navigationService } from '../services/navigationService';
import { pushService } from '../services/pushService';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // 应用启动时初始化推送服务
    const initPushService = async () => {
      try {
        console.log('🚀 应用启动，初始化推送服务...');
        await pushService.initialize();
        console.log('✅ 推送服务初始化完成');
      } catch (error) {
        console.error('❌ 推送服务初始化失败:', error);
      }
    };

    // 设置导航监听器
    navigationService.setNavigationCallback((data) => {
      console.log('🧭 收到推送消息导航请求:', data);
      
      // 先跳转到消息中心
      router.push('/message-center');
      
      // 如果有消息ID，延迟一下再跳转到详情页（确保消息中心已加载）
      if (data.messageId) {
        setTimeout(() => {
          const params = {
            messageId: data.messageId,
            title: data.title || '推送消息',
            content: data.content || '',
            timestamp: new Date().toLocaleString(),
            type: 'push',
            pushMessageId: data.messageId || '',
            pushTaskId: data.taskId || '',
          };
          
          router.push({
            pathname: '/message-detail',
            params
          });
        }, 500);
      }
    });

    // 设置页面跳转监听器
    navigationService.setPageNavigationCallback((data) => {
      console.log('🧭 收到页面跳转请求:', data);
      
      try {
        const { page, params } = data;
        
        // 根据页面名称跳转到对应页面
        switch (page) {
          case 'DetailScreen':
          case 'message-detail':
            router.push({
              pathname: '/message-detail',
              params: params || {}
            });
            break;
          case 'Home':
          case 'index':
            router.push('/');
            break;
          case 'Login':
          case 'login':
            router.push('/login');
            break;
          case 'MessageCenter':
          case 'message-center':
            router.push('/message-center');
            break;
          case 'PushTest':
          case 'push-test':
            router.push('/push-test');
            break;
          case 'PushDebug':
          case 'push-debug':
            router.push('/push-debug');
            break;
          case 'FingerprintSteps':
          case 'fingerprint-steps':
            router.push('/fingerprint-steps');
            break;
          default:
            console.log('⚠️ 未知页面:', page);
            // 默认跳转到消息中心
            router.push('/message-center');
        }
      } catch (error) {
        console.error('❌ 页面跳转失败:', error);
        // 降级处理：跳转到消息中心
        router.push('/message-center');
      }
    });

    initPushService();

    // 清理函数
    return () => {
      navigationService.clearNavigationCallback();
    };
  }, [router]);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="fingerprint-steps"
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="push-test"
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="push-debug"
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="message-center"
        options={{
          headerShown: false,
          gestureEnabled: true,
          title: '消息中心'
        }}
      />
      <Stack.Screen
        name="message-detail"
        options={{
          headerShown: false,
          gestureEnabled: true,
          title: '消息详情'
        }}
      />
      <Stack.Screen
        name="tabs"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
