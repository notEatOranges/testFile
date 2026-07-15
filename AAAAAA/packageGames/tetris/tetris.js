// tetris —— 俄罗斯方块（Canvas 2d，完整帧动画版）
// 双循环分层：setInterval 驱动离散步进下落（逻辑），rAF 驱动平滑渲染（视觉）
// 动画：平滑下落插值 + ghost 落点影 + 消行闪白/塌落两阶段 + 硬降 + 得分飘字
const { getTheme } = require('@utils/themes.js');
const { Store } = require('@utils/store.js');
const room = require('@utils/room.js');
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
  onHide() { if (!this.data.over) this.pause(); },
  onUnload() { this.stopLoop(); this.stopRaf(); },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#board').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return;
      const cv = res[0].node, w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.cv = cv; this.bw = w; this.bh = h; this.cell = w / COLS;
      this.newGame();
    });
  },

  newGame() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.clearing = null;
    this.scoreFloats = [];
    this._raf = null;
    this._stepInterval = SPEEDS[0];
    this._lastStepTs = Date.now();
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
    this._lastStepTs = Date.now();
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
    if (dr > 0) { this.cur.row += dr; this.addScore(dr * 2); this.pushFloat(dr * 2); }
    this._lastStepTs = Date.now();
    this.lock();
    if (!this.clearLines()) this.spawn();
  },
  locked() { return this.data.over || this.data.paused || !!this.clearing; },

  step(manual) {
    if (this.collides(this.cur, 1, 0)) {
      this.lock();
      if (this.clearLines()) return;   // 进入消行动画（已停 step），finishClear 里 spawn + 重启
      this.spawn();
      return;
    }
    this.cur.row++;
    if (manual) this.addScore(1);
    this._lastStepTs = Date.now();
  },
  lock() {
    const m = this.cur.m;
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (m[r][c]) { const nr = this.cur.row + r, nc = this.cur.col + c; if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) this.board[nr][nc] = this.cur.c; }
    }
  },
  clearLines() {
    const full = [];
    for (let r = ROWS - 1; r >= 0; r--) if (this.board[r].every(v => v)) full.push(r);
    if (!full.length) return false;
    this.clearing = {
      rows: full, phase: 'flash', t0: Date.now(), flashDur: 180, collapseDur: 220,
      pendingScore: [0, 100, 300, 500, 800][full.length] * this.data.level,
      pendingLines: this.data.lines + full.length
    };
    this.stopStepTimer();   // 暂停下落逻辑，rAF 继续画消行动画
    return true;
  },
  finishClear() {
    const c = this.clearing;
    const rows = c.rows.slice().sort((a, b) => a - b);
    for (let i = rows.length - 1; i >= 0; i--) { this.board.splice(rows[i], 1); this.board.unshift(Array(COLS).fill(0)); }
    this.addScore(c.pendingScore);
    this.pushFloat(c.pendingScore);
    const lines = c.pendingLines;
    const level = Math.floor(lines / 10) + 1;
    const levelChanged = level !== this.data.level;
    this.setData({ lines, level });
    this.clearing = null;
    this.spawn();
    if (this.data.over) return;   // spawn 触发了 gameOver（顶部已堆满），不再重启循环
    this.startLoop(levelChanged ? level : this.data.level);
  },

  addScore(n) {
    const score = this.data.score + n;
    this.setData({ score });
    if (score > this.best) { this.best = score; wx.setStorageSync(BEST_KEY, this.best); this.setData({ best: this.best }); }
  },
  pushFloat(val) { if (val) this.scoreFloats.push({ val, t0: Date.now(), dur: 700 }); },

  // —— 双循环：setInterval(逻辑) + rAF(渲染) ——
  startLoop(level) {
    this.stopStepTimer();
    const lv = Math.min((level || this.data.level) - 1, SPEEDS.length - 1);
    this._stepInterval = SPEEDS[lv];
    this._lastStepTs = Date.now();
    this.timer = setInterval(() => this.step(false), this._stepInterval);
    this.ensureRaf();
  },
  stopStepTimer() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
  stopLoop() { this.stopStepTimer(); },
  ensureRaf() {
    if (this._raf) return;
    const tick = () => {
      this._raf = this.cv.requestAnimationFrame(tick);
      this.updateClearing(Date.now());
      this.draw();
    };
    this._raf = this.cv.requestAnimationFrame(tick);
  },
  stopRaf() { if (this._raf) { this.cv.cancelAnimationFrame(this._raf); this._raf = null; } },
  updateClearing(now) {
    if (!this.clearing) return;
    const c = this.clearing, elapsed = now - c.t0;
    if (c.phase === 'flash' && elapsed >= c.flashDur) { c.phase = 'collapse'; c.t0 = now; }
    else if (c.phase === 'collapse' && elapsed >= c.collapseDur) { this.finishClear(); }
  },

  pause() {
    if (this.data.over) return;
    this.setData({ paused: true });
    this.stopStepTimer();
    this.stopRaf();
  },
  togglePause() {
    if (this.data.over) return;
    if (this.data.paused) {
      this.setData({ paused: false });
      this.startLoop();
    } else {
      this.pause();
    }
  },
  gameOver() {
    if (this.data.over) return;   // 防重复
    this.stopLoop(); this.stopRaf(); this.setData({ over: true });
    const score = this.data.score;
    if (score) Store.push('gameScores', { game: 'tetris', role: room.getRole() || 'boy', score, ts: Store.now() });
  },
  finishGame() {   // 手动结束并记分（玩一半不想玩了也能记下来）
    if (this.data.over) return;
    this.gameOver();
    wx.showToast({ title: '已记入成绩榜', icon: 'none' });
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.bw, H = this.bh, cell = this.cell, th = getTheme(this.data.theme);
    const now = Date.now();
    const clearing = this.clearing;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = th.bg2; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, H); ctx.stroke(); }
    for (let j = 1; j < ROWS; j++) { ctx.beginPath(); ctx.moveTo(0, j * cell); ctx.lineTo(W, j * cell); ctx.stroke(); }

    // 已锁定方块（含消行动画：flash 闪白 / collapse 塌落）
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!this.board[r][c]) continue;
      if (clearing && clearing.rows.includes(r)) {
        if (clearing.phase === 'flash') {
          this.drawCell(ctx, c, r, this.board[r][c], cell);
          const p = Math.min(1, (now - clearing.t0) / clearing.flashDur);
          ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * p) + ')'; roundRect(ctx, c * cell, r * cell, cell, cell, 4); ctx.fill();
        }
        continue;   // collapse 期满行不再画
      }
      let drawR = r;
      if (clearing && clearing.phase === 'collapse') {
        const below = clearing.rows.filter(rr => rr > r).length;            // 该行下方待消行数
        const p = Math.min(1, (now - clearing.t0) / clearing.collapseDur);
        drawR = r + below * p;                                               // 上方格子平滑塌落补位
      }
      this.drawCell(ctx, c, drawR, this.board[r][c], cell);
    }

    // ghost 落点影（半透）
    if (this.cur && !clearing && !this.data.over) {
      let dr = 0;
      while (!this.collides(this.cur, dr + 1, 0)) dr++;
      const m = this.cur.m;
      ctx.globalAlpha = 0.22;
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) { const nr = this.cur.row + dr + r, nc = this.cur.col + c; if (nr >= 0) this.drawCell(ctx, nc, nr, this.cur.c, cell); }
      }
      ctx.globalAlpha = 1;
    }

    // 当前方块（平滑下落：在两个逻辑行间插值）
    if (this.cur && !clearing) {
      let frac = 0;
      if (!this.data.paused && !this.data.over) {
        frac = Math.min(0.95, (now - this._lastStepTs) / (this._stepInterval || 600));
      }
      const offY = -cell * (1 - frac);
      const m = this.cur.m;
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) { const nr = this.cur.row + r, nc = this.cur.col + c; if (nr >= 0) this.drawCell(ctx, nc, nr, this.cur.c, cell, offY); }
      }
    }

    // 得分飘字
    this.scoreFloats = this.scoreFloats.filter(f => now - f.t0 < f.dur);
    this.scoreFloats.forEach(f => {
      const p = (now - f.t0) / f.dur;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = th.primary || '#ff7aa2';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+' + f.val, W / 2, H * 0.16 - p * 50);
      ctx.globalAlpha = 1;
    });
  },
  drawCell(ctx, c, r, color, cell, offY) {
    offY = offY || 0;
    const x = c * cell, y = r * cell + offY, pad = Math.max(1, cell * 0.06);
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
