// gomoku —— 五子棋（功能8，双人实时联机）
// 状态 games/gomoku/state = { board:15×15(0空/1红/2蓝), turn:'red'|'blue', last:{r,c}, winner, winLine, moves, req, ts }
// req = 重新开局握手：{ by: role } | null。发起方二次确认→写入 req→对方同意才重开。
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

const N = 15;
const EMPTY = 0, RED = 1, BLUE = 2;
const SEAT_VAL = { red: RED, blue: BLUE };
const STONE = { [RED]: '#e85a86', [BLUE]: '#3a86ff' };

function emptyBoard() { return Array.from({ length: N }, () => Array(N).fill(0)); }
function checkWin(b, r, c, v) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    let cnt = 1, line = [[r, c]];
    for (let k = 1; k < 5; k++) { const nr = r + dr * k, nc = c + dc * k; if (nr < 0 || nr >= N || nc < 0 || nc >= N || b[nr][nc] !== v) break; cnt++; line.push([nr, nc]); }
    for (let k = 1; k < 5; k++) { const nr = r - dr * k, nc = c - dc * k; if (nr < 0 || nr >= N || nc < 0 || nc >= N || b[nr][nc] !== v) break; cnt++; line.unshift([nr, nc]); }
    if (cnt >= 5) return line;
  }
  return null;
}

