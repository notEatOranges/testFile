// drawguess —— 你画我猜（功能7，回合制双人）
// 数据：games/dg/round={word,hint,drawer,drawing,state,winner,ts}；games/dg/scores={boy,girl}
// 流程：A 当画手抽词画图→提交(上传图)→B 看图猜→猜对得分→下一局换画手。回合制避开高频轨迹同步。
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const ident = require('@utils/ident.js');
const dg = require('@utils/dgWords.js');
const { peerRole, toast } = require('@utils/util.js');

const COLORS = ['#e85a86', '#3a86ff', '#06d6a0', '#ffb703', '#3c3a32'];

Page({
  data: {
    theme: 'sakura',
    role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    mode: 'idle',          // idle | drawing(我画) | wait(等ta画) | submitted(我已交,等猜) | guessing(我猜) | revealed
    isDrawer: false,
    word: '', showWord: '', hint: '',
    drawing: '',           // 画手提交的图 fileID（猜手展示）
    guess: '',
    winnerName: '',
    myScore: 0, peerScore: 0,
    color: '#e85a86', colors: COLORS,
    submitting: false, starting: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom();
    room.join();
    ident.bind(this, { onChange: () => this.applyRound() });
  },

  onShow() {
    if (this._ur) return;
    this._ur = Store.onValue('games/dg/round', r => { this._round = r || null; this.applyRound(); });
    this._us = Store.onValue('games/dg/scores', s => {
      const role = this.data.role, peer = this.data.peer;
      this._scores = s || {};
      this.setData({ myScore: (s && s[role]) || 0, peerScore: (s && s[peer]) || 0 });
    });
  },
  onUnload() {
    if (this._ur) { this._ur(); this._ur = null; }
    if (this._us) { this._us(); this._us = null; }
    ident.teardown(this);
  },

  applyRound() {
    const r = this._round, role = this.data.role;
    const names = {}; names[role] = this.data.myName; names[this.data.peer] = this.data.peerName;
    if (!r || !r.drawer || r.state === 'revealed') {
      const revealed = r && r.state === 'revealed';
      this.setData({
        mode: revealed ? 'revealed' : 'idle',
        isDrawer: false, word: '', showWord: revealed ? (r.word || '') : '',
        hint: revealed ? (r.hint || '') : '', drawing: revealed ? (r.drawing || '') : '',
        winnerName: revealed ? (names[r.winner] || (r.winner ? 'ta' : '没人猜对')) : '',
        guess: ''
      });
      return;
    }
    const isDrawer = r.drawer === role;
    if (r.state === 'drawing') {
      this.setData({
        mode: isDrawer ? 'drawing' : 'wait',
        isDrawer, word: isDrawer ? (r.word || '') : '', showWord: '', hint: r.hint || '', drawing: '', guess: ''
      });
      if (isDrawer) this.setupDraw();
    } else { // guessing
      this.setData({
        mode: isDrawer ? 'submitted' : 'guessing',
        isDrawer, word: isDrawer ? (r.word || '') : '', showWord: '', hint: r.hint || '',
        drawing: r.drawing || '', guess: ''
      });
    }
  },

  // —— 画手 ——
  async startAsDrawer() {
    const w = dg.rand();
    this.setData({ starting: true });
    await Store.set('games/dg/round', { word: w.w, hint: w.h, drawer: room.getRole(), drawing: '', state: 'drawing', winner: null, ts: Store.now() });
    this.setData({ starting: false });
  },
  setupDraw() {
    if (this._drawReady) { this.clearCanvas(); return; }
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this)
      .select('#drawCanvas').fields({ node: true, size: true, rect: true }).exec(res => {
        if (!res[0]) return;
        const cv = res[0].node, w = res[0].width, h = res[0].height;
        cv.width = w * dpr; cv.height = h * dpr;
        const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
        this.cv = cv; this.ctx = ctx; this.cw = w; this.ch = h; this.rect = { left: res[0].left, top: res[0].top };
        this._drawReady = true;
        this.clearCanvas();
      });
  },
  clearCanvas() {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#ffffff'; this.ctx.fillRect(0, 0, this.cw, this.ch);
  },
  pickColor(e) { this.setData({ color: e.currentTarget.dataset.c }); },
  drawStart(e) { const t = e.touches[0]; this.lastPt = { x: t.clientX - this.rect.left, y: t.clientY - this.rect.top }; },
  drawMove(e) {
    if (!this.ctx || !this.lastPt) return;
    const t = e.touches[0];
    const x = t.clientX - this.rect.left, y = t.clientY - this.rect.top;
    const ctx = this.ctx;
    ctx.strokeStyle = this.data.color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(this.lastPt.x, this.lastPt.y); ctx.lineTo(x, y); ctx.stroke();
    this.lastPt = { x, y };
  },
  drawEnd() { this.lastPt = null; },
  async submitDrawing() {
    if (!this.cv) return;
    this.setData({ submitting: true });
    try {
      const tmp = await new Promise((res, rej) => wx.canvasToTempFilePath({ canvas: this.cv, success: x => res(x.tempFilePath), fail: rej }, this));
      const cloudPath = `drawguess/${room.getRoom() || 'free'}/${Date.now()}.jpg`;
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: tmp });
      await Store.update('games/dg/round', { drawing: up.fileID, state: 'guessing' });
      toast('已提交，等 ta 猜');
    } catch (e) {
      console.warn('[dg] submit fail', e);
      toast('提交失败，重试');
    }
    this.setData({ submitting: false });
  },
  async giveUp() {
    await Store.update('games/dg/round', { state: 'revealed', winner: null });
  },

  // —— 猜手 ——
  onGuess(e) { this.setData({ guess: e.detail.value }); },
  async submitGuess() {
    const g = (this.data.guess || '').trim();
    if (!g) return toast('写个答案呀');
    const r = this._round;
    if (!r) return;
    if (g === r.word) {
      const role = room.getRole();
      const scores = Object.assign({}, this._scores || {});
      scores[role] = (scores[role] || 0) + 1;
      await Store.update('games/dg/scores', scores);
      await Store.update('games/dg/round', { state: 'revealed', winner: role });
      toast('猜对啦 +1');
    } else {
      toast('再猜猜～');
      this.setData({ guess: '' });
    }
  },

  // —— 下一局：换画手（当前画手的对方）——
  async nextRound() {
    const r = this._round;
    const drawer = (r && r.drawer) ? peerRole(r.drawer) : room.getRole();
    const w = dg.rand();
    await Store.set('games/dg/round', { word: w.w, hint: w.h, drawer, drawing: '', state: 'drawing', winner: null, ts: Store.now() });
  }
});
