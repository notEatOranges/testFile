// gomoku —— 五子棋（功能8，双人实时联机）
// 状态 games/gomoku/state = { board:15×15(0空/1红/2蓝), turn:'red'|'blue', last:{r,c}, winner, moves, ts }
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
    rulesOpen: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    this.setData({ mySeat: rt.seatOf(room.getRole()) });
    ident.bind(this, { onChange: () => this.applyState() });
    this.setupCanvas();
  },
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'gomoku', s => { this._state = s; this.applyState(); });
  },
  onUnload() { rt.teardown(this); ident.teardown(this); },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this)
      .select('#board').fields({ node: true, size: true, rect: true }).exec(res => {
        if (!res[0]) return;
        const cv = res[0].node, w = res[0].width, h = res[0].height;
        cv.width = w * dpr; cv.height = h * dpr;
        const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
        this.ctx = ctx; this.W = w; this.step = w / (N + 1);
        this.rect = { left: res[0].left, top: res[0].top };
        this.applyState();
      });
  },

  applyState() {
    const s = this._state;
    const role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    if (!s || !s.board) { this.setData({ started: false }); this.draw(); return; }
    this._board = s.board;
    this._winLine = s.winLine || null;
    const winner = s.winner || null;
    const turnSeat = s.turn || rt.RED;
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 赢了';
    this.setData({
      started: true,
      turnSeat,
      myTurn: !winner && turnSeat === this.data.mySeat,
      winner, winnerText,
      last: s.last || null,
      moves: s.moves || 0
    });
    this.draw();
  },

  startMatch() {
    rt.setState('gomoku', { board: emptyBoard(), turn: rt.RED, last: null, winner: null, moves: 0 });
  },
  restart() { this.startMatch(); },
  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); },

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

  onTouchEnd(e) {
    if (!this.data.started) return;
    if (this.data.winner) return;
    if (!this.data.myTurn) return toast('等对方落子');
    const t = e.changedTouches[0];
    const x = t.clientX - this.rect.left, y = t.clientY - this.rect.top;
    const c = Math.round(x / this.step - 1), r = Math.round(y / this.step - 1);
    if (r < 0 || r >= N || c < 0 || c >= N) return;
    const board = this._board.map(row => row.slice());
    if (board[r][c] !== EMPTY) return;
    const me = SEAT_VAL[this.data.mySeat];
    board[r][c] = me;
    const winLine = checkWin(board, r, c, me);
    const moves = (this.data.moves || 0) + 1;
    const mySeat = this.data.mySeat;
    const nextTurn = mySeat === rt.RED ? rt.BLUE : rt.RED;
    const nextState = { board, turn: winLine ? mySeat : nextTurn, last: { r, c }, winner: null, moves };
    if (winLine) { nextState.winner = mySeat; nextState.winLine = winLine; this._winLine = winLine; }
    else if (moves >= N * N) { nextState.winner = 'draw'; }
    rt.setState('gomoku', nextState);
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.W, step = this.step, board = this._board;
    ctx.clearRect(0, 0, W, W);
    // 棋盘底
    ctx.fillStyle = '#f6ead0'; ctx.fillRect(0, 0, W, W);
    // 网格
    ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      const p = step * (i + 1);
      ctx.beginPath(); ctx.moveTo(step, p); ctx.lineTo(step * N, p); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p, step); ctx.lineTo(p, step * N); ctx.stroke();
    }
    // 天元 + 星位
    ctx.fillStyle = '#c9a06a';
    [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]].forEach(([r, c]) => { ctx.beginPath(); ctx.arc(step * (c + 1), step * (r + 1), 3, 0, 7); ctx.fill(); });
    // 棋子
    if (board) {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const v = board[r][c]; if (!v) continue;
        const x = step * (c + 1), y = step * (r + 1), rad = step * 0.42;
        ctx.fillStyle = STONE[v]; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.3, 0, 7); ctx.fill();
      }
    }
    // 最后一手标记
    if (this.data.last) {
      const { r, c } = this.data.last;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(step * (c + 1), step * (r + 1), step * 0.18, 0, 7); ctx.stroke();
    }
    // 胜利连线
    if (this.data.winner && this.data.winner !== 'draw' && this._winLine) {
      ctx.strokeStyle = '#2ec24e'; ctx.lineWidth = 4;
      const a = this._winLine[0], b = this._winLine[this._winLine.length - 1];
      ctx.beginPath(); ctx.moveTo(step * (a[1] + 1), step * (a[0] + 1)); ctx.lineTo(step * (b[1] + 1), step * (b[0] + 1)); ctx.stroke();
    }
  }
});