Page({
  data: {
    theme: 'sakura',
    role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, mySeat: 'red', myTurn: false, turnSeat: 'red',
    winner: null, winnerText: '', last: null, moves: 0,
    requestPending: false,   // 我已发起重开请求，等对方同意
    rulesOpen: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    this.setData({ mySeat: rt.seatOf(room.getRole()) });
    ident.bind(this, { onChange: () => this.applyState() });
  },
  onReady() { console.log('[gomoku] onReady'); this.setupCanvas(); },
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'gomoku', s => { this._state = s; this.applyState(); });
  },
  onUnload() { rt.teardown(this); ident.teardown(this); },

  setupCanvas() {
    console.log('[gomoku] setupCanvas 查询 canvas');
    const dpr = wx.getSystemInfoSync().pixelRatio;
    const q = wx.createSelectorQuery().in(this);
    q.select('#board').fields({ node: true, size: true });
    q.select('#board').boundingClientRect();
    q.exec(res => {
      const f = res[0], br = res[1];
      console.log('[gomoku] query 结果', JSON.stringify({ hasNode: !!(f && f.node), w: f && f.width, h: f && f.height, rectLeft: br && br.left, rectTop: br && br.top }));
      if (!f || !f.node) { console.warn('[gomoku] canvas 节点未就绪，80ms 后重试'); setTimeout(() => this.setupCanvas(), 80); return; }
      const cv = f.node, w = f.width, h = f.height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.W = w; this.step = w / (N + 1);
      this.rect = { left: (br && br.left) || 0, top: (br && br.top) || 0 };
      console.log('[gomoku] canvas 就绪 step=', this.step, 'rect=', JSON.stringify(this.rect));
      this.applyState();
    });
  },

  applyState() {
    const s = this._state, role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    const patch = {};
    // 重开请求握手
    const req = s && s.req ? s.req : null;
    if (req && req.by) {
      if (req.by === role) { patch.requestPending = true; }
      else if (!this._restartPrompted) {
        this._restartPrompted = true;
        const me = this;
        wx.showModal({
          title: '重新开局请求', content: (names[req.by] || '对方') + ' 请求重新开局，同意？', confirmText: '同意', cancelText: '拒绝',
          success: r => { if (r.confirm) me.startMatch(); else me.clearReq(); }
        });
      }
    } else {
      this._restartPrompted = false;
      patch.requestPending = false;
    }
    if (!s || !s.board) { this.setData(Object.assign({ started: false }, patch)); this.draw(); return; }
    this._board = s.board;
    this._winLine = s.winLine || null;
    const winner = s.winner || null;
    const turnSeat = s.turn || rt.RED;
    const myTurn = !winner && turnSeat === this.data.mySeat;
    console.log('[gomoku] applyState', JSON.stringify({ mySeat: this.data.mySeat, turnSeat, myTurn, winner, moves: s.moves, hasBoard: !!s.board }));
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 赢了';
    Object.assign(patch, {
      started: true, turnSeat,
      myTurn: !winner && turnSeat === this.data.mySeat,
      winner, winnerText, last: s.last || null, moves: s.moves || 0
    });
    this.setData(patch);
    this.draw();
  },

  startMatch() {
    rt.setState('gomoku', { board: emptyBoard(), turn: rt.RED, last: null, winner: null, winLine: null, moves: 0, req: null });
  },

  // —— 重新开局：未开局/已结束直接开；进行中需二次确认 + 对方同意 ——
  requestRestart() {
    if (!this.data.started || this.data.winner) { this.startMatch(); return; }
    wx.showModal({
      title: '重新开局', content: '将向对方发起请求，需对方同意才会重开当前棋局', confirmText: '发起请求',
      success: r => { if (r.confirm) this.sendReq(); }
    });
  },
  sendReq() {
    if (!this._state) return;
    rt.setState('gomoku', Object.assign({}, this._state, { req: { by: room.getRole(), ts: Date.now() } }));
    toast('已发起请求，等对方同意');
  },
  cancelReq() {
    this.clearReq();
    toast('已取消请求');
  },
  clearReq() {
    if (!this._state) return;
    rt.setState('gomoku', Object.assign({}, this._state, { req: null }));
  },

  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({
      title: '认输', content: '确定认输吗？', confirmText: '认输', confirmColor: '#e85a86',
      success: async r => {
        if (!r.confirm) return;
        const peerSeat = rt.peerSeatOf(room.getRole());
        rt.setState('gomoku', Object.assign({}, this._state, { winner: peerSeat }));
        toast('已认输');
      }
    });
  },

  onBoardTap(e) {
    console.log('[gomoku] onBoardTap 触发', JSON.stringify({
      started: this.data.started, winner: this.data.winner, myTurn: this.data.myTurn,
      hasStep: !!this.step, hasBoard: !!this._board,
      changedTouches: e.changedTouches ? e.changedTouches.length : 0,
      detail: e.detail, type: e.type
    }));
    if (!this.data.started) { console.log('[gomoku] 退出: 未开局'); return; }
    if (this.data.winner) { console.log('[gomoku] 退出: 已有胜负'); return; }
    if (!this.data.myTurn) { console.log('[gomoku] 退出: 不是你的回合'); return toast('等对方落子'); }
    if (!this.step) { console.log('[gomoku] 退出: step 为空，重新 setupCanvas'); this.setupCanvas(); return; }
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) { console.log('[gomoku] 退出: 无 changedTouches'); return; }
    // canvas touch 的 x/y 为相对画布坐标（文档保证）；兜底用 clientX - rect
    const x = (t.x != null) ? t.x : (t.clientX - (this.rect ? this.rect.left : 0));
    const y = (t.y != null) ? t.y : (t.clientY - (this.rect ? this.rect.top : 0));
    const c = Math.round(x / this.step - 1), r = Math.round(y / this.step - 1);
    console.log('[gomoku] 坐标', JSON.stringify({ tx: t.x, ty: t.y, clientX: t.clientX, clientY: t.clientY, rect: this.rect, step: this.step, x, y, c, r }));
    if (r < 0 || r >= N || c < 0 || c >= N) { console.log('[gomoku] 退出: 坐标越界'); return; }
    const board = this._board.map(row => row.slice());
    if (board[r][c] !== EMPTY) { console.log('[gomoku] 退出: 该点已有子'); return; }
    const me = SEAT_VAL[this.data.mySeat];
    board[r][c] = me;
    const winLine = checkWin(board, r, c, me);
    const moves = (this.data.moves || 0) + 1;
    const mySeat = this.data.mySeat;
    const nextTurn = mySeat === rt.RED ? rt.BLUE : rt.RED;
    const next = Object.assign({}, this._state, { board, turn: winLine ? mySeat : nextTurn, last: { r, c }, winner: null, moves });
    if (winLine) { next.winner = mySeat; next.winLine = winLine; }
    else if (moves >= N * N) { next.winner = 'draw'; }
    console.log('[gomoku] 落子成功 r,c=', r, c, ' → setState');
    rt.setState('gomoku', next);
  },

  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() {
    this.setData({ rulesOpen: false });
    this._canvasReady = false;
    setTimeout(() => this.setupCanvas(), 60);   // canvas 被 wx:if 隐藏过，重建重绘
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.W, step = this.step, board = this._board;
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = '#f6ead0'; ctx.fillRect(0, 0, W, W);
    ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      const p = step * (i + 1);
      ctx.beginPath(); ctx.moveTo(step, p); ctx.lineTo(step * N, p); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p, step); ctx.lineTo(p, step * N); ctx.stroke();
    }
    ctx.fillStyle = '#c9a06a';
    [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]].forEach(([r, c]) => { ctx.beginPath(); ctx.arc(step * (c + 1), step * (r + 1), 3, 0, 7); ctx.fill(); });
    if (board) {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const v = board[r][c]; if (!v) continue;
        const x = step * (c + 1), y = step * (r + 1), rad = step * 0.42;
        ctx.fillStyle = STONE[v]; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.3, 0, 7); ctx.fill();
      }
    }
    if (this.data.last) {
      const { r, c } = this.data.last;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(step * (c + 1), step * (r + 1), step * 0.18, 0, 7); ctx.stroke();
    }
    if (this.data.winner && this.data.winner !== 'draw' && this._winLine) {
      ctx.strokeStyle = '#2ec24e'; ctx.lineWidth = 4;
      const a = this._winLine[0], b = this._winLine[this._winLine.length - 1];
      ctx.beginPath(); ctx.moveTo(step * (a[1] + 1), step * (a[0] + 1)); ctx.lineTo(step * (b[1] + 1), step * (b[0] + 1)); ctx.stroke();
    }
  }
});
