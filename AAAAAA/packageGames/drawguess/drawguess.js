// drawguess —— 你画我猜（一局 3 张：画手画 3 个词，猜手堆叠卡片逐张猜，完整历史归档）
// 数据：
//   games/dg/round   = { drawer, phase:'draw'|'guess'|'reveal', words:[{w,h}x3], items:[{word,hint,drawing,winner}], idx, ts }
//   games/dg/scores  = { boy, girl }
//   games/dg/history = [ { drawer, items, ts } ]   reveal 时归档，可回看画作
// 关键：词库 words 与每张画都即时写进 round（持久化），断线/刷新/对方进入都不丢、不卡死。
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
    if (!r || !r.drawer || !r.phase) { this.setData({ mode: 'idle', isDrawer: false }); return; }
    if (r.phase === 'reveal') {
      this.setData({
        mode: 'revealed', isDrawer: false,
        revealItems: (r.items || []).map((it, i) => ({ word: it.word, hint: it.hint, drawing: it.drawing, winner: it.winner, idx: i })),
        revealDrawer: r.drawer === role ? this.data.myName : this.data.peerName
      });
      return;
    }
    const isDrawer = r.drawer === role;
    if (r.phase === 'guess') {
      if (isDrawer) { this.setData({ mode: 'submitted', isDrawer: true }); return; }
      const items = r.items || [];
      const deck = items.map((it, i) => ({ word: it.word, drawing: it.drawing, idx: i })).filter(it => !(items[it.idx].winner));
      this.setData({ mode: 'guessing', isDrawer: false, deck, deckTop: deck[0] || null, deckRest: deck.slice(1), topDx: 0, guess: '' });
      return;
    }
    // phase 'draw'
    if (isDrawer) {
      const idx = r.idx || 0;
      const w = (r.words && r.words[idx]) || {};
      this.setData({ mode: 'drawing', isDrawer: true, drawIdx: idx, word: w.w || '', hint: w.h || '' });
      this.setupDraw();
    } else {
      this.setData({ mode: 'wait', isDrawer: false });
    }
  },

  // —— 画手 ——
  async startAsDrawer() {
    const words = [dg.rand(), dg.rand(), dg.rand()];
    this.setData({ starting: true });
    await Store.set('games/dg/round', { drawer: room.getRole(), phase: 'draw', words, items: [], idx: 0, ts: Store.now() });
    this.setData({ starting: false });
  },
  setupDraw() {
    if (this._drawReady) { this.clearCanvas(); return; }
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#drawCanvas').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return;
      const cv = res[0].node, w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.cv = cv; this.ctx = ctx; this.cw = w; this.ch = h;
      this.rect = { left: 0, top: 0 };   // 画布内触点是 canvas 相对坐标，无需页面偏移
      this._drawReady = true; this.clearCanvas();
    });
  },
  clearCanvas() { if (!this.ctx) return; this.ctx.fillStyle = '#ffffff'; this.ctx.fillRect(0, 0, this.cw, this.ch); },
  pickColor(e) { this.setData({ color: e.currentTarget.dataset.c, tool: 'pen' }); },
  pickTool(e) { this.setData({ tool: e.currentTarget.dataset.tool }); },
  pickStroke(e) { this.setData({ strokeW: e.currentTarget.dataset.w, tool: 'pen' }); },
  drawStart(e) { const t = e.touches[0]; const x = t.x != null ? t.x : t.clientX; const y = t.y != null ? t.y : t.clientY; this.lastPt = { x, y }; this.lastMid = { x, y }; },
  drawMove(e) {
    if (!this.ctx || !this.lastPt) return;
    const t = e.touches[0];
    const x = t.x != null ? t.x : t.clientX, y = t.y != null ? t.y : t.clientY;
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

  // 画完当前张 → 上传并写进 round.items → 推进 idx 或进入 guess
  async nextDrawing() {
    if (!this.cv || this.data.submitting) return;
    const r = this._round;
    if (!r || r.phase !== 'draw') return;
    const idx = r.idx || 0;
    const wObj = (r.words && r.words[idx]) || {};
    this.setData({ submitting: true });
    let fileID = '';
    try {
      const tmp = await new Promise((res, rej) => wx.canvasToTempFilePath({ canvas: this.cv, success: x => res(x.tempFilePath), fail: rej }, this));
      const cloudPath = `drawguess/${room.getRoom() || 'free'}/${Date.now()}_${idx}.jpg`;
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: tmp });
      fileID = up.fileID;
    } catch (e) {
      console.warn('[dg] 上传失败', e);
      this.setData({ submitting: false });
      toast('这张没上传成功，再点一次重试');
      return;
    }
    const items = (r.items || []).slice();
    items[idx] = { word: wObj.w || '', hint: wObj.h || '', drawing: fileID, winner: null };
    const nextIdx = idx + 1;
    if (nextIdx >= ROUND_SIZE) {
      await Store.set('games/dg/round', Object.assign({}, r, { phase: 'guess', items, ts: Store.now() }));
      toast('3 张已提交，等 ta 猜');
    } else {
      await Store.set('games/dg/round', Object.assign({}, r, { items, idx: nextIdx, ts: Store.now() }));
      this.clearCanvas();
    }
    this.setData({ submitting: false });
  },
  async giveUp() { await this.reveal(); },

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
      await Store.update('games/dg/round', { items });
      toast('猜对啦 +1');
      if (items.every(it => it.winner)) await this.reveal();
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
    await Store.set('games/dg/round', Object.assign({}, r, { phase: 'reveal', items, ts: Store.now() }));
    await Store.push('games/dg/history', { drawer: r.drawer, items, ts: Store.now() });
  },

  // —— 下一局（换画手）——
  async nextRound() {
    const words = [dg.rand(), dg.rand(), dg.rand()];
    const drawer = peerRole((this._round || {}).drawer || room.getRole());
    await Store.set('games/dg/round', { drawer, phase: 'draw', words, items: [], idx: 0, ts: Store.now() });
  },

  noop() {},
  openHistory() { this.setData({ historyOpen: true }); },
  closeHistory() { this.setData({ historyOpen: false }); }
});
