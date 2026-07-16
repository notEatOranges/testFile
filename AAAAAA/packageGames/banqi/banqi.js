// banqi —— 翻翻棋/中国暗棋（功能8，双人联机）
// 4×8 棋盘，32 枚象棋子背面朝下。翻面/走子/吃子；炮隔一子打；兵吃将；将不吃兵。
// 状态 games/banqi/state = { board:4×8[{side,rank,name,up}|null], turn, red(role|null), winner, req, ts }
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

function buildBoard() {
  const P = [];
  const add = (side, r, n, c) => { for (let i = 0; i < n; i++) P.push({ side, rank: r, name: c, up: false }); };
  add('red', 7, 1, '帅'); add('red', 6, 2, '士'); add('red', 5, 2, '相'); add('red', 4, 2, '俥'); add('red', 3, 2, '傌'); add('red', 2, 2, '炮'); add('red', 1, 5, '兵');
  add('black', 7, 1, '将'); add('black', 6, 2, '士'); add('black', 5, 2, '象'); add('black', 4, 2, '車'); add('black', 3, 2, '馬'); add('black', 2, 2, '砲'); add('black', 1, 5, '卒');
  for (let i = P.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = P[i]; P[i] = P[j]; P[j] = t; }
  const b = [];
  for (let r = 0; r < 4; r++) { const row = []; for (let c = 0; c < 8; c++) row.push(P[r * 8 + c]); b.push(row); }
  return b;
}
function canCapture(att, def) {
  if (att.rank === 1 && def.rank === 7) return true;   // 兵吃将
  if (att.rank === 7 && def.rank === 1) return false;  // 将不吃兵
  return att.rank >= def.rank;
}
function legalMoves(board, r, c) {
  const p = board[r][c];
  if (!p || !p.up) return [];
  const out = [];
  const cannon = p.rank === 2;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr > 3 || nc < 0 || nc > 7) continue;
    const t = board[nr][nc];
    if (!t) out.push({ r: nr, c: nc, cap: false });
    else if (!cannon && t.side !== p.side && canCapture(p, t)) out.push({ r: nr, c: nc, cap: true });
  }
  if (cannon) {
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc, screen = false;
      while (nr >= 0 && nr <= 3 && nc >= 0 && nc <= 7) {
        const t = board[nr][nc];
        if (!screen) { if (t) screen = true; }
        else if (t) { if (t.side !== p.side) out.push({ r: nr, c: nc, cap: true }); break; }
        nr += dr; nc += dc;
      }
    }
  }
  return out;
}
function hasAction(board, role, red) {
  if (red === null) return true;
  const myColor = red === role ? 'red' : 'black';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
    const cell = board[r][c];
    if (!cell) continue;
    if (!cell.up) return true;
    if (cell.side === myColor && legalMoves(board, r, c).length) return true;
  }
  return false;
}

Page({
  data: {
    theme: 'sakura', role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, turnSeat: 'red', mySeat: 'red', myTurn: false, myColor: null,
    view: [], sel: null, targets: {}, winner: null, winnerText: '', requestPending: false, rulesOpen: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    this.setData({ mySeat: rt.seatOf(room.getRole()) });
    ident.bind(this, { onChange: () => this.applyState() });
  },
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'banqi', s => { this._state = s; this.applyState(); });
  },
  onUnload() { rt.teardown(this); ident.teardown(this); },

  fresh() { return { board: buildBoard(), turn: rt.RED, red: null, winner: null, req: null }; },
  startMatch() { this._recorded = false; rt.setState('banqi', this.fresh()); },
  requestRestart() { rt.requestRestart('banqi', this._state, room.getRole(), !!this.data.winner, () => this.fresh()); },
  cancelReq() { rt.cancelRestart('banqi', this._state); },
  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({ title: '认输', content: '确定认输吗？', confirmText: '认输', confirmColor: '#e85a86',
      success: r => { if (r.confirm) rt.resign('banqi', this._state, room.getRole()); } });
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
        success: r => { if (r.confirm) rt.acceptRestart('banqi', () => me.fresh()); else rt.rejectRestart('banqi', me._state); } });
    } else if (reqSide !== 'peer') this._restartPrompted = false;

    if (!s || !s.board) { this.setData(Object.assign({ started: false }, patch)); return; }
    this._board = s.board;
    const winner = s.winner || null;
    const turnSeat = s.turn || rt.RED;
    const red = s.red || null;   // role 字符串
    const myColor = red ? (red === role ? 'red' : 'black') : null;
    const view = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
      const cell = s.board[r][c];
      view.push({ r, c, empty: !cell, up: cell && cell.up, side: cell && cell.side, name: cell && cell.name });
    }
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 赢了';
    if (winner && !this._recorded) { this._recorded = true; rt.recordPvp('banqi', rt.myResult(winner, this.data.mySeat), role); }
    Object.assign(patch, { started: true, turnSeat, myTurn: !winner && turnSeat === this.data.mySeat, myColor, view, winner, winnerText });
    this.setData(patch);
  },

  onCellTap(e) {
    if (!this.data.myTurn || this.data.winner) return;
    const r = e.currentTarget.dataset.r, c = e.currentTarget.dataset.c;
    const role = room.getRole();
    const s = this._state;
    const board = s.board.map(row => row.map(cell => cell ? Object.assign({}, cell) : null));
    const cell = board[r][c];

    // 已选中 → 尝试落子
    if (this.data.sel) {
      const key = r + '_' + c;
      if (this.data.targets[key]) {
        const src = this.data.sel;
        board[r][c] = board[src.r][src.c];
        board[src.r][src.c] = null;
        this.commit(board, role, s.red);
        return;
      }
      // 点别处：若点是自己的另一棋子→重选；否则取消
      if (cell && cell.up && cell.side === this.colorOf(role, s.red)) {
        this.select(board, r, c, role, s.red); return;
      }
      this.setData({ sel: null, targets: {} }); return;
    }

    // 未选中
    if (!cell) return;
    if (!cell.up) {
      // 翻面
      cell.up = true;
      let red = s.red;
      if (red === null) red = cell.side === 'red' ? role : (role === 'boy' ? 'girl' : 'boy');
      this.commit(board, role, red, true);
      return;
    }
    // 翻开的：只能选自己颜色的
    if (cell.side !== this.colorOf(role, s.red)) return toast('只能翻面，或选自己的棋子');
    this.select(board, r, c, role, s.red);
  },

  colorOf(role, red) { return red ? (red === role ? 'red' : 'black') : null; },
  select(board, r, c, role, red) {
    const moves = legalMoves(board, r, c);
    const targets = {};
    moves.forEach(m => { targets[m.r + '_' + m.c] = true; });
    this.setData({ sel: { r, c }, targets });
  },

  commit(board, role, red, justFlipped) {
    const s = this._state;
    const peer = role === 'boy' ? 'girl' : 'boy';
    let winner = null;
    // 先假定换手到对方，判断对方是否有棋可走
    const nextHas = hasAction(board, peer, red);
    if (!nextHas) winner = rt.seatOf(role);
    const turn = winner ? s.turn : rt.peerSeatOf(role);
    rt.setState('banqi', { board, turn, red, winner, req: null });
    this.setData({ sel: null, targets: {} });
  },

  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); }
});
