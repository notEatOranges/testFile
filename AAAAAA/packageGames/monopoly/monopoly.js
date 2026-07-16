// monopoly —— 大富翁（功能8，双人联机，竖屏）
// 28 格环形棋盘。掷骰(翻转动画)→棋子滑行动画→结算→事件好/坏特效。
// 地块 6 色组(等级递增) + 可升级(提高过路费) + 机会/突发事件/缴税/监狱/奖金/车站。
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
  const prop = (name, g) => ({ name, type: 'property', group: g, price: 80 + g * 60, rent: 40 + g * 30, owner: null, level: 0 });
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
function rentOf(cell) { return cell.rent * (1 + (cell.level || 0)); }
function upgradeCost(cell) { return Math.round(cell.price * 0.5); }
function seatShape(role) { return rt.seatOf(role) === rt.RED ? 'heart' : 'star'; }
function seatColor(role) { return rt.seatOf(role) === rt.RED ? '#ff5a5f' : '#00b8d4'; }   // 珊瑚红/青，避开地皮 6 色
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt)), b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

Page({
  data: {
    theme: 'sakura', role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, turnSeat: 'red', mySeat: 'red', myTurn: false,
    dice: [1, 1], diceAnim: false, log: [], myCash: START_CASH, peerCash: START_CASH, myPos: 0, peerPos: 0,
    winner: null, winnerText: '', rolling: false, requestPending: false, rulesOpen: false,
    card: null, fx: null   // fx: {kind:'good'|'bad', text} 事件特效
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
  onUnload() { rt.teardown(this); ident.teardown(this); if (this._diceTimer) clearInterval(this._diceTimer); if (this._raf && this.cv) this.cv.cancelAnimationFrame(this._raf); },

  fresh() {
    return { cells: buildCells(), pos: { boy: 0, girl: 0 }, cash: { boy: START_CASH, girl: START_CASH }, skip: { boy: 0, girl: 0 }, turn: Math.random() < 0.5 ? rt.RED : rt.BLUE, dice: [1, 1], log: [], winner: null, req: null };
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
      this.ctx = ctx; this.cv = cv; this.W = w; this.H = h;
      this.cs = Math.min(w, h) / 8;
      this.ox = (w - 8 * this.cs) / 2; this.oy = (h - 8 * this.cs) / 2;
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
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 获胜';
    if (winner && !this._recorded) { this._recorded = true; rt.recordPvp('monopoly', rt.myResult(winner, this.data.mySeat), role); }
    Object.assign(patch, {
      started: true, turnSeat, myTurn: !winner && turnSeat === this.data.mySeat,
      dice: s.dice || [1, 1],
      log: (s.log || []).slice(-30).reverse(),   // 最新在前，便于滚动查看
      myCash: (s.cash && s.cash[role]) || 0, peerCash: (s.cash && s.cash[peer]) || 0,
      myPos: (s.pos && s.pos[role]) || 0, peerPos: (s.pos && s.pos[peer]) || 0,
      winner, winnerText
    });
    this.setData(patch);
    this.draw();
  },

  showFx(kind, text) {
    this.setData({ fx: { kind, text } });
    setTimeout(() => { if (this.data.fx) this.setData({ fx: null }); }, 1400);
  },

  async roll() {
    if (!this.data.myTurn || this.data.winner || this.data.rolling) return;
    const role = room.getRole();
    const s = this._state;
    this.setData({ rolling: true, diceAnim: true });
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

    // 先写一次：棋子已移动 + 日志立即可见
    this._state = Object.assign({}, s, { pos: Object.assign({}, s.pos, { [role]: to }), cash, dice: [a, b], log });
    rt.setState('monopoly', this._state);

    // 棋子滑行动画（沿环形），完成后结算
    await this.animateMove(role, from, to);
    await this.resolve(role, to, cash, log, s.turn);
    this.setData({ rolling: false });
  },

  animateMove(role, from, to) {
    return new Promise(res => {
      if (!this.cv) { res(); return; }
      const target = to < from ? to + BOARD : to;
      const t0 = Date.now(); const dur = 760;
      const step = () => {
        const p = Math.min(1, (Date.now() - t0) / dur);
        const hop = Math.abs(Math.sin(p * Math.PI * 2)) * this.cs * 0.4;   // 放慢的跳动
        this._moving = { role, f: from + (target - from) * p, hop };
        this.draw();
        if (p < 1) this._raf = this.cv.requestAnimationFrame(step);
        else { this._moving = null; this.draw(); res(); }
      };
      this._raf = this.cv.requestAnimationFrame(step);
    });
  },

  drawCard() {
    return new Promise(res => {
      this.setData({ card: { drawing: true, text: '', kind: '' } });
      setTimeout(() => {
        const c = DECK[Math.floor(Math.random() * DECK.length)];
        const kind = c.cash != null ? (c.cash > 0 ? 'good' : 'bad') : (c.skip ? 'bad' : 'good');
        this.setData({ card: { drawing: false, text: c.t, kind } });   // 卡片本身用好/坏配色，与好事坏事结合
        setTimeout(() => { this.setData({ card: null }); setTimeout(() => this.setupCanvas(), 50); }, 1500);
        res(c);
      }, 650);
    });
  },

  // 写一次中间态（让事件日志及时同步给双方）
  syncLog(cells, cash, log, pos, skip, extra) {
    this._state = Object.assign({}, this._state, { cells: cells.map(c => Object.assign({}, c)), cash: Object.assign({}, cash), pos: Object.assign({}, pos), skip: Object.assign({}, skip), log: log.slice(-30) }, extra || {});
    rt.setState('monopoly', this._state);
  },

  async resolve(role, idx, cash, log, turn) {
    const cells = this._cells.map(c => Object.assign({}, c));
    const cell = cells[idx];
    const names = { boy: this.data.myName, girl: this.data.peerName };
    const peer = role === 'boy' ? 'girl' : 'boy';
    let skip = Object.assign({}, this._state.skip || { boy: 0, girl: 0 });
    let pos = Object.assign({}, this._state.pos);
    let winner = null;
    let toIdx = idx;

    if (cell.type === 'start') { cash[role] += 100; log.push('到达起点 +100'); }
    else if (cell.type === 'tax') { cash[role] -= cell.amt; log.push(cell.name + ' -' + cell.amt); this.showFx('bad', '缴税 -' + cell.amt); }
    else if (cell.type === 'bonus') { cash[role] += cell.amt; log.push(cell.name + ' +' + cell.amt); this.showFx('good', cell.name + ' +' + cell.amt); }
    else if (cell.type === 'jail') { skip[role] = (skip[role] || 0) + 1; log.push('进了监狱，下回合停留'); this.showFx('bad', '进监狱，停一回合'); }
    else if (cell.type === 'card') {
      const card = await this.drawCard();
      log.push((cell.kind === 'fate' ? '突发事件：' : '机会：') + card.t);
      if (card.cash) cash[role] = (cash[role] || 0) + card.cash;
      if (card.to === 0) { cash[role] += 200; toIdx = 0; log.push('回到起点 +200'); }
      if (card.skip) skip[role] = (skip[role] || 0) + 1;
      this.syncLog(cells, cash, log, pos, skip);
    } else if (cell.type === 'property') {
      if (!cell.owner) {
        const buy = await new Promise(res => {
          if (cash[role] < cell.price) { res(false); return; }
          wx.showModal({ title: cell.name, content: '花 ' + cell.price + ' 买下？（过路费 ' + rentOf(cell) + '）', confirmText: '买下', cancelText: '不买', success: r => res(!!r.confirm) });
        });
        if (buy) { cash[role] -= cell.price; cells[idx] = Object.assign({}, cell, { owner: role }); log.push('买下「' + cell.name + '」-' + cell.price); this.showFx('good', '入手「' + cell.name + '」'); }
      } else if (cell.owner === role) {
        // 自己的地：可升级（最高 3 级）
        if ((cell.level || 0) < 3) {
          const up = await new Promise(res => {
            const cost = upgradeCost(cell);
            if (cash[role] < cost) { res(false); return; }
            wx.showModal({ title: '升级「' + cell.name + '」', content: '升到 ' + ((cell.level || 0) + 2) + ' 级？花 ' + cost + '（过路费变 ' + (rentOf(cell) + cell.rent) + '）', confirmText: '升级', cancelText: '不了', success: r => res(!!r.confirm) });
          });
          if (up) { cash[role] -= upgradeCost(cell); cells[idx] = Object.assign({}, cell, { level: (cell.level || 0) + 1 }); log.push('升级「' + cell.name + '」到 ' + (cells[idx].level + 1) + ' 级'); this.showFx('good', '升级！过路费上涨'); }
        } else { log.push('回到满级「' + cell.name + '」'); }
      } else {
        const r = rentOf(cell); cash[role] -= r; cash[peer] += r;
        log.push('路过' + (names[cell.owner] || 'ta') + '的「' + cell.name + '」付 ' + r);
        this.showFx('bad', '付过路费 ' + r);
      }
    }

    if (cash[role] < 0) { winner = role === 'boy' ? rt.BLUE : rt.RED; log.push((names[role] || 'ta') + ' 破产了！'); }
    if (toIdx !== idx) pos = Object.assign({}, pos, { [role]: toIdx });
    let nextRole = peer;
    if (!winner && (skip[peer] || 0) > 0) { skip[peer]--; nextRole = role; log.push((names[peer] || 'ta') + ' 停一回合'); }
    rt.setState('monopoly', { cells: cells.map(c => Object.assign({}, c)), pos, cash, skip, turn: winner ? turn : rt.seatOf(nextRole), dice: this.data.dice, log: log.slice(-30), winner, req: null });
  },

  dismissCard() { this.setData({ card: null }); setTimeout(() => this.setupCanvas(), 50); },
  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); setTimeout(() => this.setupCanvas(), 60); },

  tokenXY(f) {
    const i0 = Math.floor(f) % BOARD, i1 = (i0 + 1) % BOARD, fr = f - Math.floor(f);
    const [c0, r0] = cellCR(i0), [c1, r1] = cellCR(i1);
    const c = c0 + (c1 - c0) * fr, r = r0 + (r1 - r0) * fr;
    return [this.ox + c * this.cs + this.cs / 2, this.oy + r * this.cs + this.cs * 0.58];
  },
  drawShape(ctx, cx, cy, s, kind, fill, stroke) {
    ctx.fillStyle = fill; ctx.strokeStyle = stroke || '#fff'; ctx.lineWidth = s * 0.18;
    ctx.beginPath();
    if (kind === 'heart') {
      ctx.moveTo(cx, cy + s * 0.85);
      ctx.bezierCurveTo(cx - s * 1.3, cy + s * 0.15, cx - s * 0.6, cy - s * 0.9, cx, cy - s * 0.25);
      ctx.bezierCurveTo(cx + s * 0.6, cy - s * 0.9, cx + s * 1.3, cy + s * 0.15, cx, cy + s * 0.85);
    } else {
      for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 === 0 ? s : s * 0.45; const px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  },
  drawToken(ctx, f, kind, color, hop) {
    hop = hop || 0;
    const [x, y0] = this.tokenXY(f);
    const y = y0 - hop;
    const s = this.cs * 0.22;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    const grad = ctx.createLinearGradient(x, y - s, x, y + s);
    grad.addColorStop(0, color); grad.addColorStop(1, shade(color, -22));
    this.drawShape(ctx, x, y, s, kind, grad, '#fff');
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(x - s * 0.3, y - s * 0.35, s * 0.3, s * 0.18, -0.5, 0, 7); ctx.fill();
    ctx.restore();
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx, W = this.W, H = this.H, cs = this.cs, ox = this.ox, oy = this.oy;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f3e9d2'; ctx.fillRect(ox, oy, cs * 8, cs * 8);
    ctx.fillStyle = '#fff8ec'; ctx.fillRect(ox + cs, oy + cs, cs * 6, cs * 6);
    ctx.fillStyle = '#b58a5a'; ctx.font = 'bold ' + Math.round(cs * 0.46) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('大富翁', ox + cs * 4, oy + cs * 3.7);
    ctx.font = Math.round(cs * 0.22) + 'px sans-serif'; ctx.fillStyle = '#9a7a52';
    const dn = this.data.dice;
    ctx.fillText('骰 ' + dn[0] + '+' + dn[1] + '=' + (dn[0] + dn[1]), ox + cs * 4, oy + cs * 4.4);

    const cells = this._cells || [];
    for (let i = 0; i < BOARD; i++) {
      const [c, r] = cellCR(i);
      const x = ox + c * cs, y = oy + r * cs;
      const cell = cells[i] || {};
      ctx.strokeStyle = '#cdb088'; ctx.lineWidth = 1; ctx.strokeRect(x, y, cs, cs);
      if (cell.type === 'property') {
        ctx.fillStyle = GROUP_COLOR[cell.group] || '#999'; ctx.fillRect(x, y, cs, 8);   // 顶部色组条
        ctx.fillStyle = '#6b4a2a'; ctx.font = Math.round(cs * 0.17) + 'px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText('$' + cell.price, x + cs - 3, y + 9);                              // 价格(右上角小字=等级)
        if (cell.level) { ctx.fillStyle = '#b58a5a'; ctx.textAlign = 'left'; let star = ''; for (let k = 0; k < cell.level; k++) star += '★'; ctx.fillText(star, x + 3, y + 10); }
        if (cell.owner) this.drawShape(ctx, x + cs / 2, y + cs - 13, cs * 0.13, seatShape(cell.owner), seatColor(cell.owner), '#fff');  // 归属形状(心/星)+玩家色
      }
      const cmap = { start: '#3aa75c', card: '#e8b94d', tax: '#e85a86', jail: '#7a5c3a', bonus: '#3a86ff', property: '#5a4030' };
      ctx.fillStyle = cmap[cell.type] || '#5a4030';
      ctx.font = Math.round(cs * 0.2) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      this.wrapText(ctx, cell.name || '', x + cs / 2, y + (cell.type === 'property' ? cs * 0.4 : 5), cs - 4, cs * 0.22);
    }

    if (this.data.started) {
      const role = room.getRole(), peerRole = role === 'boy' ? 'girl' : 'boy';
      const myKind = this.data.mySeat === 'red' ? 'heart' : 'star';
      const peKind = this.data.mySeat === 'red' ? 'star' : 'heart';
      const myColor = seatColor(role), peColor = seatColor(peerRole);
      const moving = this._moving;
      if (moving && moving.role === role) { this.drawToken(ctx, moving.f, myKind, myColor, moving.hop); this.drawToken(ctx, this.data.peerPos, peKind, peColor, 0); }
      else if (moving && moving.role !== role) { this.drawToken(ctx, this.data.myPos, myKind, myColor, 0); this.drawToken(ctx, moving.f, peKind, peColor, moving.hop); }
      else { this.drawToken(ctx, this.data.myPos, myKind, myColor, 0); this.drawToken(ctx, this.data.peerPos, peKind, peColor, 0); }
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
