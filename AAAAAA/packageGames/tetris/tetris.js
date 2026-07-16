// tetris —— 俄罗斯方块（Canvas 2d，干净标准版）
// 单循环：setInterval 驱动下落；落定即锁、立即消行；rAF 只负责渲染（含 ghost 影）。
// 参考主流开源实现，避免平滑插值/两段消行动画带来的卡顿与时机 bug。
const { getTheme } = require('@utils/themes.js');
const { Store } = require('@utils/store.js');
const room = require('@utils/room.js');
const COLS = 10, ROWS = 20;
const BEST_KEY = 'gtetris_best';
const SPEEDS = [800, 720, 630, 550, 470, 380, 300, 220, 160, 120];
// 柔和马卡龙配色（降低饱和度，不再刺眼），7 种仍可区分
const PIECES = {
  I: { c: '#7fb8c4', m: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  O: { c: '#e8c870', m: [[1,1],[1,1]] },
  T: { c: '#b08bd9', m: [[0,1,0],[1,1,1],[0,0,0]] },
  S: { c: '#7fc8a8', m: [[0,1,1],[1,1,0],[0,0,0]] },
  Z: { c: '#e89aab', m: [[1,1,0],[0,1,1],[0,0,0]] },
  J: { c: '#7fa8d9', m: [[1,0,0],[1,1,1],[0,0,0]] },
  L: { c: '#e8a87c', m: [[0,0,1],[1,1,1],[0,0,0]] }
};
const KEYS = Object.keys(PIECES);

Page({
  data: { theme: 'sakura', score: 0, best: 0, lines: 0, level: 1, over: false, paused: false },

  onReady() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    this.best = wx.getStorageSync(BEST_KEY) || 0;
    this.setData({ best: this.best });
    this.setupCanvas();
  },
  onHide() { if (!this.data.over) this.pause(); },
  onUnload() { this.stopLoop(); this.stopRaf(); },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#board').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return;
      const cv = res[0].node, w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.cv = cv; this.bw = w; this.bh = h;
      this.cell = Math.min(w / COLS, h / ROWS);   // 适配容器，保持 1:2，居中绘制
      this.ox = (w - COLS * this.cell) / 2;
      this.oy = (h - ROWS * this.cell) / 2;
      this.newGame();
    });
  },

  newGame() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.setData({ score: 0, lines: 0, level: 1, over: false, paused: false });
    this.next = this.randPiece();
    this.spawn();
    this.draw();
    this.startLoop();
  },
  restart() { this.stopLoop(); this.stopRaf(); this.newGame(); },

  randPiece() { const k = KEYS[Math.floor(Math.random() * KEYS.length)]; return { type: k, m: PIECES[k].m.map(r => r.slice()), c: PIECES[k].c }; },
  spawn() {
    this.cur = this.next; this.next = this.randPiece();
    this.cur.row = 0; this.cur.col = Math.floor((COLS - this.cur.m[0].length) / 2);
    if (this.collides(this.cur, 0, 0)) this.gameOver();
  },
  collides(p, dr, dc, m) {
    m = m || p.m;
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const nr = p.row + r + dr, nc = p.col + c + dc;
      if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
      if (nr >= 0 && this.board[nr][nc]) return true;
    }
    return false;
  },

  left() { if (this.locked()) return; if (!this.collides(this.cur, 0, -1)) this.cur.col--; },
  right() { if (this.locked()) return; if (!this.collides(this.cur, 0, 1)) this.cur.col++; },
  rotate() { if (this.locked()) return; const m = rot(this.cur.m); if (!this.collides(this.cur, 0, 0, m)) this.cur.m = m; },
  softDrop() { if (this.locked()) return; this.step(true); },
  hardDrop() {
    if (this.locked()) return;
    let dr = 0;
    while (!this.collides(this.cur, dr + 1, 0)) dr++;
    if (dr > 0) { this.cur.row += dr; this.addScore(dr * 2); }
    this.lockAndClear();
  },
  locked() { return this.data.over || this.data.paused; },

  step(manual) {
    if (this.collides(this.cur, 1, 0)) { this.lockAndClear(); return; }
    this.cur.row++;
    if (manual) this.addScore(1);
  },
  lockAndClear() {
    // 锁定当前块
    const m = this.cur.m;
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (m[r][c]) { const nr = this.cur.row + r, nc = this.cur.col + c; if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) this.board[nr][nc] = this.cur.c; }
    }
    // 立即消除满行
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(v => v)) { this.board.splice(r, 1); this.board.unshift(Array(COLS).fill(0)); cleared++; r++; }
    }
    if (cleared) {
      this.addScore([0, 100, 300, 500, 800][cleared] * this.data.level);
      const lines = this.data.lines + cleared;
      const level = Math.floor(lines / 10) + 1;
      const levelChanged = level !== this.data.level;
      this.setData({ lines, level });
      if (levelChanged) this.startLoop(level);
    }
    this.spawn();
    if (this.data.over) this.stopLoop();
  },

  addScore(n) {
    const score = this.data.score + n;
    this.setData({ score });
    if (score > this.best) { this.best = score; wx.setStorageSync(BEST_KEY, this.best); this.setData({ best: this.best }); }
  },

  startLoop(level) {
    this.stopLoop();
    const lv = Math.min((level || this.data.level) - 1, SPEEDS.length - 1);
    this.timer = setInterval(() => this.step(false), SPEEDS[lv]);
    this.ensureRaf();
  },
  stopLoop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
  ensureRaf() {
    if (this._raf) return;
    const tick = () => { this._raf = this.cv.requestAnimationFrame(tick); this.draw(); };
    this._raf = this.cv.requestAnimationFrame(tick);
  },
  stopRaf() { if (this._raf && this.cv) { this.cv.cancelAnimationFrame(this._raf); this._raf = null; } },

  pause() { if (this.data.over) return; this.setData({ paused: true }); this.stopLoop(); this.stopRaf(); },
  togglePause() {
    if (this.data.over) return;
    if (this.data.paused) { this.setData({ paused: false }); this.startLoop(); } else this.pause();
  },

  gameOver() {
    if (this.data.over) return;
    this.stopLoop(); this.stopRaf(); this.setData({ over: true });
    const score = this.data.score;
    if (score) Store.push('gameScores', { game: 'tetris', role: room.getRole() || 'boy', score, ts: Store.now() });
  },
  finishGame() { if (this.data.over) return; this.gameOver(); wx.showToast({ title: '已记入成绩榜', icon: 'none' }); },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.bw, H = this.bh, cell = this.cell, ox = this.ox || 0, oy = this.oy || 0;
    const th = getTheme(this.data.theme);
    const color = th.primary;   // 单色，不再五颜六色
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = th.bg1; ctx.fillRect(0, 0, W, H);
    // 棋盘底（白色，无大黑边）
    ctx.fillStyle = '#ffffff'; ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + ROWS * cell); ctx.stroke(); }
    for (let j = 0; j <= ROWS; j++) { ctx.beginPath(); ctx.moveTo(ox, oy + j * cell); ctx.lineTo(ox + COLS * cell, oy + j * cell); ctx.stroke(); }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (this.board[r][c]) this.drawCell(ctx, ox + c * cell, oy + r * cell, color, cell);
    if (this.cur && !this.data.over) {
      let dr = 0; while (!this.collides(this.cur, dr + 1, 0)) dr++;
      ctx.globalAlpha = 0.18;
      const m = this.cur.m;
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) if (m[r][c]) { const nr = this.cur.row + dr + r, nc = this.cur.col + c; if (nr >= 0) this.drawCell(ctx, ox + nc * cell, oy + nr * cell, color, cell); }
      ctx.globalAlpha = 1;
    }
    if (this.cur) {
      const m = this.cur.m;
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) if (m[r][c]) { const nr = this.cur.row + r, nc = this.cur.col + c; if (nr >= 0) this.drawCell(ctx, ox + nc * cell, oy + nr * cell, color, cell); }
    }
  },
  drawCell(ctx, x, y, color, cell) {
    const pad = Math.max(1, cell * 0.06);
    ctx.fillStyle = color; roundRect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; roundRect(ctx, x + pad, y + pad, cell - pad * 2, (cell - pad * 2) / 2.6, 4); ctx.fill();
  }
});

function rot(m) { return m[0].map((_, i) => m.map(row => row[i]).reverse()); }
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
