// xiangqi —— 中国象棋（功能8，双人联机，完整规则）
// 9×10 交点棋盘。车马象士将炮兵全套走法：蹩马腿/塞象眼/不过河/过河兵/炮架/飞将。
// 将军/将死/困毙判定。红=boy，黑=girl；红先。
// 状态 games/xiangqi/state = { board:10×9[{side,type,name}|null], turn:'red'|'black', winner, req, ts }
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

const ROWS = 10, COLS = 9;
const inB = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const inPalace = (side, r, c) => (c >= 3 && c <= 5) && (side === 'red' ? (r >= 7 && r <= 9) : (r >= 0 && r <= 2));
const ownSide = (row, side) => side === 'red' ? row >= 5 : row <= 4;

function initial() {
  const b = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const setRow = (row, side, arr) => arr.forEach((n, i) => { b[row][i] = { side, type: n[0], name: n[1] }; });
  setRow(9, 'red', [['R', '俥'], ['N', '傌'], ['B', '相'], ['A', '仕'], ['K', '帅'], ['A', '仕'], ['B', '相'], ['N', '傌'], ['R', '俥']]);
  setRow(0, 'black', [['R', '車'], ['N', '馬'], ['B', '象'], ['A', '士'], ['K', '将'], ['A', '士'], ['B', '象'], ['N', '馬'], ['R', '車']]);
  b[7][1] = { side: 'red', type: 'C', name: '炮' }; b[7][7] = { side: 'red', type: 'C', name: '炮' };
  b[2][1] = { side: 'black', type: 'C', name: '砲' }; b[2][7] = { side: 'black', type: 'C', name: '砲' };
  [0, 2, 4, 6, 8].forEach(c => { b[6][c] = { side: 'red', type: 'P', name: '兵' }; b[3][c] = { side: 'black', type: 'P', name: '卒' }; });
  return b;
}
function applyMove(board, sr, sc, dr, dc) { const nb = board.map(row => row.slice()); nb[dr][dc] = nb[sr][sc]; nb[sr][sc] = null; return nb; }

function pseudoMoves(board, r, c) {
  const p = board[r][c]; if (!p) return [];
  const enemy = p.side === 'red' ? 'black' : 'red';
  const out = [];
  const canTo = (nr, nc) => inB(nr, nc) && (!board[nr][nc] || board[nr][nc].side === enemy);
  const ray = (dirs) => dirs.forEach(([dr, dc]) => { let nr = r + dr, nc = c + dc; while (inB(nr, nc)) { const t = board[nr][nc]; if (!t) out.push({ r: nr, c: nc }); else { if (t.side === enemy) out.push({ r: nr, c: nc }); break; } nr += dr; nc += dc; } });
  switch (p.type) {
    case 'R': ray([[-1, 0], [1, 0], [0, -1], [0, 1]]); break;
    case 'C':
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        while (inB(nr, nc) && !board[nr][nc]) { out.push({ r: nr, c: nc }); nr += dr; nc += dc; } // 空走如车
        if (inB(nr, nc)) { nr += dr; nc += dc; while (inB(nr, nc)) { const t = board[nr][nc]; if (t) { if (t.side === enemy) out.push({ r: nr, c: nc }); break; } nr += dr; nc += dc; } } // 隔一子打
      });
      break;
    case 'N':
      [[-2, -1, -1, 0], [-2, 1, -1, 0], [2, -1, 1, 0], [2, 1, 1, 0], [-1, -2, 0, -1], [1, -2, 0, -1], [-1, 2, 0, 1], [1, 2, 0, 1]].forEach(([dr, dc, lr, lc]) => {
        if (inB(r + lr, c + lc) && board[r + lr][c + lc]) return; // 蹩马腿
        const nr = r + dr, nc = c + dc; if (canTo(nr, nc)) out.push({ r: nr, c: nc });
      });
      break;
    case 'B':
      [[-2, -2, -1, -1], [-2, 2, -1, 1], [2, -2, 1, -1], [2, 2, 1, 1]].forEach(([dr, dc, er, ec]) => {
        const nr = r + dr, nc = c + dc; if (!inB(nr, nc) || !ownSide(nr, p.side)) return; if (board[r + er][c + ec]) return; // 塞象眼 + 不过河
        if (canTo(nr, nc)) out.push({ r: nr, c: nc });
      });
      break;
    case 'A':
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => { const nr = r + dr, nc = c + dc; if (!inPalace(p.side, nr, nc)) return; if (canTo(nr, nc)) out.push({ r: nr, c: nc }); });
      break;
    case 'K':
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => { const nr = r + dr, nc = c + dc; if (!inPalace(p.side, nr, nc)) return; if (canTo(nr, nc)) out.push({ r: nr, c: nc }); });
      break;
    case 'P': {
      const fwd = p.side === 'red' ? -1 : 1; const crossed = p.side === 'red' ? r <= 4 : r >= 5;
      const tries = [[fwd, 0]]; if (crossed) tries.push([0, -1], [0, 1]);
      tries.forEach(([dr, dc]) => { const nr = r + dr, nc = c + dc; if (canTo(nr, nc)) out.push({ r: nr, c: nc }); });
      break;
    }
  }
  return out;
}
function findKing(board, side) { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = board[r][c]; if (p && p.type === 'K' && p.side === side) return [r, c]; } return null; }
function isAttacked(board, r, c, byside) {
  for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) { const p = board[rr][cc]; if (p && p.side === byside) { const ms = pseudoMoves(board, rr, cc); if (ms.some(m => m.r === r && m.c === c)) return true; } }
  return false;
}
function flyingGeneral(board) {
  const rk = findKing(board, 'red'), bk = findKing(board, 'black');
  if (!rk || !bk || rk[1] !== bk[1]) return false;
  for (let r = Math.min(rk[0], bk[0]) + 1; r < Math.max(rk[0], bk[0]); r++) if (board[r][rk[1]]) return false;
  return true;
}
function inCheck(board, side) { const k = findKing(board, side); if (!k) return true; const enemy = side === 'red' ? 'black' : 'red'; return isAttacked(board, k[0], k[1], enemy) || flyingGeneral(board); }
function legalMoves(board, r, c) {
  const p = board[r][c]; if (!p) return [];
  return pseudoMoves(board, r, c).filter(m => !inCheck(applyMove(board, r, c, m.r, m.c), p.side));
}
function hasLegalMove(board, side) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = board[r][c]; if (p && p.side === side && legalMoves(board, r, c).length) return true; }
  return false;
}

