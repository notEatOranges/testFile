// leaderboard —— 游戏成绩榜（2048 / 俄罗斯方块：双方历史成绩，分类排名）
// 数据：gameScores = { id: { game: 'g2048'|'tetris', role, score, ts } }
const { Store } = require('@utils/store.js');
const room = require('@utils/room.js');

const GAMES = [
  { key: 'g2048', label: '2048' },
  { key: 'tetris', label: '俄罗斯方块' }
];

Page({
  data: {
    theme: 'sakura', tab: 'g2048', games: GAMES,
    role: 'boy', peer: 'girl',
    list: [], myBest: 0, peerBest: 0
  },

  onLoad() {
    this.setData({
      theme: getApp().globalData.theme || 'sakura',
      role: room.getRole() || 'boy', peer: room.getPeer() || 'girl'
    });
  },
  onShow() {
    if (this._sub) return;
    this._sub = Store.onList('gameScores', items => { this._all = items || []; this.render(); });
  },
  onUnload() { if (this._sub) { this._sub(); this._sub = null; } },

  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.k }); this.render(); },

  render() {
    const tab = this.data.tab, role = this.data.role;
    const arr = this._all.filter(it => it && it.game === tab).sort((a, b) => (b.score || 0) - (a.score || 0));
    const list = arr.map((it, i) => ({
      rank: i + 1, score: it.score || 0, mine: it.role === role,
      name: it.role === role ? '我' : 'ta',
      time: this.fmt(it.ts), top: i < 3
    }));
    const myBest = arr.filter(it => it.role === role).reduce((m, it) => Math.max(m, it.score || 0), 0);
    const peerBest = arr.filter(it => it.role !== role).reduce((m, it) => Math.max(m, it.score || 0), 0);
    this.setData({ list, myBest, peerBest });
  },
  fmt(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
});
