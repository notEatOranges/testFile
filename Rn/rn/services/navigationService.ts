import { NativeEventEmitter } from 'react-native';

interface NavigationData {
  messageId: string;
  title: string;
  content: string;
  taskId?: string;
}

interface PageNavigationData {
  page: string;
  params?: any;
  timestamp: string;
}

class NavigationService {
  private static instance: NavigationService;
  private eventEmitter: NativeEventEmitter | null = null;
  private navigationCallback: ((data: NavigationData) => void) | null = null;
  private pageNavigationCallback: ((data: PageNavigationData) => void) | null = null;

  private constructor() {
    this.eventEmitter = new NativeEventEmitter();
    this.setupNavigationListener();
  }

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  // 设置导航监听器
  private setupNavigationListener(): void {
    if (this.eventEmitter) {
      // 监听跳转到消息中心
      this.eventEmitter.addListener('navigateToMessageCenter', (data: NavigationData) => {
        console.log('🧭 收到跳转消息中心事件:', data);
        if (this.navigationCallback) {
          this.navigationCallback(data);
        }
      });
      
      // 监听跳转到指定页面
      this.eventEmitter.addListener('navigateToPage', (data: PageNavigationData) => {
        console.log('🧭 收到页面跳转事件:', data);
        if (this.pageNavigationCallback) {
          this.pageNavigationCallback(data);
        }
      });
    }
  }

  // 设置导航回调函数
  public setNavigationCallback(callback: (data: NavigationData) => void): void {
    this.navigationCallback = callback;
  }

  // 设置页面跳转回调函数
  public setPageNavigationCallback(callback: (data: PageNavigationData) => void): void {
    this.pageNavigationCallback = callback;
  }

  // 清除导航回调函数
  public clearNavigationCallback(): void {
    this.navigationCallback = null;
    this.pageNavigationCallback = null;
  }

  // 手动触发导航（用于测试）
  public triggerNavigation(data: NavigationData): void {
    console.log('🧭 手动触发导航:', data);
    if (this.navigationCallback) {
      this.navigationCallback(data);
    }
  }

  // 获取事件发射器（供其他服务使用）
  public getEventEmitter(): NativeEventEmitter | null {
    return this.eventEmitter;
  }
}

export const navigationService = NavigationService.getInstance(); 