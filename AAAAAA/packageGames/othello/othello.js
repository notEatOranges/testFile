// othello —— 黑白棋/翻转棋（功能8，双人实时联机）
// 状态 games/othello/state = { board:8×8(0空/1红/2蓝), turn, winner, last, req, ts }
// 落子必须夹住对方→翻转；无棋可走自动跳过；双方都无棋则终局数子。
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

const N = 8;
const EMPTY = 0, RED = 1, BLUE = 2;
const VAL = { red: RED, blue: BLUE };
const STONE = { [RED]: '#e85a86', [BLUE]: '#3a86ff' };
const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function initBoard() {
  const b = Array.from({ length: N }, () => Array(N).fill(EMPTY));
  b[3][3] = BLUE; b[4][4] = BLUE; b[3][4] = RED; b[4][3] = RED;   // 标准开局
  return b;
}
function inB(r, c) { return r >= 0 && r < N && c >= 0 && c < N; }
function flipsFor(b, r, c, val) {
  if (b[r][c] !== EMPTY) return null;
  const opp = val === RED ? BLUE : RED;
  const all = [];
  for (const [dr, dc] of DIRS) {
    const line = [];
    let nr = r + dr, nc = c + dc;
    while (inB(nr, nc) && b[nr][nc] === opp) { line.push([nr, nc]); nr += dr; nc += dc; }
    if (line.length && inB(nr, nc) && b[nr][nc] === val) all.push(...line);
  }
  return all.length ? all : null;
}
function validMoves(b, val) {
  const m = {};
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const f = flipsFor(b, r, c, val); if (f) m[r + '_' + c] = f; }
  return m;
}
function count(b) { let red = 0, blue = 0; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (b[r][c] === RED) red++; else if (b[r][c] === BLUE) blue++; } return { red, blue }; }
const wait = ms => new Promise(r => setTimeout(r, ms));

