import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { pushService } from '../services/pushService';

export default function RootLayout() {
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

    initPushService();
  }, []);

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
        name="tabs"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