Page({
  data: {
    theme: 'sakura', role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, mySeat: 'red', myColor: 'red', myTurn: false,
    sel: null, targets: {}, last: null, winner: null, winnerText: '', requestPending: false, rulesOpen: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    const mySeat = rt.seatOf(room.getRole());
    this.setData({ mySeat, myColor: mySeat === 'red' ? 'red' : 'black' });
    ident.bind(this, { onChange: () => this.applyState() });
  },
  onReady() { this.setupCanvas(); },
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'xiangqi', s => { this._state = s; this.applyState(); });
  },
  onUnload() { rt.teardown(this); ident.teardown(this); },

  fresh() { return { board: initial(), turn: 'red', winner: null, req: null }; },
  startMatch() { this._recorded = false; rt.setState('xiangqi', this.fresh()); },
  requestRestart() { rt.requestRestart('xiangqi', this._state, room.getRole(), !!this.data.winner, () => this.fresh()); },
  cancelReq() { rt.cancelRestart('xiangqi', this._state); },
  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({ title: '认输', content: '确定认输吗？', confirmText: '认输', confirmColor: '#e85a86',
      success: r => { if (r.confirm) rt.resign('xiangqi', this._state, room.getRole()); } });
  },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#board').fields({ node: true, size: true, rect: true }).exec(res => {
      const f = res[0];
      if (!f || !f.node) { setTimeout(() => this.setupCanvas(), 80); return; }
      const cv = f.node, w = f.width, h = f.height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.W = w; this.H = h;
      this.rect = { left: f.left, top: f.top };
      // 9 列 × 10 行交点；按宽高算步长与原点
      this.stepX = (w - 24) / 8; this.stepY = (h - 24) / 9; this.ox = 12; this.oy = 12;
      this.applyState();
    });
  },

  applyState() {
    const s = this._state, role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    const patch = { sel: null, targets: {} };
    const reqSide = rt.restartReqSide(s && s.req, role);
    patch.requestPending = reqSide === 'mine';
    if (reqSide === 'peer' && !this._restartPrompted) {
      this._restartPrompted = true;
      const me = this;
      wx.showModal({ title: '重新开局请求', content: (names[s.req.by] || '对方') + ' 请求重新开局，同意？', confirmText: '同意', cancelText: '拒绝',
        success: r => { if (r.confirm) rt.acceptRestart('xiangqi', () => me.fresh()); else rt.rejectRestart('xiangqi', me._state); } });
    } else if (reqSide !== 'peer') this._restartPrompted = false;

    if (!s || !s.board) { this.setData(Object.assign({ started: false }, patch)); this.draw(); return; }
    this._board = s.board;
    const winner = s.winner || null;
    const turn = s.turn || 'red';
    if (winner && !this._recorded) { this._recorded = true; rt.recordPvp('xiangqi', rt.myResult(winner, this.data.mySeat), role); }
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 胜';
    Object.assign(patch, { started: true, myTurn: !winner && turn === this.data.myColor, last: s.last || null, winner, winnerText });
    this.setData(patch);
    this.draw();
  },

  onBoardTap(e) {
    if (!this.data.myTurn || this.data.winner) return;
    const t = e.changedTouches && e.changedTouches[0]; if (!t) return;
    const x = (t.x != null ? t.x : t.clientX - this.rect.left), y = (t.y != null ? t.y : t.clientY - this.rect.top);
    const c = Math.round((x - this.ox) / this.stepX), r = Math.round((y - this.oy) / this.stepY);
    if (!inB(r, c)) return;
    const board = this._board;
    const myColor = this.data.myColor;

    if (this.data.sel) {
      const key = r + '_' + c;
      if (this.data.targets[key]) {
        const src = this.data.sel;
        const nb = applyMove(board, src.r, src.c, r, c);
        const enemy = myColor === 'red' ? 'black' : 'red';
        const enemyHas = hasLegalMove(nb, enemy);
        let winner = null;
        if (!enemyHas) winner = rt.seatOf(room.getRole()); // 将死/困毙
        const checked = !winner && inCheck(nb, enemy);
        rt.setState('xiangqi', { board: nb, turn: winner ? this.data.myColor : enemy, winner, last: { r, c }, req: null });
        if (winner) toast('将死！你赢了');
        else if (checked) toast('将军');
        this.setData({ sel: null, targets: {} });
        return;
      }
      const cell = board[r][c];
      if (cell && cell.side === myColor) { this.select(r, c); return; }
      this.setData({ sel: null, targets: {} }); return;
    }
    const cell = board[r][c];
    if (!cell || cell.side !== myColor) return toast('请选自己的棋子');
    this.select(r, c);
  },
  select(r, c) {
    const ms = legalMoves(this._board, r, c);
    if (!ms.length) return toast('这枚棋子无路可走');
    const targets = {}; ms.forEach(m => { targets[m.r + '_' + m.c] = true; });
    this.setData({ sel: { r, c }, targets });
  },

  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); setTimeout(() => this.setupCanvas(), 60); },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.W, H = this.H, sx = this.stepX, sy = this.stepY, ox = this.ox, oy = this.oy;
    const X = c => ox + c * sx, Y = r => oy + r * sy;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f1e2bd'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#5a4326'; ctx.lineWidth = 1.4;
    // 横线 0..9
    for (let r = 0; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(X(0), Y(r)); ctx.lineTo(X(8), Y(r)); ctx.stroke(); }
    // 竖线：边线贯穿，中间列在楚河汉界处断开
    for (let c = 0; c < COLS; c++) {
      if (c === 0 || c === 8) { ctx.beginPath(); ctx.moveTo(X(c), Y(0)); ctx.lineTo(X(c), Y(9)); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(X(c), Y(0)); ctx.lineTo(X(c), Y(4)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X(c), Y(5)); ctx.lineTo(X(c), Y(9)); ctx.stroke(); }
    }
    // 九宫斜线
    ctx.beginPath(); ctx.moveTo(X(3), Y(0)); ctx.lineTo(X(5), Y(2)); ctx.moveTo(X(5), Y(0)); ctx.lineTo(X(3), Y(2)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(3), Y(7)); ctx.lineTo(X(5), Y(9)); ctx.moveTo(X(5), Y(7)); ctx.lineTo(X(3), Y(9)); ctx.stroke();
    // 楚河汉界
    ctx.fillStyle = '#7a5c3a'; ctx.font = '' + Math.round(sy * 0.42) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('楚 河', X(2), Y(4.5)); ctx.fillText('漢 界', X(6), Y(4.5));

    // 选中与目标提示
    if (this.data.sel) { const { r, c } = this.data.sel; ctx.strokeStyle = '#2ec24e'; ctx.lineWidth = 3; ctx.strokeRect(X(c) - sx / 2 + 2, Y(r) - sy / 2 + 2, sx - 4, sy - 4); }
    if (this.data.targets) { ctx.fillStyle = 'rgba(46,194,78,.35)'; Object.keys(this.data.targets).forEach(k => { const [r, c] = k.split('_').map(Number); ctx.beginPath(); ctx.arc(X(c), Y(r), Math.min(sx, sy) * 0.13, 0, 7); ctx.fill(); }); }

    // 棋子
    const board = this._board || [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const p = board[r][c]; if (!p) continue;
      const rad = Math.min(sx, sy) * 0.42;
      ctx.fillStyle = '#fff6e6'; ctx.beginPath(); ctx.arc(X(c), Y(r), rad, 0, 7); ctx.fill();
      ctx.strokeStyle = p.side === 'red' ? '#c0392b' : '#2c2c2c'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = p.side === 'red' ? '#c0392b' : '#2c2c2c'; ctx.font = 'bold ' + Math.round(rad * 1.1) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.name, X(c), Y(r));
    }
  }
});
