// memory —— 记忆翻牌（功能8，双人实时联机）：翻 t-icon 配对，配对多者胜
// 状态 games/memory/state = { cards:[{icon,matched}], open:[i,j], turn, scores:{red,blue}, winner, ts }
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

const ICONS = ['heart', 'star', 'gift', 'trophy', 'location', 'palette', 'user', 'chat']; // 8 对 = 16 张

function buildCards() {
  const arr = [];
  ICONS.forEach(ic => { arr.push(ic); arr.push(ic); });
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr.map(icon => ({ icon, matched: false }));
}

Page({
  data: {
    theme: 'sakura',
    role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, mySeat: 'red', turnSeat: 'red', myTurn: false,
    cards: [], myScore: 0, peerScore: 0, winner: null, winnerText: '',
    rulesOpen: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    this.setData({ mySeat: rt.seatOf(room.getRole()) });
    ident.bind(this, { onChange: () => this.applyState() });
  },
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'memory', s => { this._state = s; this.applyState(); });
  },
  onUnload() { rt.teardown(this); ident.teardown(this); if (this._flipTimer) clearTimeout(this._flipTimer); },

  applyState() {
    const s = this._state, role = this.data.role;
    if (!s || !s.cards) { this.setData({ started: false }); return; }
    const open = s.open || [];
    const cards = s.cards.map((c, i) => ({ icon: c.icon, matched: c.matched, up: c.matched || open.includes(i) }));
    const mySeat = rt.seatOf(role);
    const myScore = (s.scores && s.scores[mySeat]) || 0;
    const peerScore = (s.scores && s.scores[rt.peerSeatOf(role)]) || 0;
    const winner = s.winner || null;
    const names = {}; names[role] = this.data.myName; names[this.data.peer] = this.data.peerName;
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 赢了';
    this.setData({ started: true, cards, turnSeat: s.turn, myTurn: !winner && s.turn === mySeat, myScore, peerScore, winner, winnerText });
  },

  startMatch() {
    rt.setState('memory', { cards: buildCards(), open: [], turn: rt.RED, scores: { red: 0, blue: 0 }, winner: null });
  },
  restart() { this.startMatch(); },
  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); },

  flipCard(e) {
    if (!this.data.myTurn || this.data.winner) return;
    const i = e.currentTarget.dataset.i;
    const s = this._state;
    if (!s || !s.cards) return;
    const open = (s.open || []).slice();
    if (open.length >= 2 || open.includes(i) || s.cards[i].matched) return;
    open.push(i);

    if (open.length === 2) {
      // 展示两张
      rt.setState('memory', { cards: s.cards, open, scores: s.scores, turn: s.turn, winner: null });
      if (s.cards[open[0]].icon === s.cards[open[1]].icon) {
        // 配对成功：标记 matched + 加分 + 同方继续
        const cards = s.cards.map((c, idx) => (idx === open[0] || idx === open[1]) ? { icon: c.icon, matched: true } : c);
        const scores = Object.assign({}, s.scores);
        scores[s.turn] = (scores[s.turn] || 0) + 1;
        let winner = null;
        if (cards.every(c => c.matched)) winner = scores.red > scores.blue ? rt.RED : (scores.blue > scores.red ? rt.BLUE : 'draw');
        if (this._flipTimer) { clearTimeout(this._flipTimer); this._flipTimer = null; }
        rt.setState('memory', { cards, open: [], scores, turn: s.turn, winner });
        if (winner) toast('对局结束');
      } else {
        // 不配对：900ms 后翻回 + 换手（由当前回合方负责计时与写入，避免双方冲突）
        const me = this;
        if (this._flipTimer) clearTimeout(this._flipTimer);
        this._flipTimer = setTimeout(() => {
          rt.setState('memory', { cards: s.cards, open: [], scores: s.scores, turn: rt.peerSeatOf(room.getRole()), winner: null });
          me._flipTimer = null;
        }, 900);
      }
    } else {
      rt.setState('memory', { cards: s.cards, open, scores: s.scores, turn: s.turn, winner: null });
    }
  }
});
