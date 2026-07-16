// memory —— 记忆翻牌（功能8，双人实时联机）：翻 t-icon 配对，配对多者胜
// 状态 games/memory/state = { cards:[{icon,matched}], open:[i,j], turn, scores:{red,blue}, winner, req, ts }
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
const wait = ms => new Promise(r => setTimeout(r, ms));

Page({
  data: {
    theme: 'sakura',
    role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, mySeat: 'red', turnSeat: 'red', myTurn: false,
    cards: [], myScore: 0, peerScore: 0, winner: null, winnerText: '',
    requestPending: false, rulesOpen: false,
    rollFirst: { open: false, result: '' }
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

  fresh(first) { return { cards: buildCards(), open: [], turn: first || (Math.random() < 0.5 ? rt.RED : rt.BLUE), scores: { red: 0, blue: 0 }, winner: null, req: null }; },
  async startMatch() {
    this._recorded = false;
    const first = Math.random() < 0.5 ? rt.RED : rt.BLUE;
    this.setData({ rollFirst: { open: true, result: '' } });
    await wait(820);
    this.setData({ rollFirst: { open: true, result: first === this.data.mySeat ? 'me' : 'peer' } });
    await wait(950);
    this.setData({ rollFirst: { open: false, result: '' } });
    rt.setState('memory', this.fresh(first));
  },

  applyState() {
    const s = this._state, role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    const patch = {};
    // 重开请求握手
    const reqSide = rt.restartReqSide(s && s.req, role);
    patch.requestPending = reqSide === 'mine';
    if (reqSide === 'peer' && !this._restartPrompted) {
      this._restartPrompted = true;
      const me = this;
      wx.showModal({
        title: '重新开局请求', content: (names[s.req.by] || '对方') + ' 请求重新开局，同意？', confirmText: '同意', cancelText: '拒绝',
        success: r => { if (r.confirm) rt.acceptRestart('memory', () => me.fresh()); else rt.rejectRestart('memory', me._state); }
      });
    } else if (reqSide !== 'peer') {
      this._restartPrompted = false;
    }
    if (!s || !s.cards) { this.setData(Object.assign({ started: false }, patch)); return; }
    const open = s.open || [];
    const cards = s.cards.map((c, i) => ({ icon: c.icon, matched: c.matched, up: c.matched || open.includes(i) }));
    const mySeat = rt.seatOf(role);
    const myScore = (s.scores && s.scores[mySeat]) || 0;
    const peerScore = (s.scores && s.scores[rt.peerSeatOf(role)]) || 0;
    const winner = s.winner || null;
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 赢了';
    // 记入成绩榜（每个客户端各记一次）
    if (winner && !this._recorded) {
      this._recorded = true;
      rt.recordPvp('memory', rt.myResult(winner, mySeat), role);
    }
    Object.assign(patch, { started: true, cards, turnSeat: s.turn, myTurn: !winner && s.turn === mySeat, myScore, peerScore, winner, winnerText });
    this.setData(patch);
  },

  requestRestart() { rt.requestRestart('memory', this._state, room.getRole(), !!this.data.winner, () => this.fresh()); },
  cancelReq() { rt.cancelRestart('memory', this._state); },
  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({
      title: '认输', content: '确定认输吗？', confirmText: '认输', confirmColor: '#e85a86',
      success: r => { if (r.confirm) rt.resign('memory', this._state, room.getRole()); }
    });
  },

  flipCard(e) {
    if (!this.data.myTurn || this.data.winner) return;
    const i = e.currentTarget.dataset.i;
    const s = this._state;
    if (!s || !s.cards) return;
    const open = (s.open || []).slice();
    if (open.length >= 2 || open.includes(i) || s.cards[i].matched) return;
    open.push(i);

    if (open.length === 2) {
      if (s.cards[open[0]].icon === s.cards[open[1]].icon) {
        // 配对成功：直接结算（单次写入，避免与“展示”写入竞态导致不计分/卡死）
        const cards = s.cards.map((c, idx) => (idx === open[0] || idx === open[1]) ? { icon: c.icon, matched: true } : c);
        const scores = Object.assign({}, s.scores);
        scores[s.turn] = (scores[s.turn] || 0) + 1;
        let winner = null;
        if (cards.every(c => c.matched)) winner = scores.red > scores.blue ? rt.RED : (scores.blue > scores.red ? rt.BLUE : 'draw');
        rt.setState('memory', { cards, open: [], scores, turn: s.turn, winner, req: s.req });
      } else {
        // 不配对：先展示两张，900ms 后翻回换手（当前回合方负责计时写入）
        rt.setState('memory', { cards: s.cards, open, scores: s.scores, turn: s.turn, winner: null, req: s.req });
        const me = this; const peer = rt.peerSeatOf(room.getRole());
        if (this._flipTimer) clearTimeout(this._flipTimer);
        this._flipTimer = setTimeout(() => {
          rt.setState('memory', { cards: s.cards, open: [], scores: s.scores, turn: peer, winner: null, req: s.req });
          me._flipTimer = null;
        }, 900);
      }
    } else {
      rt.setState('memory', { cards: s.cards, open, scores: s.scores, turn: s.turn, winner: null, req: s.req });
    }
  },

  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); }
});
