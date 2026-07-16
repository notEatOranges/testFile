// drawguess —— 你画我猜（自由模式，双人实时联机）
// 不存图片（对方可能没开云存储），改存“笔画矢量数据”，对方端用 canvas 反向重绘。
// 数据：
//   games/dg/drawings = { id: { by, word, hint, strokes:[{c,w,pts:[[x,y]…]}], winner, ts } }  pts 归一化 0~1
//   games/dg/scores   = { boy, girl }
// 自由：任意一方随时“我来画”→画完即发；双方都能对任意画作猜测；画与猜不互锁。
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const ident = require('@utils/ident.js');
const dg = require('@utils/dgWords.js');
const { toast } = require('@utils/util.js');

const QUICK = ['#3c3a32', '#e85a86', '#3a86ff', '#06d6a0', '#ffb703', '#9b7fd4'];
const WIDTHS = [4, 9, 16];
const REN = 320;   // 反向重绘分辨率

function hsl2hex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const hex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + hex(f(0)) + hex(f(8)) + hex(f(4));
}

Page({
  data: {
    theme: 'sakura',
    role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    items: [], myScore: 0, peerScore: 0,
    // 画
    drawOpen: false, word: '', hint: '', wordMode: 'random', customWord: '',
    color: '#3c3a32', quick: QUICK, width: 9, widths: WIDTHS, hue: 20, tool: 'pen',
    submitting: false,
    // 猜
    guess: '',
    rulesOpen: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    ident.bind(this, { onChange: () => this.recompute() });
    this._img = {};   // id → 本地重绘后的 temp 图片路径
  },
  onShow() {
    if (this._ud) return;
    this._ud = Store.onList('games/dg/drawings', list => { this._raw = list || []; this.recompute(); });
    this._us = Store.onValue('games/dg/scores', s => {
      this._scores = s || {};
      const role = this.data.role, peer = this.data.peer;
      this.setData({ myScore: (s && s[role]) || 0, peerScore: (s && s[peer]) || 0 });
    });
  },
  onUnload() {
    if (this._ud) { this._ud(); this._ud = null; }
    if (this._us) { this._us(); this._us = null; }
    ident.teardown(this);
  },

  recompute() {
    const role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    const items = (this._raw || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).map(d => ({
      id: d.id, by: d.by, byMe: d.by === role,
      creatorName: names[d.by] || 'ta',
      word: d.word || '', hint: d.hint || '',
      winner: d.winner || null,
      winnerName: d.winner ? (names[d.winner] || 'ta') : '',
      src: this._img[d.id] || '',
      g: ''
    }));
    this.setData({ items });
    this.renderMissing();
  },

  // —— 反向重绘：把笔画数据画到隐藏 canvas，导出本地 temp 图（不走云存储）——
  renderMissing() {
    if (!this._rendererReady) { this.setupRenderer(() => this.renderMissing()); return; }
    if (this._rendering) return;
    const pending = (this._raw || []).filter(d => d.strokes && d.strokes.length && !this._img[d.id]);
    if (!pending.length) return;
    this._rendering = true;
    const drawOne = (i) => {
      if (i >= pending.length) { this._rendering = false; return; }
      const d = pending[i];
      this.drawStrokes(this._rctx, REN, d.strokes);
      wx.canvasToTempFilePath({
        canvas: this._rcv,
        success: res => {
          this._img[d.id] = res.tempFilePath;
          const idx = this.data.items.findIndex(it => it.id === d.id);
          if (idx >= 0) this.setData({ ['items[' + idx + '].src']: res.tempFilePath });
          drawOne(i + 1);
        },
        fail: () => { drawOne(i + 1); }
      });
    };
    drawOne(0);
  },
  setupRenderer(cb) {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#renderer').fields({ node: true, size: true }).exec(res => {
      if (!res[0] || !res[0].node) { setTimeout(() => this.setupRenderer(cb), 80); return; }
      const cv = res[0].node;
      cv.width = REN * dpr; cv.height = REN * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this._rcv = cv; this._rctx = ctx; this._rendererReady = true;
      if (cb) cb();
    });
  },
  drawStrokes(ctx, size, strokes) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    (strokes || []).forEach(s => {
      ctx.strokeStyle = s.c; ctx.lineWidth = s.w * (size / 100);   // w 按 100 基准缩放
      const pts = s.pts || [];
      if (!pts.length) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * size, pts[0][1] * size);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * size, pts[i][1] * size);
      ctx.stroke();
    });
  },

  // —— 画 ——
  openDraw() {
    const w = dg.rand();
    this.setData({ drawOpen: true, wordMode: 'random', word: w.w, hint: w.h, customWord: '', color: '#3c3a32', width: 9, hue: 20, tool: 'pen' });
    this._strokes = [];
    setTimeout(() => this.setupDrawCanvas(), 60);
  },
  closeDraw() { this.setData({ drawOpen: false }); },
  noop() {},
  rerollWord() { const w = dg.rand(); this.setData({ word: w.w, hint: w.h }); },
  switchWordMode(e) { this.setData({ wordMode: e.currentTarget.dataset.m }); },
  onCustomWord(e) { this.setData({ customWord: e.detail.value }); },

  setupDrawCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#drawCanvas').fields({ node: true, size: true, rect: true }).exec(res => {
      if (!res[0] || !res[0].node) { setTimeout(() => this.setupDrawCanvas(), 80); return; }
      const cv = res[0].node, w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this._dcv = cv; this._dctx = ctx; this._cw = w; this._ch = h;
      this._drect = { left: res[0].left, top: res[0].top };
      this.clearDraw();
    });
  },
  clearDraw() {
    this._strokes = [];
    if (this._dctx) { this._dctx.fillStyle = '#ffffff'; this._dctx.fillRect(0, 0, this._cw, this._ch); }
  },
  pickColor(e) { this.setData({ color: e.currentTarget.dataset.c, tool: 'pen' }); },
  pickWidth(e) { this.setData({ width: e.currentTarget.dataset.w }); },
  pickTool(e) { this.setData({ tool: e.currentTarget.dataset.t }); },
  onHue(e) { const hue = e.detail.value; this.setData({ hue, color: hsl2hex(hue, 70, 50), tool: 'pen' }); },

  drawStart(e) {
    if (!this._dctx) return;
    const t = e.touches[0];
    const x = (t.x != null ? t.x : t.clientX - (this._drect ? this._drect.left : 0));
    const y = (t.y != null ? t.y : t.clientY - (this._drect ? this._drect.top : 0));
    const eraser = this.data.tool === 'eraser';
    this._cur = { c: eraser ? '#ffffff' : this.data.color, w: eraser ? this.data.width * 2.4 : this.data.width, pts: [[x / this._cw, y / this._ch]] };
    this._last = { x, y };
  },
  drawMove(e) {
    if (!this._dctx || !this._cur) return;
    const t = e.touches[0];
    const x = (t.x != null ? t.x : t.clientX - (this._drect ? this._drect.left : 0));
    const y = (t.y != null ? t.y : t.clientY - (this._drect ? this._drect.top : 0));
    this._cur.pts.push([x / this._cw, y / this._ch]);
    const ctx = this._dctx;
    ctx.strokeStyle = this._cur.c; ctx.lineWidth = this._cur.w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(this._last.x, this._last.y); ctx.lineTo(x, y); ctx.stroke();
    this._last = { x, y };
  },
  drawEnd() { if (this._cur) { this._strokes.push(this._cur); this._cur = null; } },

  async submitDraw() {
    const word = (this.data.wordMode === 'custom' ? this.data.customWord : this.data.word).trim();
    if (!word) return toast('先填个词或换个词');
    if (!(this._strokes || []).length) return toast('先画两笔吧');
    this.setData({ submitting: true });
    await Store.push('games/dg/drawings', {
      by: room.getRole(), word, hint: this.data.wordMode === 'custom' ? '' : this.data.hint,
      strokes: this._strokes, winner: null, ts: Store.now()
    });
    this.setData({ submitting: false, drawOpen: false });
    toast('已发出，等 ta 猜');
  },

  // —— 猜（每幅画各自一个输入）——
  onCardGuess(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ ['items[' + idx + '].g']: e.detail.value });
  },
  async submitGuess(e) {
    const idx = e.currentTarget.dataset.idx;
    const it = this.data.items[idx];
    if (!it) return;
    const g = (it.g || '').trim();
    if (!g) return toast('写个答案呀');
    const d = (this._raw || []).find(x => x.id === it.id);
    if (!d) return;
    if (d.winner) return toast('这幅已被猜中啦');
    if (g === d.word) {
      const role = room.getRole();
      const scores = Object.assign({}, this._scores || {});
      scores[role] = (scores[role] || 0) + 1;
      await Store.update('games/dg/scores', scores);
      await Store.update('games/dg/drawings', { [it.id]: Object.assign({}, d, { winner: role }) });
      toast('猜对啦 +1');
      this.setData({ ['items[' + idx + '].g']: '' });
    } else {
      toast('再猜猜～');
    }
  },

  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); }
});