Page({
  data: {
    theme: 'sakura', role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, mySeat: 'red', myTurn: false, turnSeat: 'red',
    myScore: 0, peerScore: 0, winner: null, winnerText: '',
    hints: [], last: null, requestPending: false, rulesOpen: false,
    rollFirst: { open: false, result: '' }
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    this.setData({ mySeat: rt.seatOf(room.getRole()) });
    ident.bind(this, { onChange: () => this.applyState() });
  },
  onReady() { this.setupCanvas(); },
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'othello', s => { this._state = s; this.applyState(); });
  },
  onUnload() { rt.teardown(this); ident.teardown(this); },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    const q = wx.createSelectorQuery().in(this);
    q.select('#board').fields({ node: true, size: true });
    q.select('#board').boundingClientRect();
    q.exec(res => {
      const f = res[0], br = res[1];
      if (!f || !f.node) { setTimeout(() => this.setupCanvas(), 80); return; }
      const cv = f.node, w = f.width, h = f.height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.W = w; this.step = w / N;
      this.rect = { left: (br && br.left) || 0, top: (br && br.top) || 0 };
      this.applyState();
    });
  },

  fresh(first) { return { board: initBoard(), turn: first || (Math.random() < 0.5 ? rt.RED : rt.BLUE), winner: null, last: null, req: null }; },
  async startMatch() {
    this._recorded = false;
    const first = Math.random() < 0.5 ? rt.RED : rt.BLUE;
    this.setData({ rollFirst: { open: true, result: '' } });
    await wait(820);
    this.setData({ rollFirst: { open: true, result: first === this.data.mySeat ? 'me' : 'peer' } });
    await wait(950);
    this.setData({ rollFirst: { open: false, result: '' } });
    rt.setState('othello', this.fresh(first));
  },
  requestRestart() { rt.requestRestart('othello', this._state, room.getRole(), !!this.data.winner, () => this.fresh()); },
  cancelReq() { rt.cancelRestart('othello', this._state); },
  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({
      title: '认输', content: '确定认输吗？', confirmText: '认输', confirmColor: '#e85a86',
      success: r => { if (r.confirm) rt.resign('othello', this._state, room.getRole()); }
    });
  },

  applyState() {
    const s = this._state, role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    const patch = {};
    const reqSide = rt.restartReqSide(s && s.req, role);
    patch.requestPending = reqSide === 'mine';
    if (reqSide === 'peer' && !this._prompted) {
      this._prompted = true;
      const me = this;
      wx.showModal({
        title: '重新开局请求', content: (names[s.req.by] || '对方') + ' 请求重新开局，同意？', confirmText: '同意', cancelText: '拒绝',
        success: r => { if (r.confirm) rt.acceptRestart('othello', () => me.fresh()); else rt.rejectRestart('othello', me._state); }
      });
    } else if (reqSide !== 'peer') {
      this._prompted = false;
    }
    if (!s || !s.board) { this.setData(Object.assign({ started: false }, patch)); this.draw(); return; }
    this._board = s.board;
    const winner = s.winner || null;
    const turnSeat = s.turn || rt.RED;
    const mySeat = this.data.mySeat;
    const sc = count(this._board);
    const hints = (!winner && turnSeat === mySeat) ? Object.keys(validMoves(this._board, VAL[mySeat])).map(k => { const p = k.split('_'); return { r: +p[0], c: +p[1] }; }) : [];
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 赢了';
    if (winner && !this._recorded) { this._recorded = true; rt.recordPvp('othello', rt.myResult(winner, mySeat), role); }
    Object.assign(patch, {
      started: true, turnSeat, myTurn: !winner && turnSeat === mySeat,
      myScore: mySeat === 'red' ? sc.red : sc.blue, peerScore: mySeat === 'red' ? sc.blue : sc.red,
      winner, winnerText, hints, last: s.last || null
    });
    this.setData(patch);
    this.draw();
  },

  onBoardTap(e) {
    if (!this.data.started || this.data.winner || !this.data.myTurn || !this.step) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    const x = (t.x != null) ? t.x : (t.clientX - (this.rect ? this.rect.left : 0));
    const y = (t.y != null) ? t.y : (t.clientY - (this.rect ? this.rect.top : 0));
    const c = Math.floor(x / this.step), r = Math.floor(y / this.step);
    if (!inB(r, c)) return;
    const mySeat = this.data.mySeat;
    const myVal = VAL[mySeat];
    const flips = flipsFor(this._board, r, c, myVal);
    if (!flips) return toast('要夹住对方才能落子');
    const board = this._board.map(row => row.slice());
    board[r][c] = myVal;
    flips.forEach(([fr, fc]) => { board[fr][fc] = myVal; });
    // 下一回合：对方无棋则跳过；双方都无棋则终局
    const peerSeat = rt.peerSeatOf(room.getRole());
    let turn = peerSeat, winner = null;
    const peerHas = Object.keys(validMoves(board, VAL[peerSeat])).length > 0;
    const myHas = Object.keys(validMoves(board, myVal)).length > 0;
    if (!peerHas) {
      if (!myHas) { const sc = count(board); winner = sc.red === sc.blue ? 'draw' : (sc.red > sc.blue ? rt.RED : rt.BLUE); }
      else { turn = mySeat; toast('对方无棋可走，继续你的回合'); }
    }
    rt.setState('othello', Object.assign({}, this._state, { board, turn, winner, last: { r, c } }));
  },

  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); this._canvasReady = false; setTimeout(() => this.setupCanvas(), 60); },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.W, cell = this.step, board = this._board;
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = '#4ea36b'; ctx.fillRect(0, 0, W, W);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
    for (let i = 0; i <= N; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, W); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(W, i * cell); ctx.stroke(); }
    // 棋子
    if (board) {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const v = board[r][c]; if (!v) continue;
        const x = (c + 0.5) * cell, y = (r + 0.5) * cell, rad = cell * 0.4;
        ctx.fillStyle = STONE[v]; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.35, 0, 7); ctx.fill();
      }
    }
    // 合法落子提示
    if (this.data.hints && this.data.hints.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      this.data.hints.forEach(h => { ctx.beginPath(); ctx.arc((h.c + 0.5) * cell, (h.r + 0.5) * cell, cell * 0.12, 0, 7); ctx.fill(); });
    }
    // 最后一手
    if (this.data.last) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc((this.data.last.c + 0.5) * cell, (this.data.last.r + 0.5) * cell, cell * 0.42, 0, 7); ctx.stroke();
    }
  }
});
