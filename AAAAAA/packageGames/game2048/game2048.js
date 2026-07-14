// game2048 —— 2048（Canvas 2d，滑动操作，主题取色，最高分本地存）
const { getTheme } = require('@utils/themes.js');
const SIZE = 4;
const BEST_KEY = 'g2048_best';
const TILE_COLOR = { 2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e' };

Page({
  data: { theme: 'sakura', score: 0, best: 0, over: false },

  onReady() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    this.best = wx.getStorageSync(BEST_KEY) || 0;
    this.setData({ best: this.best });
    this.setupCanvas();
  },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#board').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return;
      const cv = res[0].node, w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.W = w; this.H = h;
      this.newGame();
    });
  },

  newGame() {
    this.grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    this.setData({ score: 0, over: false });
    this.spawn(); this.spawn(); this.draw();
  },
  restart() { this.newGame(); },

  spawn() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!this.grid[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  },

  ts(e) { const t = e.touches[0]; this._sx = t.clientX; this._sy = t.clientY; },
  te(e) {
    if (this.data.over) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this._sx, dy = t.clientY - this._sy;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    this.move(ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  },

  move(dir) {
    const before = JSON.stringify(this.grid);
    let gained = 0;
    const lines = [];
    for (let i = 0; i < SIZE; i++) {
      const line = [];
      for (let j = 0; j < SIZE; j++) {
        let r, c;
        if (dir === 'left') { r = i; c = j; }
        else if (dir === 'right') { r = i; c = SIZE - 1 - j; }
        else if (dir === 'up') { r = j; c = i; }
        else { r = SIZE - 1 - j; c = i; }
        line.push({ v: this.grid[r][c], r, c });
      }
      lines.push(line);
    }
    const merged = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    lines.forEach(line => {
      const vals = line.map(x => x.v).filter(v => v);
      const out = [];
      for (let k = 0; k < vals.length; k++) {
        if (k + 1 < vals.length && vals[k] === vals[k + 1]) { out.push(vals[k] * 2); gained += vals[k] * 2; k++; }
        else out.push(vals[k]);
      }
      line.forEach((cell, idx) => { merged[cell.r][cell.c] = out[idx] || 0; });
    });
    this.grid = merged;
    if (JSON.stringify(this.grid) !== before) {
      this.setData({ score: this.data.score + gained });
      this.spawn();
      if (this.data.score > this.best) { this.best = this.data.score; wx.setStorageSync(BEST_KEY, this.best); this.setData({ best: this.best }); }
      this.draw();
      if (this.isOver()) this.setData({ over: true });
    }
  },

  isOver() {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (!this.grid[r][c]) return false;
      if (c + 1 < SIZE && this.grid[r][c] === this.grid[r][c + 1]) return false;
      if (r + 1 < SIZE && this.grid[r][c] === this.grid[r + 1][c]) return false;
    }
    return true;
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.W, pad = W * 0.04, gap = W * 0.02;
    const cell = (W - pad * 2 - gap * (SIZE - 1)) / SIZE;
    const th = getTheme(this.data.theme);
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = th.bg2; roundRect(ctx, 0, 0, W, W, 16); ctx.fill();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const x = pad + c * (cell + gap), y = pad + r * (cell + gap);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(ctx, x, y, cell, cell, 10); ctx.fill();
    }
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const v = this.grid[r][c]; if (!v) continue;
      const x = pad + c * (cell + gap), y = pad + r * (cell + gap);
      ctx.fillStyle = TILE_COLOR[v] || '#3c3a32'; roundRect(ctx, x, y, cell, cell, 10); ctx.fill();
      ctx.fillStyle = v <= 4 ? '#6b6056' : '#fff';
      ctx.font = `${Math.floor(cell * (v >= 1024 ? 0.28 : v >= 128 ? 0.34 : 0.42))}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(v), x + cell / 2, y + cell / 2);
    }
  }
});

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
