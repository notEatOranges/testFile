// junqi —— 军棋/陆战棋（功能8，双人联机）
// 12×5 棋盘：铁路(直线/工兵拐弯)、行营(安全)、大本营(藏军旗)。暗牌(己方明、对方暗，交战揭示)。
// 军衔战斗 + 工兵挖雷 + 炸弹同归 + 夺旗即胜。自动布阵(军旗入大本营、地雷在后两行)。
// 状态 games/junqi/state = { board:12×5[{side,type,rank,name}|null], turn, winner, req, ts }
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

const ROWS = 12, COLS = 5;
const CAMP = new Set();
// 行营(双方各 5，呈 X)：黑 (2,1)(2,3)(3,2)(4,1)(4,3)；红 (7,1)(7,3)(8,2)(9,1)(9,3)
[[2,1],[2,3],[3,2],[4,1],[4,3],[7,1],[7,3],[8,2],[9,1],[9,3]].forEach(p => CAMP.add(p[0] + '_' + p[1]));
const isCamp = (r, c) => CAMP.has(r + '_' + c);
const isRail = (r, c) => ((c === 0 || c === 4) && r >= 1 && r <= 10) || ((r === 1 || r === 10) && c >= 0 && c <= 4);
const inB = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const opp = s => s === 'red' ? 'black' : 'red';

const OFFICERS = [
  { type: 'siling', name: '司令', rank: 9, n: 1 }, { type: 'junzhang', name: '军长', rank: 8, n: 1 },
  { type: 'shizhang', name: '师长', rank: 7, n: 2 }, { type: 'lvzhang', name: '旅长', rank: 6, n: 2 },
  { type: 'tuanzhang', name: '团长', rank: 5, n: 2 }, { type: 'yingzhang', name: '营长', rank: 4, n: 2 },
  { type: 'lianzhang', name: '连长', rank: 3, n: 3 }, { type: 'paizhang', name: '排长', rank: 2, n: 3 },
  { type: 'gongbing', name: '工兵', rank: 1, n: 3 }
];
function buildPool() {
  const pool = [];
  OFFICERS.forEach(o => { for (let i = 0; i < o.n; i++) pool.push({ type: o.type, name: o.name, rank: o.rank }); });
  for (let i = 0; i < 2; i++) pool.push({ type: 'zhadan', name: '炸弹', rank: 0 });
  for (let i = 0; i < 3; i++) pool.push({ type: 'dilei', name: '地雷', rank: -2 });
  return pool; // 19+2+3 = 24，再加军旗 = 25
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function ownCells(side) {
  const rows = side === 'red' ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];
  const cells = [];
  for (const r of rows) for (let c = 0; c < COLS; c++) if (!isCamp(r, c)) cells.push([r, c]);
  return cells;
}
function autoDeploy(board, side) {
  const hq = side === 'red' ? [[11, 1], [11, 3]] : [[0, 1], [0, 3]];
  const back = side === 'red' ? [10, 11] : [0, 1];
  const front = side === 'red' ? 6 : 5;
  let cells = ownCells(side);
  const used = new Set();
  const take = pred => { const cands = cells.filter(p => !used.has(p[0] + '_' + p[1]) && pred(p)); const p = cands[Math.floor(Math.random() * cands.length)]; if (p) used.add(p[0] + '_' + p[1]); return p; };
  // 军旗入大本营
  const fc = hq[Math.floor(Math.random() * 2)]; used.add(fc[0] + '_' + fc[1]); board[fc[0]][fc[1]] = { side, type: 'junqi', name: '军旗', rank: -3 };
  // 地雷在后两行(3 颗)
  for (let i = 0; i < 3; i++) { const p = take(c => back.includes(c[0])); if (p) board[p[0]][p[1]] = { side, type: 'dilei', name: '地雷', rank: -2 }; }
  // 炸弹不在最前线(2 颗)
  for (let i = 0; i < 2; i++) { const p = take(c => c[0] !== front); if (p) board[p[0]][p[1]] = { side, type: 'zhadan', name: '炸弹', rank: 0 }; }
  // 其余 18 军衔随机填
  const rest = shuffle(buildPool()); let ri = 0;
  for (const p of cells) if (!used.has(p[0] + '_' + p[1]) && ri < rest.length) board[p[0]][p[1]] = Object.assign({ side }, rest[ri++]);
}
function buildBoard() { const b = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); autoDeploy(b, 'red'); autoDeploy(b, 'black'); return b; }

