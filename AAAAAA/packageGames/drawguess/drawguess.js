// drawguess —— 你画我猜（一局 3 张：画手画 3 个词，猜手堆叠卡片逐张猜，完整历史归档）
// 数据：
//   games/dg/round   = { drawer, state:'drawing'|'guessing'|'revealed', items:[{word,hint,drawing,winner}], ts }
//   games/dg/scores  = { boy, girl }
//   games/dg/history = [ { drawer, items, ts } ]   revealed 时归档，可回看画作
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const ident = require('@utils/ident.js');
const dg = require('@utils/dgWords.js');
const { peerRole, toast } = require('@utils/util.js');

const COLORS = ['#e85a86', '#3a86ff', '#06d6a0', '#ffb703', '#3c3a32'];
const ROUND_SIZE = 3;

Page({
  data: {
    theme: 'sakura',
    role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    mode: 'idle',            // idle | drawing | wait | submitted | guessing | revealed
    isDrawer: false,
    drawIdx: 0, word: '', hint: '',
    deck: [], deckTop: null, deckRest: [], topDx: 0, guess: '',
    revealItems: [], revealDrawer: '',
    myScore: 0, peerScore: 0,
    color: '#e85a86', colors: COLORS,
    tool: 'pen', strokeW: 8, strokeWs: [4, 8, 14],
    submitting: false, starting: false,
    historyOpen: false, history: []
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
      this._scores = s || {};
      const role = this.data.role, peer = this.data.peer;
      this.setData({ myScore: (s && s[role]) || 0, peerScore: (s && s[peer]) || 0 });
    });
    this._uh = Store.onList('games/dg/history', h => {
      const list = (h || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
      list.forEach(it => {
        const d = new Date(it.ts || 0);
        it.timeText = (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        (it.items || []).forEach((x, i) => { x.idx = i; });
      });
      this.setData({ history: list });
    });
  },
  onUnload() {
    if (this._ur) { this._ur(); this._ur = null; }
    if (this._us) { this._us(); this._us = null; }
    if (this._uh) { this._uh(); this._uh = null; }
    ident.teardown(this);
  },

  applyRound() {
    const r = this._round, role = this.data.role;
    if (!r || !r.drawer) { this.setData({ mode: 'idle', isDrawer: false }); return; }
    if (r.state === 'revealed') {
      this.setData({ mode: 'revealed', isDrawer: false, revealItems: (r.items || []).map((it, i) => ({ word: it.word, hint: it.hint, drawing: it.drawing, winner: it.winner, idx: i })), revealDrawer: r.drawer === role ? this.data.myName : this.data.peerName });
      return;
    }
    const isDrawer = r.drawer === role;
    if (r.state === 'guessing') {
      if (isDrawer) {
        this.setData({ mode: 'submitted', isDrawer: true });
      } else {
        const items = r.items || [];
        const deck = items.map((it, i) => ({ word: it.word, drawing: it.drawing, idx: i })).filter(it => !(r.items[it.idx].winner === role));
        this.setData({ mode: 'guessing', isDrawer: false, deck, deckTop: deck[0] || null, deckRest: deck.slice(1), topDx: 0, guess: '' });
      }
      return;
    }
    // drawing：画手本地画（云里 items 为空），对方 wait
    if (isDrawer) {
      const idx = this.data.drawIdx || 0;
      const w = this._words && this._words[idx];
      this.setData({ mode: 'drawing', isDrawer: true, drawIdx: idx, word: (w && w.w) || '', hint: (w && w.h) || '' });
      this.setupDraw();
    } else {
      this.setData({ mode: 'wait', isDrawer: false });
    }
  },

  // —— 画手 ——
  async startAsDrawer() {
    this._words = [dg.rand(), dg.rand(), dg.rand()];
    this._drawings = [];
    this.setData({ starting: true });
    await Store.set('games/dg/round', { drawer: room.getRole(), state: 'drawing', items: [], ts: Store.now() });
    this.setData({ starting: false, mode: 'drawing', isDrawer: true, drawIdx: 0, word: this._words[0].w, hint: this._words[0].h });
    this.setupDraw();
  },
  setupDraw() {
    if (this._drawReady) { this.clearCanvas(); return; }
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#drawCanvas').fields({ node: true, size: true, rect: true }).exec(res => {
      if (!res[0]) return;
      const cv = res[0].node, w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.cv = cv; this.ctx = ctx; this.cw = w; this.ch = h; this.rect = { left: res[0].left, top: res[0].top };
      this._drawReady = true; this.clearCanvas();
    });
  },
  clearCanvas() { if (!this.ctx) return; this.ctx.fillStyle = '#ffffff'; this.ctx.fillRect(0, 0, this.cw, this.ch); },
  pickColor(e) { this.setData({ color: e.currentTarget.dataset.c, tool: 'pen' }); },
  pickTool(e) { this.setData({ tool: e.currentTarget.dataset.tool }); },
  pickStroke(e) { this.setData({ strokeW: e.currentTarget.dataset.w, tool: 'pen' }); },
  drawStart(e) { const t = e.touches[0]; this.lastPt = { x: t.clientX - this.rect.left, y: t.clientY - this.rect.top }; this.lastMid = this.lastPt; },
  drawMove(e) {
    if (!this.ctx || !this.lastPt) return;
    const t = e.touches[0];
    const x = t.clientX - this.rect.left, y = t.clientY - this.rect.top;
    const mid = { x: (this.lastPt.x + x) / 2, y: (this.lastPt.y + y) / 2 };
    const ctx = this.ctx;
    const eraser = this.data.tool === 'eraser';
    ctx.strokeStyle = eraser ? '#ffffff' : this.data.color;
    ctx.lineWidth = eraser ? 26 : this.data.strokeW;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.lastMid.x, this.lastMid.y);
    ctx.quadraticCurveTo(this.lastPt.x, this.lastPt.y, mid.x, mid.y);
    ctx.stroke();
    this.lastPt = { x, y }; this.lastMid = mid;
  },
  drawEnd() { this.lastPt = null; this.lastMid = null; },

  // 画完当前张 → 上传暂存 → 下一张或全部提交
  async nextDrawing() {
    if (!this.cv) return;
    const idx = this.data.drawIdx;
    const w = this._words[idx];
    this.setData({ submitting: true });
    try {
      const tmp = await new Promise((res, rej) => wx.canvasToTempFilePath({ canvas: this.cv, success: x => res(x.tempFilePath), fail: rej }, this));
      const cloudPath = `drawguess/${room.getRoom() || 'free'}/${Date.now()}_${idx}.jpg`;
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: tmp });
      this._drawings.push({ word: w.w, hint: w.h, drawing: up.fileID });
    } catch (e) {
      toast('这张上传失败，重试');
      this.setData({ submitting: false });
      return;
    }
    this.setData({ submitting: false });
    const next = idx + 1;
    if (next >= ROUND_SIZE) {
      await this.submitAll();
    } else {
      this.setData({ drawIdx: next, word: this._words[next].w, hint: this._words[next].h });
      this.clearCanvas();
    }
  },
  async submitAll() {
    await Store.set('games/dg/round', { drawer: room.getRole(), state: 'guessing', items: this._drawings, ts: Store.now() });
    this.setData({ mode: 'submitted', isDrawer: true });
    toast('3 张已提交，等 ta 猜');
  },
  async giveUp() { await this.reveal(); },   // 画手公布答案

  // —— 猜手：堆叠卡片逐张猜 ——
  onGuess(e) { this.setData({ guess: e.detail.value }); },
  async submitGuess() {
    const g = (this.data.guess || '').trim();
    const top = this.data.deckTop;
    if (!top) return;
    if (!g) return toast('写个答案呀');
    if (g === top.word) {
      const role = room.getRole();
      const scores = Object.assign({}, this._scores || {});
      scores[role] = (scores[role] || 0) + 1;
      await Store.update('games/dg/scores', scores);
      const r = this._round;
      const items = (r.items || []).slice();
      items[top.idx] = Object.assign({}, items[top.idx], { winner: role });
      await Store.update('games/dg/round', { items });       // 触发 applyRound 重建 deck（猜对的被滤掉）
      toast('猜对啦 +1');
      if (items.every(it => it.winner)) await this.reveal();  // 全猜完 → 揭晓归档
    } else {
      toast('再猜猜～');
      this.setData({ guess: '' });
    }
  },
  onDeckTouchStart(e) { this._dx0 = e.touches[0].clientX; this._swiped = false; },
  onDeckTouchMove(e) { const dx = e.touches[0].clientX - this._dx0; if (Math.abs(dx) > 12) this._swiped = true; this.setData({ topDx: dx }); },
  onDeckTouchEnd() {
    const dx = this.data.topDx;
    if (Math.abs(dx) > 80 && this.data.deck.length > 1) {
      this.setData({ topDx: dx > 0 ? 1000 : -1000 });
      setTimeout(() => { this.switchDeck(); this.setData({ topDx: 0, guess: '' }); }, 240);
    } else {
      this.setData({ topDx: 0 });
    }
  },
  switchDeck() {
    const d = this.data.deck;
    if (d.length < 2) return;
    const nd = [...d.slice(1), d[0]];
    this.setData({ deck: nd, deckTop: nd[0], deckRest: nd.slice(1) });
  },
  async giveUpGuess() { await this.reveal(); },

  // —— 揭晓 + 归档历史 ——
  async reveal() {
    const r = this._round;
    if (!r) return;
    const items = r.items || [];
    await Store.set('games/dg/round', { drawer: r.drawer, state: 'revealed', items, ts: Store.now() });
    await Store.push('games/dg/history', { drawer: r.drawer, items, ts: Store.now() });
  },

  // —— 下一局（换画手）——
  async nextRound() {
    const drawer = peerRole((this._round || {}).drawer || room.getRole());
    this._words = [dg.rand(), dg.rand(), dg.rand()];
    this._drawings = [];
    this.setData({ drawIdx: 0 });
    await Store.set('games/dg/round', { drawer, state: 'drawing', items: [], ts: Store.now() });
  },

  noop() {},
  openHistory() { this.setData({ historyOpen: true }); },
  closeHistory() { this.setData({ historyOpen: false }); }
});
