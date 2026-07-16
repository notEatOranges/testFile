// monopoly —— 大富翁（功能8，双人联机，横屏）
// 状态 games/monopoly/state = { cells:[{name,type,price,rent,owner}], pos:{boy,girl}, cash:{boy,girl}, turn, dice:[a,b], log:[], winner, req, ts }
// type: start | property | chance | tax。掷骰移动→买地/收租/机会/缴税→破产判负。
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

const START_CASH = 1500;
const NAMES = ['棉花糖摊', '奶茶店', '电影院', '咖啡馆', '书店', '花店', '游乐场', '海滩', '摩天轮', '甜品屋', '民宿', '烟火大会', '星空营地', '音乐节', '滑雪场', '温泉', '灯塔', '古镇'];
const CHANCE = ['捡到 80 零花钱', '请客吃饭 -60', '奖金 +120', '修车 -100', '红包 +150', '捐款 -70', '利息 +50', '违章 -90'];
const BOARD = 24;   // 环形格数

function buildCells() {
  const cells = [];
  let ni = 0;
  for (let i = 0; i < BOARD; i++) {
    if (i === 0) cells.push({ name: '起点', type: 'start', price: 0, rent: 0, owner: null });
    else if (i === 5 || i === 11 || i === 17) cells.push({ name: '机会', type: 'chance', price: 0, rent: 0, owner: null });
    else if (i === 9 || i === 21) cells.push({ name: '缴税', type: 'tax', price: 0, rent: 0, owner: null });
    else { const price = 100 + i * 25; cells.push({ name: NAMES[ni++] || ('地块' + i), type: 'property', price, rent: Math.round(price * 0.3), owner: null }); }
  }
  return cells;
}
function cellCR(i) {
  if (i <= 6) return [0, 6 - i];
  if (i <= 12) return [i - 6, 0];
  if (i <= 18) return [6, i - 12];
  return [6 - (i - 18), 6];
}

