// 自定义 tabBar：用 t-icon 渲染（不依赖图片资源，符合工程「UI 用 t-icon」铁律）
Component({
  data: {
    selected: 0,
    hidden: false,
    list: [
      { pagePath: '/pages/main/main', text: '小窝', icon: 'home' },
      { pagePath: '/pages/me/me', text: '我的', icon: 'user' }
    ]
  },
  methods: {
    switchTab(e) {
      wx.switchTab({ url: e.currentTarget.dataset.path });
    }
  }
});
