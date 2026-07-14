// tetris —— 俄罗斯方块（Canvas 2d，按钮控制，关卡调速，最高分本地存）
const { getTheme } = require('@utils/themes.js');
const COLS = 10, ROWS = 20;
const BEST_KEY = 'gtetris_best';
const SPEEDS = [800, 720, 630, 550, 470, 380, 300, 220, 160, 120];
const PIECES = {
  I: { c: '#4cc9f0', m: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  O: { c: '#ffd166', m: [[1,1],[1,1]] },
  T: { c: '#b5179e', m: [[0,1,0],[1,1,1],[0,0,0]] },
  S: { c: '#06d6a0', m: [[0,1,1],[1,1,0],[0,0,0]] },
  Z: { c: '#ef476f', m: [[1,1,0],[0,1,1],[0,0,0]] },
  J: { c: '#3a86ff', m: [[1,0,0],[1,1,1],[0,0,0]] },
  L: { c: '#fb8500', m: [[0,0,1],[1,1,1],[0,0,0]] }
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
  onHide() { if (!this.data.over) this.pause(true); },
  onUnload() { this.stopLoop(); },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#board').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return;
      const cv = res[0].node, w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.bw = w; this.bh = h; this.cell = w / COLS;
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
  restart() { this.stopLoop(); this.newGame(); },

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

  left() { if (this.locked()) return; if (!this.collides(this.cur, 0, -1)) { this.cur.col--; this.draw(); } },
  right() { if (this.locked()) return; if (!this.collides(this.cur, 0, 1)) { this.cur.col++; this.draw(); } },
  rotate() { if (this.locked()) return; const m = rot(this.cur.m); if (!this.collides(this.cur, 0, 0, m)) { this.cur.m = m; this.draw(); } },
  softDrop() { if (this.locked()) return; this.step(true); this.draw(); },
  locked() { return this.data.over || this.data.paused; },

  step(manual) {
    if (this.collides(this.cur, 1, 0)) {
      this.lock();
      this.clearLines();
      this.spawn();
      this.draw();
      return;
    }
    this.cur.row++;
    if (manual) this.addScore(1);
    this.draw();
  },
  lock() {
    const m = this.cur.m;
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (m[r][c]) { const nr = this.cur.row + r, nc = this.cur.col + c; if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) this.board[nr][nc] = this.cur.c; }
    }
  },
  clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(v => v)) { this.board.splice(r, 1); this.board.unshift(Array(COLS).fill(0)); cleared++; r++; }
    }
    if (cleared) {
      const pts = [0, 100, 300, 500, 800][cleared] * this.data.level;
      this.addScore(pts);
      const lines = this.data.lines + cleared;
      const level = Math.floor(lines / 10) + 1;
      const levelChanged = level !== this.data.level;
      this.setData({ lines, level });
      if (levelChanged) this.startLoop(level);
    }
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
  },
  stopLoop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
  togglePause() {
    if (this.data.over) return;
    const paused = !this.data.paused;
    this.setData({ paused });
    if (paused) this.stopLoop(); else this.startLoop();
  },
  gameOver() { this.stopLoop(); this.setData({ over: true }); },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.bw, H = this.bh, cell = this.cell, th = getTheme(this.data.theme);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = th.bg2; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, H); ctx.stroke(); }
    for (let j = 1; j < ROWS; j++) { ctx.beginPath(); ctx.moveTo(0, j * cell); ctx.lineTo(W, j * cell); ctx.stroke(); }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (this.board[r][c]) this.drawCell(ctx, c, r, this.board[r][c], cell);
    if (this.cur) {
      const m = this.cur.m;
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) if (m[r][c]) { const nr = this.cur.row + r, nc = this.cur.col + c; if (nr >= 0) this.drawCell(ctx, nc, nr, this.cur.c, cell); }
    }
  },
  drawCell(ctx, c, r, color, cell) {
    const x = c * cell, y = r * cell, pad = Math.max(1, cell * 0.06);
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