Page({
  data: {
    theme: 'sakura', role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, turnSeat: 'red', mySeat: 'red', myTurn: false,
    dice: [1, 1], log: [], myCash: START_CASH, peerCash: START_CASH, myPos: 0, peerPos: 0,
    ownerMap: [], winner: null, winnerText: '', rolling: false, requestPending: false, rulesOpen: false
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
    rt.bind(this, 'monopoly', s => { this._state = s; this.applyState(); });
  },
  onUnload() { rt.teardown(this); ident.teardown(this); },

  fresh() {
    return {
      cells: buildCells(), pos: { boy: 0, girl: 0 }, cash: { boy: START_CASH, girl: START_CASH },
      turn: rt.RED, dice: [1, 1], log: [], winner: null, req: null
    };
  },
  startMatch() { this._recorded = false; rt.setState('monopoly', this.fresh()); },
  requestRestart() { rt.requestRestart('monopoly', this._state, room.getRole(), !!this.data.winner, () => this.fresh()); },
  cancelReq() { rt.cancelRestart('monopoly', this._state); },
  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({
      title: '认输', content: '确定认输吗？将判定破产', confirmText: '认输', confirmColor: '#e85a86',
      success: r => { if (r.confirm) rt.resign('monopoly', this._state, room.getRole()); }
    });
  },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#board').fields({ node: true, size: true }).exec(res => {
      const f = res[0];
      if (!f || !f.node) { setTimeout(() => this.setupCanvas(), 80); return; }
      const cv = f.node, w = f.width, h = f.height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.S = Math.min(w, h); this.bo = (w - this.S) / 2; this.vo = (h - this.S) / 2;
      this.applyState();
    });
  },

  applyState() {
    const s = this._state, role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    const patch = {};
    const reqSide = rt.restartReqSide(s && s.req, role);
    patch.requestPending = reqSide === 'mine';
    if (reqSide === 'peer' && !this._restartPrompted) {
      this._restartPrompted = true;
      const me = this;
      wx.showModal({ title: '重新开局请求', content: (names[s.req.by] || '对方') + ' 请求重新开局，同意？', confirmText: '同意', cancelText: '拒绝',
        success: r => { if (r.confirm) rt.acceptRestart('monopoly', () => me.fresh()); else rt.rejectRestart('monopoly', me._state); } });
    } else if (reqSide !== 'peer') this._restartPrompted = false;

    if (!s || !s.cells) { this.setData(Object.assign({ started: false }, patch)); this.draw(); return; }
    this._cells = s.cells;
    const roleKey = role, peerKey = peer;
    const winner = s.winner || null;
    const turnSeat = s.turn || rt.RED;
    const ownerMap = s.cells.map(c => c.type === 'property' ? (c.owner || '') : '');
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 获胜';
    if (winner && !this._recorded) { this._recorded = true; rt.recordPvp('monopoly', rt.myResult(winner, this.data.mySeat), role); }
    Object.assign(patch, {
      started: true, turnSeat, myTurn: !winner && turnSeat === this.data.mySeat,
      dice: s.dice || [1, 1], log: (s.log || []).slice(-6),
      myCash: (s.cash && s.cash[roleKey]) || 0, peerCash: (s.cash && s.cash[peerKey]) || 0,
      myPos: (s.pos && s.pos[roleKey]) || 0, peerPos: (s.pos && s.pos[peerKey]) || 0,
      ownerMap, winner, winnerText
    });
    this.setData(patch);
    this.draw();
  },

  async roll() {
    if (!this.data.myTurn || this.data.winner || this.data.rolling) return;
    const role = room.getRole();
    const s = this._state;
    const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
    const steps = a + b;
    this.setData({ rolling: true, dice: [a, b] });
    // 计算落点（含经过起点）
    const from = s.pos[role];
    let to = (from + steps) % BOARD;
    const crossedStart = (from + steps) >= BOARD;
    let cash = Object.assign({}, s.cash);
    cash[role] = (cash[role] || 0) + (crossedStart ? 200 : 0);
    const log = (s.log || []).slice();
    log.push((role === 'boy' ? this.data.myName : this.data.myName) + ' 掷出 ' + steps + (crossedStart ? '，过起点 +200' : ''));

    // 先写入移动后的中间态（让对方看到骰子+走子），再结算
    const moved = Object.assign({}, s, { pos: Object.assign({}, s.pos, { [role]: to }), cash, dice: [a, b], turn: s.turn, log });
    this._state = moved; this.applyState();
    await this.resolveCell(role, to, cash, log, s.turn);
    this.setData({ rolling: false });
  },

  async resolveCell(role, idx, cash, log, turn) {
    const cells = this._cells;
    const cell = cells[idx];
    const names = { boy: this.data.myName, girl: this.data.peerName };
    const peer = role === 'boy' ? 'girl' : 'boy';
    let winner = null;

    if (cell.type === 'start') {
      cash[role] = (cash[role] || 0) + 100; log.push('到达起点 +100');
    } else if (cell.type === 'tax') {
      cash[role] = (cash[role] || 0) - 100; log.push('缴税 -100');
    } else if (cell.type === 'chance') {
      const c = CHANCE[Math.floor(Math.random() * CHANCE.length)];
      const m = parseInt(c.replace(/.*?([+-]?\d+).*/, '$1'), 10) || 0;
      cash[role] = (cash[role] || 0) + m; log.push('机会：' + c);
    } else if (cell.type === 'property') {
      if (!cell.owner) {
        // 弹窗问是否购买（仅当前回合方）
        const buy = await new Promise(res => {
          if (cash[role] < cell.price) { res(false); return; }
          wx.showModal({ title: cell.name, content: '花 ' + cell.price + ' 买下这块地？（过路费 ' + cell.rent + '）', confirmText: '买下', cancelText: '不买',
            success: r => res(!!r.confirm) });
        });
        if (buy) {
          cash[role] = (cash[role] || 0) - cell.price;
          cells[idx] = Object.assign({}, cell, { owner: role });
          log.push('买下「' + cell.name + '」-' + cell.price);
        }
      } else if (cell.owner === role) {
        log.push('回到自己的「' + cell.name + '」');
      } else {
        const rent = cell.rent;
        cash[role] = (cash[role] || 0) - rent;
        cash[peer] = (cash[peer] || 0) + rent;
        log.push('路过' + (names[cell.owner] || 'ta') + '的「' + cell.name + '」，付过路费 ' + rent);
      }
    }
    // 破产判定
    if (cash[role] < 0) { winner = role === 'boy' ? rt.BLUE : rt.RED; log.push((names[role] || 'ta') + ' 破产了！'); }

    const nextTurn = winner ? turn : (turn === rt.RED ? rt.BLUE : rt.RED);
    rt.setState('monopoly', { cells: this._cells.map(c => Object.assign({}, c)), pos: this._state.pos, cash, turn: nextTurn, dice: this.data.dice, log: log.slice(-12), winner, req: null });
  },

  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); this._cs = false; setTimeout(() => this.setupCanvas(), 60); },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, S = this.S, bo = this.bo, vo = this.vo, cs = S / 7;
    ctx.clearRect(0, 0, 9999, 9999);
    ctx.fillStyle = '#f3e9d2'; ctx.fillRect(bo, vo, S, S);
    // 中心信息
    ctx.fillStyle = '#fff8ec'; ctx.fillRect(bo + cs, vo + cs, S - cs * 2, S - cs * 2);
    ctx.fillStyle = '#b58a5a'; ctx.font = 'bold ' + Math.round(cs * 0.5) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('大富翁', bo + S / 2, vo + S / 2 - cs * 0.4);
    ctx.font = Math.round(cs * 0.26) + 'px sans-serif'; ctx.fillStyle = '#9a7a52';
    const dn = this.data.dice;
    ctx.fillText('骰子 ' + dn[0] + ' + ' + dn[1] + ' = ' + (dn[0] + dn[1]), bo + S / 2, vo + S / 2 + cs * 0.2);
    // 格子
    const cells = this._cells || [];
    for (let i = 0; i < BOARD; i++) {
      const [c, r] = cellCR(i);
      const x = bo + c * cs, y = vo + r * cs;
      const cell = cells[i] || {};
      ctx.strokeStyle = '#cdb088'; ctx.lineWidth = 1; ctx.strokeRect(x, y, cs, cs);
      // 产权色条
      if (cell.type === 'property' && cell.owner) { ctx.fillStyle = cell.owner === 'boy' ? '#e85a86' : '#3a86ff'; ctx.fillRect(x, y + cs - 8, cs, 8); }
      if (cell.type === 'start') ctx.fillStyle = '#3aa75c'; else if (cell.type === 'chance') ctx.fillStyle = '#e8b94d'; else if (cell.type === 'tax') ctx.fillStyle = '#e85a86'; else ctx.fillStyle = '#7a5c3a';
      ctx.font = Math.round(cs * 0.2) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      this.wrapText(ctx, cell.name || '', x + cs / 2, y + 4, cs - 4, cs * 0.24);
    }
    // 棋子
    const drawTok = (pos, color, off) => {
      const [c, r] = cellCR(pos);
      const x = bo + c * cs + cs / 2 + off, y = vo + r * cs + cs * 0.62;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, cs * 0.12, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    };
    if (this.data.started) { drawTok(this.data.myPos, this.data.mySeat === 'red' ? '#e85a86' : '#3a86ff', -cs * 0.14); drawTok(this.data.peerPos, this.data.mySeat === 'red' ? '#3a86ff' : '#e85a86', cs * 0.14); }
  },
  wrapText(ctx, text, x, y, maxW, lh) {
    let line = '';
    for (let i = 0; i < text.length; i++) {
      const test = line + text[i];
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = text[i]; y += lh; }
      else line = test;
    }
    ctx.fillText(line, x, y);
  }
});
