import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authService } from '../../services/authService';

export default function TabOneScreen() {
  const [username, setUsername] = useState('用户');
  const [loginTime, setLoginTime] = useState('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const loginState = await authService.checkLoginState();
      if (loginState.isLoggedIn && loginState.username) {
        setUsername(loginState.username);
        
        // 格式化登录时间
        const loginDate = new Date(loginState.loginTime);
        const timeString = loginDate.toLocaleString('zh-CN');
        setLoginTime(timeString);
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>欢迎回来，{username}！</Text>
        <Text style={styles.subtitle}>简洁、高效的移动应用</Text>
        {loginTime && (
          <Text style={styles.loginTime}>登录时间：{loginTime}</Text>
        )}
      </View>
        
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>快速功能</Text>
        
        <Link href="/tabs/profile" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="person" size={32} color="#007AFF" />
            <Text style={styles.actionTitle}>个人中心</Text>
            <Text style={styles.actionDescription}>查看和管理个人信息</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="settings" size={32} color="#FF9500" />
          <Text style={styles.actionTitle}>应用设置</Text>
          <Text style={styles.actionDescription}>配置应用参数和偏好</Text>
        </TouchableOpacity>
            
        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="help-circle" size={32} color="#34C759" />
          <Text style={styles.actionTitle}>帮助中心</Text>
          <Text style={styles.actionDescription}>获取使用帮助和支持</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Ionicons name="information-circle" size={32} color="#FF3B30" />
          <Text style={styles.actionTitle}>关于应用</Text>
          <Text style={styles.actionDescription}>了解应用版本和更新</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <Text style={styles.sectionTitle}>功能特性</Text>
        
        <View style={styles.featureItem}>
          <Ionicons name="shield-checkmark" size={24} color="#34C759" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>安全可靠</Text>
            <Text style={styles.featureDescription}>保护您的隐私和数据安全</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="speedometer" size={24} color="#FF9500" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>高效性能</Text>
            <Text style={styles.featureDescription}>快速响应，流畅体验</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="lock-closed" size={24} color="#007AFF" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>数据保护</Text>
            <Text style={styles.featureDescription}>本地存储，数据安全</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="phone-portrait" size={24} color="#FF3B30" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>跨平台支持</Text>
            <Text style={styles.featureDescription}>支持iOS和Android平台</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="finger-print" size={24} color="#AF52DE" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>指纹登录</Text>
            <Text style={styles.featureDescription}>支持指纹快速登录认证</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  loginTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  features: {
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  featureContent: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
});
