// lobby —— 游戏大厅（功能7）
const { THEMES } = require('@utils/themes.js');

Page({
  data: {
    theme: 'sakura',
    games: [
      { key: 'game2048', name: '2048', desc: '滑动合成大数字', icon: 'grid-view' },
      { key: 'tetris', name: '俄罗斯方块', desc: '经典消行挑战', icon: 'app' },
      { key: 'drawguess', name: '你画我猜', desc: '画给 ta 猜', icon: 'edit-1' }
    ]
  },

  onLoad() { this.setData({ theme: getApp().globalData.theme || 'sakura' }); },

  go(e) {
    const key = e.currentTarget.dataset.k;
    wx.navigateTo({ url: '/packageGames/' + key + '/' + key });
  }
});
