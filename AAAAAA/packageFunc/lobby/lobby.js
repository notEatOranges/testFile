// lobby —— 游戏大厅（功能7）
const { THEMES } = require('@utils/themes.js');

Page({
  data: {
    theme: 'sakura',
    games: [
      { key: 'game2048', name: '2048', desc: '滑动合成大数字', icon: 'grid-view' },
      { key: 'tetris', name: '俄罗斯方块', desc: '经典消行挑战', icon: 'app' },
      { key: 'drawguess', name: '你画我猜', desc: '画给 ta 猜', icon: 'edit-1' },
      { key: 'gomoku', name: '五子棋', desc: '双人实时对弈', icon: 'dashboard' },
      { key: 'memory', name: '记忆翻牌', desc: '翻牌配对·比记性', icon: 'heart' },
      { key: 'othello', name: '黑白棋', desc: '夹住翻转·比子数', icon: 'user' },
      { key: 'monopoly', name: '大富翁', desc: '买地收租·机会卡', icon: 'trophy' },
      { key: 'banqi', name: '翻翻棋', desc: '暗棋·翻面吃子', icon: 'gift' }
    ]
  },

  onLoad() { this.setData({ theme: getApp().globalData.theme || 'sakura' }); },

  go(e) {
    const key = e.currentTarget.dataset.k;
    wx.navigateTo({ url: '/packageGames/' + key + '/' + key });
  },
  goBoard() { wx.navigateTo({ url: '/packageGames/leaderboard/leaderboard' }); }
});
