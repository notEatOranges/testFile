import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { ReactNode, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface HeaderBarProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  backIconColor?: string;
  centerTitle?: boolean;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  backgroundColor = 'white',
  titleColor = '#333',
  backIconColor = '#007AFF',
  centerTitle = true,
}) => {
  const router = useRouter();
  const [statusBarHeight, setStatusBarHeight] = useState(Platform.OS === 'ios' ? 44 : 24);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor }]}>
      <StatusBar 
        barStyle={backgroundColor === 'white' ? 'dark-content' : 'light-content'} 
        backgroundColor={backgroundColor}
        translucent={true}
      />
      
      {/* 状态栏占位 */}
      <View style={{ height: statusBarHeight }} />
      
      {/* 安全区域内容 */}
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={[styles.container, { backgroundColor }]}>
          {/* 左侧区域 - 返回按钮 */}
          <View style={styles.leftContainer}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={24} color={backIconColor} />
                <Text style={[styles.backText, { color: backIconColor }]}>返回</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 中间区域 - 标题 */}
          <View style={[
            styles.titleContainer, 
            centerTitle ? styles.titleCentered : styles.titleLeft,
            !showBackButton && styles.titleLeftPadding
          ]}>
            <Text 
              style={[styles.title, { color: titleColor }]} 
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>

          {/* 右侧区域 - 自定义组件 */}
          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  safeArea: {
    width: '100%',
  },
  container: {
    height: 56,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  leftContainer: {
    minWidth: 80,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 5,
  },
  titleCentered: {
    alignItems: 'center',
  },
  titleLeft: {
    alignItems: 'flex-start',
    paddingLeft: 80, // 与左侧按钮保持一致的距离
  },
  titleLeftPadding: {
    paddingLeft: 16,
  },
  rightContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: -4,
  },
});

export default HeaderBar; 