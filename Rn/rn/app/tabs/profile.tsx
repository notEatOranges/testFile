import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { authService } from '../../services/authService';
import { pushService } from '../../services/pushService';

export default function ProfileScreen() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [fingerprintAvailable, setFingerprintAvailable] = useState(false);
  const [cid, setCid] = useState<string>('');
  const [pushStatus, setPushStatus] = useState<string>('');

  useEffect(() => {
    checkLoginState();
    checkFingerprintSettings();
    checkPushService();
  }, []);

  const checkLoginState = async () => {
    try {
      const loginState = await authService.checkLoginState();
      if (!loginState.isLoggedIn) {
        router.replace('/login');
        return;
      }
      setUsername(loginState.username || '');
    } catch (error) {
      console.error('检查登录状态失败:', error);
      router.replace('/login');
    }
  };

  const checkFingerprintSettings = async () => {
    try {
      const settings = await authService.getFingerprintSettings();
      setFingerprintEnabled(settings.enabled);
      
      const available = await authService.isFingerprintAvailable();
      setFingerprintAvailable(available);
    } catch (error) {
      console.error('检查指纹设置失败:', error);
    }
  };

  const checkPushService = async () => {
    try {
      // 获取CID
      const clientId = await pushService.getClientId();
      setCid(clientId || '未获取到');

      // 获取推送状态
      const status = await pushService.getStatus();
      setPushStatus(status);
    } catch (error) {
      console.error('检查推送服务失败:', error);
      setCid('获取失败');
      setPushStatus('未知');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              router.replace('/login');
            } catch (error) {
              console.error('退出登录失败:', error);
              Alert.alert('错误', '退出登录失败，请重试');
            }
          },
        },
      ]
    );
  };

  const handleFingerprintSettings = () => {
    if (!fingerprintAvailable) {
      Alert.alert('提示', '设备不支持指纹认证');
      return;
    }

    if (fingerprintEnabled) {
      // 关闭指纹登录
      Alert.alert(
        '关闭指纹登录',
        '确定要关闭指纹登录吗？\n\n关闭后将清理所有相关数据，包括密钥对、指纹设置和刷新Token。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定关闭',
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await authService.disableFingerprintLogin();
                if (success) {
                  setFingerprintEnabled(false);
                  Alert.alert('成功', '指纹登录已关闭，所有相关数据已清理');
                } else {
                  Alert.alert('错误', '关闭失败，请重试');
                }
              } catch (error) {
                console.error('关闭指纹登录失败:', error);
                Alert.alert('错误', '关闭失败，请重试');
              }
            },
          },
        ]
      );
    } else {
      // 开启指纹登录
      router.push('/fingerprint-steps');
    }
  };

  const handlePushSettings = () => {
    Alert.alert(
      '推送设置',
      '选择操作',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '开启推送',
          onPress: () => {
            pushService.turnOnPush();
            Alert.alert('成功', '推送服务已开启');
            checkPushService();
          },
        },
        {
          text: '关闭推送',
          onPress: () => {
            pushService.turnOffPush();
            Alert.alert('成功', '推送服务已关闭');
            checkPushService();
          },
        },
        {
          text: '清除通知',
          onPress: () => {
            pushService.clearAllNotifications();
            Alert.alert('成功', '所有通知已清除');
          },
        },
      ]
    );
  };

  const handleBindAlias = () => {
    if (!username) {
      Alert.alert('提示', '请先登录');
      return;
    }

    Alert.prompt(
      '绑定别名',
      '请输入要绑定的别名（用于推送）',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: (alias) => {
            if (alias && alias.trim()) {
              pushService.bindAlias(alias.trim());
              Alert.alert('成功', `别名 "${alias.trim()}" 绑定成功`);
            } else {
              Alert.alert('错误', '别名不能为空');
            }
          },
        },
      ],
      'plain-text',
      username
    );
  };

  const handleSetTags = () => {
    Alert.prompt(
      '设置标签',
      '请输入标签，多个标签用逗号分隔',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: (tagsInput) => {
            if (tagsInput && tagsInput.trim()) {
              const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
              const success = pushService.setTags(tags);
              if (success) {
                Alert.alert('成功', `标签设置成功: ${tags.join(', ')}`);
              } else {
                Alert.alert('错误', '标签设置失败');
              }
            } else {
              Alert.alert('错误', '标签不能为空');
            }
          },
        },
      ],
      'plain-text',
      'user,vip'
    );
  };

  const copyCid = () => {
    if (cid && cid !== '未获取到' && cid !== '获取失败') {
      // 这里可以添加复制到剪贴板的功能
      Alert.alert('CID', `CID: ${cid}\n\n已复制到剪贴板`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{username || '未登录'}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: fingerprintEnabled ? '#34C759' : '#FF9500' }]} />
                <Text style={styles.userStatus}>
                  指纹登录: {fingerprintEnabled ? '已开启' : '未开启'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 消息中心 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>消息中心</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/message-center')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="chatbubbles" size={20} color="#666" />
              <Text style={styles.menuItemText}>我的消息</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>新</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 推送服务 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>推送服务</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={copyCid}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="phone-portrait" size={20} color="#666" />
              <Text style={styles.menuItemText}>CID (点击复制)</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue} numberOfLines={1}>
                {cid}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handlePushSettings}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings" size={20} color="#666" />
              <Text style={styles.menuItemText}>推送设置</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>{pushStatus}</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleBindAlias}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-add" size={20} color="#666" />
              <Text style={styles.menuItemText}>绑定别名</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleSetTags}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="pricetags" size={20} color="#666" />
              <Text style={styles.menuItemText}>设置标签</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/push-test')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bug" size={20} color="#666" />
              <Text style={styles.menuItemText}>推送测试</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 安全设置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>安全设置</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleFingerprintSettings}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="finger-print" size={20} color="#666" />
              <Text style={styles.menuItemText}>指纹登录</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>
                {fingerprintEnabled ? '已开启' : '未开启'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 其他设置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>其他</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={20} color="#666" />
              <Text style={styles.menuItemText}>应用设置</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle" size={20} color="#666" />
              <Text style={styles.menuItemText}>帮助与反馈</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle" size={20} color="#666" />
              <Text style={styles.menuItemText}>关于我们</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 退出登录 */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>退出登录</Text>
        </TouchableOpacity>

        {/* 底部安全距离 */}
        <View style={styles.bottomSafeArea} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  userStatus: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'rgba(248, 249, 250, 0.5)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    backgroundColor: '#fff',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 14,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
    maxWidth: 120,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  bottomSafeArea: {
    height: Platform.OS === 'ios' ? 34 : 20,
  },
  badgeContainer: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 