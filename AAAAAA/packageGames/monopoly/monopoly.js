// monopoly —— 大富翁（功能8，双人联机，竖屏）
// 28 格环形棋盘(8×8 外圈)，6 色组地块/机会/突发事件/缴税/监狱/奖金/车站。
// 掷骰(翻转动画)→移动→结算(抽牌有洗牌+翻牌动画)→破产判负。
// 状态 games/monopoly/state = { cells, pos:{boy,girl}, cash:{boy,girl}, skip:{boy,girl}, turn, dice, log, winner, req, ts }
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

const START_CASH = 1500;
const BOARD = 28;
const DECK = [
  { t: '生日红包 +200', cash: 200 }, { t: '修车费 -100', cash: -100 }, { t: '中奖 +150', cash: 150 },
  { t: '请客吃饭 -80', cash: -80 }, { t: '理财收益 +120', cash: 120 }, { t: '违章罚款 -90', cash: -90 },
  { t: '退税 +100', cash: 100 }, { t: '医药费 -150', cash: -150 }, { t: '前进到起点', to: 0 },
  { t: '进了医院，停一回合', skip: true }, { t: '捡到钱包 +80', cash: 80 }, { t: '爱心捐款 -60', cash: -60 },
  { t: '股票大涨 +180', cash: 180 }, { t: '丢了手机 -120', cash: -120 }
];
const GROUP_COLOR = ['#9b7fd4', '#3a86ff', '#06d6a0', '#ffb703', '#e85a86', '#fb8500'];

function buildCells() {
  const prop = (name, g) => ({ name, type: 'property', group: g, price: 80 + g * 60, rent: 40 + g * 30, owner: null });
  return [
    { name: '起点', type: 'start' }, prop('棉花糖摊', 0), prop('奶茶店', 0), { name: '机会', type: 'card', kind: 'chance' },
    prop('电影院', 1), { name: '缴税', type: 'tax', amt: 100 }, prop('咖啡馆', 1), prop('书店', 1),
    { name: '监狱', type: 'jail' }, prop('花店', 2), { name: '奖金', type: 'bonus', amt: 150 }, prop('游乐场', 2),
    { name: '突发事件', type: 'card', kind: 'fate' }, prop('海滩', 2), prop('摩天轮', 3), { name: '缴税', type: 'tax', amt: 120 },
    prop('甜品屋', 3), { name: '机会', type: 'card', kind: 'chance' }, prop('民宿', 3), prop('烟火大会', 4),
    { name: '车站', type: 'bonus', amt: 100 }, prop('星空营地', 4), { name: '突发事件', type: 'card', kind: 'fate' },
    prop('音乐节', 4), prop('滑雪场', 5), { name: '缴税', type: 'tax', amt: 150 }, prop('温泉', 5), prop('灯塔', 5)
  ];
}
function cellCR(i) {
  if (i <= 7) return [i, 7];
  if (i <= 14) return [7, 14 - i];
  if (i <= 21) return [21 - i, 0];
  return [0, i - 21];
}