function movableType(p) { return p && p.type !== 'dilei' && p.type !== 'junqi'; }
function canStop(board, nr, nc, side) {
  if (!inB(nr, nc)) return false;
  const t = board[nr][nc];
  if (!t) return 'move';
  if (t.side === opp(side) && !isCamp(nr, nc)) return 'cap';
  return false;
}
function reachable(board, r, c) {
  const p = board[r][c]; if (!p || !movableType(p)) return {};
  const out = {};
  const orth = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  // 公路 1 步
  orth.forEach(([dr, dc]) => { const s = canStop(board, r + dr, c + dc, p.side); if (s) out[(r + dr) + '_' + (c + dc)] = s; });
  // 铁路
  if (isRail(r, c)) {
    if (p.type === 'gongbing') {
      // 工兵：沿铁路 BFS，可拐弯
      const vis = new Set([r + '_' + c]); const q = [[r, c]];
      while (q.length) {
        const [cr, cc] = q.shift();
        orth.forEach(([dr, dc]) => { const nr = cr + dr, nc = cc + dc; const k = nr + '_' + nc; if (!isRail(nr, nc) || vis.has(k)) return; vis.add(k); const s = canStop(board, nr, nc, p.side); if (s === 'move') { out[k] = 'move'; q.push([nr, nc]); } else if (s === 'cap') { out[k] = 'cap'; } });
      }
    } else {
      // 非 工兵：铁路直线，不拐弯
      orth.forEach(([dr, dc]) => { let nr = r + dr, nc = c + dc; while (isRail(nr, nc)) { const s = canStop(board, nr, nc, p.side); if (s === 'move') { out[nr + '_' + nc] = 'move'; } else if (s === 'cap') { out[nr + '_' + nc] = 'cap'; break; } else break; nr += dr; nc += dc; } });
    }
  }
  return out;
}
function combat(att, def) {
  if (def.type === 'junqi') return { flag: true };
  if (def.type === 'dilei') return att.type === 'gongbing' ? { def: true } : { att: true };
  if (att.type === 'zhadan' || def.type === 'zhadan') return { att: true, def: true };
  if (att.rank > def.rank) return { def: true };
  if (att.rank < def.rank) return { att: true };
  return { att: true, def: true };
}
function hasMovable(board, side) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = board[r][c]; if (p && p.side === side && movableType(p) && Object.keys(reachable(board, r, c)).length) return true; }
  return false;
}

Page({
  data: {
    theme: 'sakura', role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, mySeat: 'red', myColor: 'red', myTurn: false,
    view: [], sel: null, targets: {}, winner: null, winnerText: '', requestPending: false, rulesOpen: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    const mySeat = rt.seatOf(room.getRole());
    this.setData({ mySeat, myColor: mySeat === 'red' ? 'red' : 'black' });
    ident.bind(this, { onChange: () => this.applyState() });
  },
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'junqi', s => { this._state = s; this.applyState(); });
  },
  onUnload() { rt.teardown(this); ident.teardown(this); },

  fresh() { return { board: buildBoard(), turn: 'red', winner: null, req: null }; },
  startMatch() { this._recorded = false; rt.setState('junqi', this.fresh()); },
  requestRestart() { rt.requestRestart('junqi', this._state, room.getRole(), !!this.data.winner, () => this.fresh()); },
  cancelReq() { rt.cancelRestart('junqi', this._state); },
  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({ title: '认输', content: '确定认输吗？', confirmText: '认输', confirmColor: '#e85a86',
      success: r => { if (r.confirm) rt.resign('junqi', this._state, room.getRole()); } });
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
        success: r => { if (r.confirm) rt.acceptRestart('junqi', () => me.fresh()); else rt.rejectRestart('junqi', me._state); } });
    } else if (reqSide !== 'peer') this._restartPrompted = false;

    if (!s || !s.board) { this.setData(Object.assign({ started: false }, patch)); return; }
    this._board = s.board;
    const winner = s.winner || null;
    const turn = s.turn || 'red';
    if (winner && !this._recorded) { this._recorded = true; rt.recordPvp('junqi', rt.myResult(winner, this.data.mySeat), role); }
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 胜';
    const myColor = this.data.myColor;
    const view = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cell = s.board[r][c];
      view.push({ r, c, camp: isCamp(r, c), rail: isRail(r, c),
        mine: cell && cell.side === myColor ? (cell.name) : (cell ? '军' : ''),  // 己方明、对方暗牌
        side: cell && cell.side });
    }
    Object.assign(patch, { started: true, myTurn: !winner && turn === myColor, view, winner, winnerText });
    this.setData(patch);
  },

  onCellTap(e) {
    if (!this.data.myTurn || this.data.winner) return;
    const r = e.currentTarget.dataset.r, c = e.currentTarget.dataset.c;
    const role = room.getRole();
    const s = this._state;
    const board = s.board.map(row => row.map(x => x ? Object.assign({}, x) : null));
    const myColor = this.data.myColor;

    if (this.data.sel) {
      const key = r + '_' + c;
      if (this.data.targets[key]) {
        const src = this.data.sel;
        const att = board[src.r][src.c], def = board[r][c];
        let winner = null;
        if (def) {
          const res = combat(att, def);
          if (res.flag) { board[r][c] = att; board[src.r][src.c] = null; winner = rt.seatOf(role); toast('夺取军旗！你赢了'); }
          else {
            board[src.r][src.c] = null;
            if (res.def) board[r][c] = null;
            if (!res.att) board[r][c] = att;
            const a = att.name, d = def.name;
            toast(res.att && res.def ? (a + ' 与 ' + d + ' 同归于尽') : (res.att ? a + ' 阵亡' : a + ' 击毁 ' + d));
          }
        } else {
          board[r][c] = att; board[src.r][src.c] = null;
        }
        const enemy = opp(myColor);
        if (!winner && !hasMovable(board, enemy)) winner = rt.seatOf(role);
        rt.setState('junqi', { board, turn: winner ? myColor : enemy, winner, req: null });
        this.setData({ sel: null, targets: {} });
        return;
      }
      const cell = board[r][c];
      if (cell && cell.side === myColor && movableType(cell)) { this.select(board, r, c); return; }
      this.setData({ sel: null, targets: {} }); return;
    }
    const cell = board[r][c];
    if (!cell || cell.side !== myColor) return toast('选自己的棋子');
    if (!movableType(cell)) return toast('地雷和军旗不能移动');
    this.select(board, r, c);
  },
  select(board, r, c) {
    const tg = reachable(board, r, c);
    if (!Object.keys(tg).length) return toast('这枚棋子无路可走');
    this.setData({ sel: { r, c }, targets: tg });
  },

  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); }
});
