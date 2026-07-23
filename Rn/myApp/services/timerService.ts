import { authService } from './authService';

class TimerService {
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 每5分钟检查一次

  // 开始定时检查登录状态
  startLoginCheck() {
    if (this.checkInterval) {
      this.stopLoginCheck();
    }

    this.checkInterval = setInterval(async () => {
      try {
        const loginState = await authService.checkLoginState();
        
        // 如果登录已过期，会自动清除登录状态
        if (!loginState.isLoggedIn) {
          console.log('登录已过期，自动退出');
          // 这里可以添加全局通知或其他处理逻辑
        }
      } catch (error) {
        console.error('定时检查登录状态失败:', error);
      }
    }, this.CHECK_INTERVAL);

    console.log('定时登录检查已启动');
  }

  // 停止定时检查
  stopLoginCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('定时登录检查已停止');
    }
  }

  // 立即检查一次登录状态
  async checkLoginStateNow() {
    try {
      return await authService.checkLoginState();
    } catch (error) {
      console.error('立即检查登录状态失败:', error);
      return { isLoggedIn: false, loginTime: 0, expiresAt: 0 };
    }
  }
}

export const timerService = new TimerService(); 