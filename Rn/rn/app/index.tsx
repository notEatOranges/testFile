import { Redirect } from 'expo-router';

export default function Index() {
  // 重定向到首页
  return <Redirect href="/tabs" />;
} 