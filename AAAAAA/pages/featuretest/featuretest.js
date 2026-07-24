// featuretest —— web-view 容器测试页（自定义导航栏 + web-view 铺满）
// 模板来自 webview-native-template；Skyline 工程适配：页面 json 设 renderer:webview
// 自定义头用 cover-view 包裹：web-view 是原生组件层级最高，普通 view 头部会被盖住(顶部黑)，cover-view 才能盖回去
const DEFAULT_URL = 'https://www.baidu.com/';

function getWindowInfo() {
  try {
    if (wx.getWindowInfo) return wx.getWindowInfo();
  } catch (e) {}
  return wx.getSystemInfoSync();
}

Page({
  data: {
    url: '',
    title: '功能测试',
    statusBarHeight: 0,
    navBarHeight: 0
  },

  onLoad(options) {
    // 1. 算自定义导航栏高度（状态栏 + 胶囊居中）
    const win = getWindowInfo();
    const menu = wx.getMenuButtonBoundingClientRect();
    const statusBarHeight = win.statusBarHeight || 20;
    // 总高度 = 胶囊 bottom + (胶囊 top - 状态栏高度)
    const navBarHeight = menu.bottom + (menu.top - statusBarHeight);

    // 2. 接收参数（url 一般被 encodeURIComponent 包过）；没传则用默认百度
    let url = options.url || DEFAULT_URL;
    try {
      url = decodeURIComponent(url);
    } catch (e) {}
    let title = '功能测试';
    if (options.title) {
      try { title = decodeURIComponent(options.title); } catch (e) { title = options.title; }
    }

    this.setData({ statusBarHeight, navBarHeight, url, title });
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      // 没有上一页（如直接被分享打开），退回首页 tab（本工程首页是 pages/main/main）
      wx.switchTab({
        url: '/pages/main/main',
        fail: () => wx.reLaunch({ url: '/pages/main/main' })
      });
    }
  }
});
