// leaderboard —— 游戏成绩榜
// 数据：gameScores = { id: { game, role, score, result?, ts } }
//   积分类(2048/方块)：按 score 排序，显示最高分
//   对战类(五子棋/记忆/黑白棋)：score=3/1/0(胜/平/负)，显示 胜-平-负、积分、胜率
const { Store } = require('@utils/store.js');
const room = require('@utils/room.js');

const GAMES = [
  { key: 'g2048', label: '2048', kind: 'score' },
  { key: 'tetris', label: '俄罗斯方块', kind: 'score' },
  { key: 'gomoku', label: '五子棋', kind: 'pvp' },
  { key: 'memory', label: '记忆翻牌', kind: 'pvp' },
  { key: 'othello', label: '黑白棋', kind: 'pvp' },
  { key: 'monopoly', label: '大富翁', kind: 'pvp' },
  { key: 'banqi', label: '翻翻棋', kind: 'pvp' },
  { key: 'xiangqi', label: '象棋', kind: 'pvp' }
];

function fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

Page({
  data: {
    theme: 'sakura', tab: 'g2048', games: GAMES, kind: 'score',
    role: 'boy', peer: 'girl',
    list: [], myBest: 0, peerBest: 0,
    myStat: null, peerStat: null, recent: []
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
    const tab = this.data.tab, role = this.data.role, peerRole = this.data.peer;
    const g = GAMES.find(x => x.key === tab) || GAMES[0];
    const arr = (this._all || []).filter(it => it && it.game === tab);
    if (g.kind === 'score') {
      const sorted = arr.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
      const list = sorted.map((it, i) => ({ rank: i + 1, score: it.score || 0, mine: it.role === role, name: it.role === role ? '我' : 'ta', time: fmt(it.ts), top: i < 3 }));
      const myBest = arr.filter(it => it.role === role).reduce((m, it) => Math.max(m, it.score || 0), 0);
      const peerBest = arr.filter(it => it.role !== role).reduce((m, it) => Math.max(m, it.score || 0), 0);
      this.setData({ kind: 'score', list, myBest, peerBest, myStat: null, peerStat: null, recent: [] });
    } else {
      const stat = r => {
        const a = arr.filter(it => it.role === r);
        const w = a.filter(it => it.result === 'win').length;
        const d = a.filter(it => it.result === 'draw').length;
        const l = a.filter(it => it.result === 'lose').length;
        const pts = a.reduce((s, it) => s + (it.score || 0), 0);
        const total = w + d + l;
        return { w, d, l, pts, rate: total ? Math.round(w * 100 / total) : 0 };
      };
      const recent = arr.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 12).map(it => ({
        result: it.result, mine: it.role === role, name: it.role === role ? '我' : 'ta', time: fmt(it.ts)
      }));
      this.setData({ kind: 'pvp', myStat: stat(role), peerStat: stat(peerRole), recent });
    }
  }
});