Page({
  data: {
    theme: 'sakura', role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, turnSeat: 'red', mySeat: 'red', myTurn: false,
    dice: [1, 1], diceAnim: false, log: [], myCash: START_CASH, peerCash: START_CASH, myPos: 0, peerPos: 0,
    ownerMap: [], winner: null, winnerText: '', rolling: false, requestPending: false, rulesOpen: false,
    card: null   // 抽牌动画：{drawing, text}
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
  onUnload() { rt.teardown(this); ident.teardown(this); if (this._diceTimer) clearInterval(this._diceTimer); },

  fresh() {
    return { cells: buildCells(), pos: { boy: 0, girl: 0 }, cash: { boy: START_CASH, girl: START_CASH }, skip: { boy: 0, girl: 0 }, turn: rt.RED, dice: [1, 1], log: [], winner: null, req: null };
  },
  startMatch() { this._recorded = false; rt.setState('monopoly', this.fresh()); },
  requestRestart() { rt.requestRestart('monopoly', this._state, room.getRole(), !!this.data.winner, () => this.fresh()); },
  cancelReq() { rt.cancelRestart('monopoly', this._state); },
  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({ title: '认输', content: '确定认输吗？将判定破产', confirmText: '认输', confirmColor: '#e85a86',
      success: r => { if (r.confirm) rt.resign('monopoly', this._state, room.getRole()); } });
  },

  setupCanvas() {
    const dpr = wx.getSystemInfoSync().pixelRatio;
    wx.createSelectorQuery().in(this).select('#board').fields({ node: true, size: true }).exec(res => {
      const f = res[0];
      if (!f || !f.node) { setTimeout(() => this.setupCanvas(), 80); return; }
      const cv = f.node, w = f.width, h = f.height;
      cv.width = w * dpr; cv.height = h * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      this.ctx = ctx; this.W = w; this.H = h;
      this.cs = Math.min(w, h) / 8;            // 8×8 棋盘，按短边缩放并居中
      this.ox = (w - 8 * this.cs) / 2;
      this.oy = (h - 8 * this.cs) / 2;
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
    const winner = s.winner || null;
    const turnSeat = s.turn || rt.RED;
    const ownerMap = s.cells.map(c => (c && c.type === 'property') ? (c.owner || '') : '');
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 获胜';
    if (winner && !this._recorded) { this._recorded = true; rt.recordPvp('monopoly', rt.myResult(winner, this.data.mySeat), role); }
    Object.assign(patch, {
      started: true, turnSeat, myTurn: !winner && turnSeat === this.data.mySeat,
      dice: s.dice || [1, 1], log: (s.log || []).slice(-7),
      myCash: (s.cash && s.cash[role]) || 0, peerCash: (s.cash && s.cash[peer]) || 0,
      myPos: (s.pos && s.pos[role]) || 0, peerPos: (s.pos && s.pos[peer]) || 0,
      ownerMap, winner, winnerText
    });
    this.setData(patch);
    this.draw();
  },

  async roll() {
    if (!this.data.myTurn || this.data.winner || this.data.rolling) return;
    const role = room.getRole();
    const s = this._state;
    this.setData({ rolling: true, diceAnim: true });
    // 骰子翻转动画
    let ticks = 0;
    await new Promise(res => {
      this._diceTimer = setInterval(() => {
        this.setData({ dice: [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)] });
        if (++ticks >= 8) { clearInterval(this._diceTimer); this._diceTimer = null; res(); }
      }, 80);
    });
    const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
    const steps = a + b;
    this.setData({ diceAnim: false, dice: [a, b] });

    const from = s.pos[role];
    const crossed = (from + steps) >= BOARD;
    const to = (from + steps) % BOARD;
    let cash = Object.assign({}, s.cash);
    if (crossed) cash[role] = (cash[role] || 0) + 200;
    const log = (s.log || []).slice();
    log.push((role === 'boy' ? this.data.myName : this.data.myName) + ' 掷出 ' + steps + (crossed ? '，过起点 +200' : ''));
    this._state = Object.assign({}, s, { pos: Object.assign({}, s.pos, { [role]: to }), cash, dice: [a, b], log });
    this.applyState();
    await this.resolve(role, to, cash, log, s.turn);
    this.setData({ rolling: false });
  },

  drawCard() {
    return new Promise(res => {
      this.setData({ card: { drawing: true, text: '' } });
      setTimeout(() => {
        const c = DECK[Math.floor(Math.random() * DECK.length)];
        this.setData({ card: { drawing: false, text: c.t } });
        setTimeout(() => { this.setData({ card: null }); }, 1600);
        res(c);
      }, 650);
    });
  },

  async resolve(role, idx, cash, log, turn) {
    const cells = this._cells;
    const cell = cells[idx];
    const names = { boy: this.data.myName, girl: this.data.peerName };
    const peer = role === 'boy' ? 'girl' : 'boy';
    let skip = Object.assign({}, this._state.skip || { boy: 0, girl: 0 });
    let winner = null;
    let toIdx = idx;

    if (cell.type === 'start') { cash[role] += 100; log.push('到达起点 +100'); }
    else if (cell.type === 'tax') { cash[role] -= cell.amt; log.push((cell.name) + ' -' + cell.amt); }
    else if (cell.type === 'bonus') { cash[role] += cell.amt; log.push(cell.name + ' +' + cell.amt); }
    else if (cell.type === 'jail') { skip[role] = (skip[role] || 0) + 1; log.push('进了监狱，下回合停留一次'); }
    else if (cell.type === 'card') {
      const card = await this.drawCard();
      log.push((cell.kind === 'fate' ? '突发事件：' : '机会：') + card.t);
      if (card.cash) cash[role] = (cash[role] || 0) + card.cash;
      if (card.to === 0) { cash[role] += 200; toIdx = 0; log.push('回到起点 +200'); }
      if (card.skip) skip[role] = (skip[role] || 0) + 1;
      // 若被牌移到起点，再结算起点格
      if (toIdx !== idx && cells[toIdx].type === 'start') cash[role] += 100;
    } else if (cell.type === 'property') {
      if (!cell.owner) {
        const buy = await new Promise(res => {
          if (cash[role] < cell.price) { res(false); return; }
          wx.showModal({ title: cell.name, content: '花 ' + cell.price + ' 买下？（过路费 ' + cell.rent + '）', confirmText: '买下', cancelText: '不买', success: r => res(!!r.confirm) });
        });
        if (buy) { cash[role] -= cell.price; cells[idx] = Object.assign({}, cell, { owner: role }); log.push('买下「' + cell.name + '」-' + cell.price); }
      } else if (cell.owner === role) {
        log.push('回到自己的「' + cell.name + '」');
      } else {
        cash[role] -= cell.rent; cash[peer] += cell.rent;
        log.push('路过' + (names[cell.owner] || 'ta') + '的「' + cell.name + '」付 ' + cell.rent);
      }
    }

    if (cash[role] < 0) { winner = role === 'boy' ? rt.BLUE : rt.RED; log.push((names[role] || 'ta') + ' 破产了！'); }
    // 计算下一回合（含跳过）
    let nextRole = peer;
    if (!winner && (skip[peer] || 0) > 0) { skip[peer]--; nextRole = role; log.push((names[peer] || 'ta') + ' 停一回合'); }
    const pos = Object.assign({}, this._state.pos, { [role]: toIdx });
    rt.setState('monopoly', { cells: cells.map(c => Object.assign({}, c)), pos, cash, skip, turn: winner ? turn : rt.seatOf(nextRole), dice: this.data.dice, log: log.slice(-14), winner, req: null });
  },

  dismissCard() { this.setData({ card: null }); },
  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); setTimeout(() => this.setupCanvas(), 60); },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.W, H = this.H, cs = this.cs, ox = this.ox || 0, oy = this.oy || 0;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f3e9d2'; ctx.fillRect(ox, oy, cs * 8, cs * 8);
    ctx.fillStyle = '#fff8ec'; ctx.fillRect(ox + cs, oy + cs, cs * 6, cs * 6);
    ctx.fillStyle = '#b58a5a'; ctx.font = 'bold ' + Math.round(cs * 0.5) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('大富翁', ox + cs * 4, oy + cs * 4 - cs * 0.35);
    ctx.font = Math.round(cs * 0.24) + 'px sans-serif'; ctx.fillStyle = '#9a7a52';
    const dn = this.data.dice;
    ctx.fillText('骰 ' + dn[0] + ' + ' + dn[1] + ' = ' + (dn[0] + dn[1]), ox + cs * 4, oy + cs * 4 + cs * 0.25);

    const cells = this._cells || [];
    for (let i = 0; i < BOARD; i++) {
      const [c, r] = cellCR(i);
      const x = ox + c * cs, y = oy + r * cs;
      const cell = cells[i] || {};
      ctx.strokeStyle = '#cdb088'; ctx.lineWidth = 1; ctx.strokeRect(x, y, cs, cs);
      if (cell.type === 'property') { ctx.fillStyle = GROUP_COLOR[cell.group] || '#999'; ctx.fillRect(x, y, cs, 7); if (cell.owner) { ctx.fillStyle = cell.owner === 'boy' ? '#e85a86' : '#3a86ff'; ctx.fillRect(x, y + cs - 7, cs, 7); } }
      const cmap = { start: '#3aa75c', card: '#e8b94d', tax: '#e85a86', jail: '#7a5c3a', bonus: '#3a86ff', property: '#7a5c3a' };
      ctx.fillStyle = cmap[cell.type] || '#7a5c3a';
      ctx.font = Math.round(cs * 0.2) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      this.wrapText(ctx, cell.name || '', x + cs / 2, y + (cell.type === 'property' ? 12 : 4), cs - 4, cs * 0.22);
    }
    const drawTok = (pos, color, off) => {
      const [c, r] = cellCR(pos);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(ox + c * cs + cs / 2 + off, oy + r * cs + cs * 0.62, cs * 0.12, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    };
    if (this.data.started) {
      const myC = this.data.mySeat === 'red' ? '#e85a86' : '#3a86ff';
      const peC = this.data.mySeat === 'red' ? '#3a86ff' : '#e85a86';
      drawTok(this.data.myPos, myC, -cs * 0.14); drawTok(this.data.peerPos, peC, cs * 0.14);
    }
  },
  wrapText(ctx, text, x, y, maxW, lh) {
    let line = '';
    for (let i = 0; i < text.length; i++) {
      const test = line + text[i];
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = text[i]; y += lh; } else line = test;
    }
    ctx.fillText(line, x, y);
  }
});
