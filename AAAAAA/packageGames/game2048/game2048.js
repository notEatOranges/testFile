// game2048 —— 2048（Canvas 2d，完整帧动画版）
// 数据模型：grid[r][c] = tile对象|null（供寻路/判负）；tiles[] = 所有方块（供分层绘制）
// 动画：滑动补间 + 合并弹跳 + 新生 pop + 得分飘字，临时 rAF（动画结束自停）
const { getTheme } = require('@utils/themes.js');
const { Store } = require('@utils/store.js');
const room = require('@utils/room.js');
const SIZE = 4;
const BEST_KEY = 'g2048_best';
const TILE_COLOR = { 2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e' };

// 缓动函数
const easeInOut = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t-1, 3) + c1 * Math.pow(t-1, 2); };
const lerp = (a, b, t) => a + (b - a) * t;

let TILE_SEQ = 0;   // tile 唯一 id（合并/新生动画定位用）

Page({
  data: { theme: 'sakura', score: 0, best: 0, over: false },

  onReady() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    this.best = wx.getStorageSync(BEST_KEY) || 0;
    this.setData({ best: this.best });
    this.setupCanvas();
  },
  onHide() { if (this._animating) this.onAnimsDone(); else this.stopAnimLoop(); },   // 动画中切后台：立即结算归位，避免 _animating 死锁
  onUnload() { this.stopAnimLoop(); },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#board').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return;
      const cv = res[0].node, w = res[0].width, h = res[0].height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.cv = cv; this.W = w; this.H = h;
      this.newGame();
    });
  },

  newGame() {
    this.grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));   // grid[r][c] = tile | null
    this.tiles = [];
    this.anims = [];
    this._animating = false;
    this._animStart = 0;
    this.setData({ score: 0, over: false });
    this.spawn(); this.spawn();
    this.tiles.forEach(t => { t.isNew = false; });   // 开局两个方块不播 pop
    this.draw();
  },
  restart() { this.stopAnimLoop(); this.newGame(); },

  spawn() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!this.grid[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const tile = { id: ++TILE_SEQ, v: Math.random() < 0.9 ? 2 : 4, r, c, fromR: r, fromC: c, isNew: true };
    this.grid[r][c] = tile;
    this.tiles.push(tile);
  },

  ts(e) { const t = e.touches[0]; this._sx = t.clientX; this._sy = t.clientY; },
  te(e) {
    if (this.data.over || this._animating) return;   // 动画中忽略输入，防连点穿帮
    const t = e.changedTouches[0];
    const dx = t.clientX - this._sx, dy = t.clientY - this._sy;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    this.move(ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  },

  move(dir) {
    // 重置上一步标记，记录本步起点
    this.tiles.forEach(t => { t.fromR = t.r; t.fromC = t.c; t.isNew = false; });

    const vec = this.vector(dir);
    const trav = this.buildTraversals(dir);
    let moved = false, gained = 0;

    trav.rows.forEach(r => trav.cols.forEach(c => {
      const tile = this.grid[r][c];
      if (!tile) return;
      const far = this.findFarthest(r, c, vec);
      const nextTile = far.next ? this.grid[far.next.r][far.next.c] : null;
      // 合并：下一格有同值且该格本步未参与过合并
      if (nextTile && nextTile.v === tile.v && !nextTile._merging) {
        nextTile._merging = true; nextTile.v = nextTile.v * 2; gained += nextTile.v;   // 立即翻倍：数字当场相加，不再等动画
        tile.r = far.next.r; tile.c = far.next.c; tile._remove = true;   // 源滑到目标格后消失
        this.grid[r][c] = null;
        moved = true;
      } else if (far.r !== r || far.c !== c) {
        this.grid[r][c] = null;
        tile.r = far.r; tile.c = far.c;
        this.grid[far.r][far.c] = tile;
        moved = true;
      }
    }));

    if (!moved) return;
    this._animating = true;

    // 构造动画队列（更短：真机 rAF 帧率有限，时长过长会显得「合并延迟」）
    this.anims = [];
    this.anims.push({ type: 'slide', t0: 0, dur: 55, _t: 0 });                   // 全员滑动补间
    this.tiles.filter(t => t._merging).forEach(t =>                             // 合并目标：滑到位即变值
      this.anims.push({ type: 'merge', tileId: t.id, t0: 55, dur: 70, _t: -1 }));
    if (gained) {
      this.setData({ score: this.data.score + gained });
      this.anims.push({ type: 'score', val: gained, t0: 0, dur: 400, _t: -1 }); // 得分 +N 飘字
    }
    if (this.data.score > this.best) { this.best = this.data.score; wx.setStorageSync(BEST_KEY, this.best); this.setData({ best: this.best }); }

    this.spawn();                                                                // 新生方块带 isNew
    this.tiles.filter(t => t.isNew).forEach(t =>
      this.anims.push({ type: 'pop', tileId: t.id, t0: 55, dur: 60, _t: -1 }));
    if (this.tiles.some(t => t._merging && t._mergeTo >= 2048)) {
      this.anims.push({ type: 'celebrate', t0: 200, dur: 1200, _t: -1 });        // 达成 2048 庆祝
    }

    this.ensureLoop();
  },

  buildTraversals(dir) {
    const rows = [0, 1, 2, 3], cols = [0, 1, 2, 3];
    if (dir === 'down') rows.reverse();
    if (dir === 'right') cols.reverse();
    return { rows, cols };
  },
  vector(dir) {
    return { up: { r: -1, c: 0 }, down: { r: 1, c: 0 }, left: { r: 0, c: -1 }, right: { r: 0, c: 1 } }[dir];
  },
  findFarthest(r, c, vec) {
    let pr = r, pc = c;
    while (true) {
      const nr = pr + vec.r, nc = pc + vec.c;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) return { r: pr, c: pc, next: null };
      if (this.grid[nr][nc]) return { r: pr, c: pc, next: { r: nr, c: nc } };
      pr = nr; pc = nc;
    }
  },

  isOver() {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const t = this.grid[r][c];
      if (!t) return false;
      if (c + 1 < SIZE && this.grid[r][c+1] && this.grid[r][c+1].v === t.v) return false;
      if (r + 1 < SIZE && this.grid[r+1][c] && this.grid[r+1][c].v === t.v) return false;
    }
    return true;
  },

  // —— 动画循环（有动画才跑，结束自停）——
  ensureLoop() {
    if (this._raf) return;
    this._animStart = 0;
    const tick = () => {
      this._raf = this.cv.requestAnimationFrame(tick);
      const now = Date.now();
      if (!this._animStart) this._animStart = now;
      this.updateAnims(now);
      this.draw();
      if (this.anims.length === 0) this.onAnimsDone();   // 全部播完
    };
    this._raf = this.cv.requestAnimationFrame(tick);
  },
  stopAnimLoop() {
    if (this._raf) { this.cv.cancelAnimationFrame(this._raf); this._raf = null; }
  },
  updateAnims(now) {
    const elapsed = now - this._animStart;
    this.anims = this.anims.filter(a => {
      a._t = (elapsed - a.t0) / a.dur;          // 可为负（未开始）
      return elapsed < a.t0 + a.dur;            // 未结束则保留
    });
  },
  onAnimsDone() {
    this.stopAnimLoop();
    this.tiles = this.tiles.filter(t => !t._remove);                          // 移除被合并的源
    this.tiles.forEach(t => { t._merging = false; t.isNew = false; t.fromR = t.r; t.fromC = t.c; });
    this._animating = false;
    this._animStart = 0;
    this.draw();
    if (this.isOver()) { this.setData({ over: true }); this.uploadScore(); }
  },
  uploadScore() {
    const score = this.data.score;
    if (!score) return;
    Store.push('gameScores', { game: 'g2048', role: room.getRole() || 'boy', score, ts: Store.now() });
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.W, pad = W * 0.04, gap = W * 0.02;
    const cell = (W - pad * 2 - gap * (SIZE - 1)) / SIZE;
    const th = getTheme(this.data.theme);

    const slideAnim = this.anims.find(a => a.type === 'slide');
    const slideP = slideAnim ? easeInOut(Math.max(0, slideAnim._t)) : 1;
    const animOf = (type, id) => { const a = this.anims.find(x => x.type === type && x.tileId === id); return a ? a._t : -1; };

    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = th.bg2; roundRect(ctx, 0, 0, W, W, 16); ctx.fill();
    // 空格背景
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(ctx, pad + c*(cell+gap), pad + r*(cell+gap), cell, cell, 10); ctx.fill();
    }
    // 方块（动画层）
    this.tiles.forEach(tile => {
      const mt = animOf('merge', tile.id);
      const mergeStarted = mt >= 0;
      if (tile._remove && mergeStarted) return;   // 合并开始后源方块消失
      const r = lerp(tile.fromR, tile.r, slideP);
      const c = lerp(tile.fromC, tile.c, slideP);
      const x = pad + c * (cell + gap), y = pad + r * (cell + gap);
      let scale = 1;
      const showV = tile.v;   // v 已即时翻倍（合并当场相加），滑动只是视觉过渡
      if (mergeStarted && tile._merging) scale = 0.7 + 0.3 * easeOutBack(mt);    // 合并弹跳
      const pt = animOf('pop', tile.id);
      if (pt >= 0 && tile.isNew) scale = easeOutBack(pt);                        // 新生 pop-in
      drawTile(ctx, x, y, cell, showV, scale);
    });

    // 得分 +N 飘字
    const sa = this.anims.find(a => a.type === 'score');
    if (sa && sa._t >= 0) {
      ctx.globalAlpha = 1 - sa._t;
      ctx.fillStyle = th.primary || '#ff7aa2';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+' + sa.val, W / 2, W * 0.18 - sa._t * 60);
      ctx.globalAlpha = 1;
    }
    // 2048 庆祝
    const ca = this.anims.find(a => a.type === 'celebrate');
    if (ca && ca._t >= 0) {
      ctx.globalAlpha = Math.sin(ca._t * Math.PI * 4) * 0.3 + 0.7;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 56px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('2048!', W / 2, W / 2);
      ctx.globalAlpha = 1;
    }
  }
});

function drawTile(ctx, x, y, cell, v, scale) {
  const cx = x + cell / 2, cy = y + cell / 2;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
  ctx.fillStyle = TILE_COLOR[v] || '#3c3a32'; roundRect(ctx, x, y, cell, cell, 10); ctx.fill();
  ctx.fillStyle = v <= 4 ? '#6b6056' : '#fff';
  ctx.font = `${Math.floor(cell * (v >= 1024 ? 0.28 : v >= 128 ? 0.34 : 0.42))}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(v), cx, cy);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
