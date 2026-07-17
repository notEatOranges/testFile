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
const GW = 8, GH = 10;                 // 矩形外圈：宽 8 × 高 10
const NOTCH = { left: 3, right: 4, depth: 3 };  // 顶部凹槽(向内折)增加格子，呈 凹 形
function walkSeg(a, b, out) {
  const [c1, r1] = a, [c2, r2] = b;
  if (c1 === c2) { const s = r2 > r1 ? 1 : -1; for (let r = r1; ; r += s) { out.push([c1, r]); if (r === r2) break; } }
  else { const s = c2 > c1 ? 1 : -1; for (let c = c1; ; c += s) { out.push([c, r1]); if (c === c2) break; } }
}
function buildPath() {
  const nL = NOTCH.left, nR = NOTCH.right, nd = NOTCH.depth;
  const wp = [[0, GH - 1], [GW - 1, GH - 1], [GW - 1, 0], [nR, 0], [nR, nd], [nL, nd], [nL, 0], [0, 0]];
  const raw = [];
  for (let i = 0; i < wp.length; i++) walkSeg(wp[i], wp[(i + 1) % wp.length], raw);
  const path = [];
  for (const p of raw) { const last = path[path.length - 1]; if (!last || last[0] !== p[0] || last[1] !== p[1]) path.push(p); }
  if (path.length > 1 && path[0][0] === path[path.length - 1][0] && path[0][1] === path[path.length - 1][1]) path.pop();
  return path;
}
const PATH = buildPath();
const BOARD = PATH.length;             // 凹形外圈格数
// 双卡组：机会(偏移动/机缘) + 公共基金(偏金钱事件)。cash 自己加减；cashPeer 对方给/收；to 回起点；back 后退；skip 停一回合
const DECK = [
  { t: '银行分红 +50', cash: 50 }, { t: '生日红包 对方送你 +100', cashPeer: 100 }, { t: '遗产继承 +100', cash: 100 },
  { t: '股票大涨 +150', cash: 150 }, { t: '退税 +40', cash: 40 }, { t: '中奖 +200', cash: 200 }, { t: '捡到钱包 +80', cash: 80 },
  { t: '前进到起点 +200', to: 0 }, { t: '对方请客 你 +60', cashPeer: 60 }, { t: '利息到账 +30', cash: 30 },
  { t: '修缮费 -120', cash: -120 }, { t: '医药费 -150', cash: -150 }, { t: '违章 -90', cash: -90 }, { t: '丢手机 -120', cash: -120 },
  { t: '进修学费 -150', cash: -150 }, { t: '爱心捐款 -60', cash: -60 }, { t: '请客吃饭 -80', cash: -80 }, { t: '进监狱 停一回合', skip: true },
  { t: '后退 3 格', back: 3 }
];
const GROUP_COLOR = ['#9b7fd4', '#3a86ff', '#06d6a0', '#ffb703', '#e85a86', '#fb8500'];

function buildCells() {
  const cells = [{ name: '起点', type: 'start' }];
  const names = ['棉花糖摊', '奶茶店', '电影院', '咖啡馆', '书店', '花店', '游乐场', '海滩', '摩天轮', '甜品屋', '民宿', '烟火大会', '星空营地', '音乐节', '滑雪场', '温泉', '灯塔', '古镇', '画廊', '酒庄', '马场', '茶园', '果园', '城堡', '集市', '甜品街', '玩具店', '面包房'];
  let ni = 0;
  for (let i = 1; i < BOARD; i++) {
    const m = i % 6;
    if (m === 0) cells.push({ name: i % 12 === 0 ? '公共基金' : '机会', type: 'card', kind: i % 12 === 0 ? 'fate' : 'chance' });
    else if (i === 11 || i === 22 || i === 33) cells.push({ name: '缴税', type: 'tax', amt: 100 + (ni % 3) * 50 });
    else if (i === 16) cells.push({ name: '监狱', type: 'jail' });
    else if (i === 27 || i === 38) cells.push({ name: '奖金', type: 'bonus', amt: 180 });
    else if (i === 21 || i === 43) cells.push({ name: '免费停车', type: 'freepark' });
    else { const g = ni % 6; const price = 80 + g * 60 + ni * 4; cells.push({ name: names[ni % names.length], type: 'property', group: g, price, rent: Math.round(price * 0.3), owner: null, level: 0 }); ni++; }
  }
  return cells;
}
function cellCR(i) { return PATH[((i % BOARD) + BOARD) % BOARD]; }
function rentOf(cell) { return cell.rent * (1 + (cell.level || 0)); }
function upgradeCost(cell) { return Math.round(cell.price * 0.5); }
// 卖银行回收价：(地皮价值 + 已投入升级费) × 60%。sellToBank / myProps / 贷款额度 共用，避免重复公式。
function bankRecover(cell) { return Math.round((cell.price + (cell.level || 0) * upgradeCost(cell)) * 0.6); }
// 抵押贷款额度 = 起步信用 300 + 自家地皮回收价总和 × 50%。地皮越多额度越高，无地皮仅剩小额信用，杜绝无限贷。
function loanCapOf(cells, role) {
  let sum = 0; cells.forEach(c => { if (c && c.type === 'property' && c.owner === role) sum += bankRecover(c); });
  return 300 + Math.floor(sum * 0.5);
}
function availableLoan(cells, role, loan) { return Math.max(0, loanCapOf(cells, role) - (loan || 0)); }
function seatShape(role) { return rt.seatOf(role) === rt.RED ? 'heart' : 'star'; }
function seatColor(role) { return rt.seatOf(role) === rt.RED ? '#ff5a5f' : '#00b8d4'; }   // 珊瑚红/青，避开地皮 6 色
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt)), b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// 日志条目结构化：{ who: 触发者role, text: '描述' }，text 内可用 {{boy}}/{{girl}} 占位指代某个玩家。
// 渲染时按「当前观看者」视角转换：自己 →「你」，对方 → 对方昵称。双方共享同一份中立 log，各自看到自己的视角。
function fmtLog(item, role, peerName) {
  if (item == null) return '';
  if (typeof item === 'string') return item;   // 兼容历史纯文本日志
  const name = r => r === role ? '你' : (peerName || 'ta');
  const t = String(item.text || '').replace(/\{\{(boy|girl)\}\}/g, (m, r) => name(r));
  return item.who ? name(item.who) + t : t;
}

Page({
  data: {
    theme: 'sakura', role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    started: false, turnSeat: 'red', mySeat: 'red', myTurn: false,
    dice: 1, log: [], myCash: START_CASH, peerCash: START_CASH, myPos: 0, peerPos: 0,
    winner: null, winnerText: '', rolling: false, requestPending: false, rulesOpen: false,
    card: null, fx: null,   // fx: {kind:'good'|'bad', text} 事件特效
    bankOpen: false, mySavings: 0, peerSavings: 0, myLoan: 0, myLoanCap: 0, myAvailLoan: 0, peerLoan: 0, myProps: [], sellReqPending: false
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
  onUnload() { rt.teardown(this); ident.teardown(this); if (this._diceTimer) clearInterval(this._diceTimer); if (this._raf && this.cv) this.cv.cancelAnimationFrame(this._raf); if (this._cardRaf && this.cv) this.cv.cancelAnimationFrame(this._cardRaf); },

  fresh() {
    return { cells: buildCells(), pos: { boy: 0, girl: 0 }, cash: { boy: START_CASH, girl: START_CASH }, savings: { boy: 0, girl: 0 }, loan: { boy: 0, girl: 0 }, skip: { boy: 0, girl: 0 }, turn: Math.random() < 0.5 ? rt.RED : rt.BLUE, dice: 1, log: [], winner: null, req: null, sellReq: null };
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
      this.cellW = w / GW; this.cellH = h / GH;
      this.cs = Math.min(this.cellW, this.cellH);   // 字号/棋子按短边
      this.ox = 0; this.oy = 0;
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
    if (this._prevTurn !== turnSeat) { this._prevTurn = turnSeat; this._lastRolledTurn = null; }   // 回合易主 → 重置「本回合已摇」标记，让新回合方可掷骰
    let winnerText = '';
    if (winner === 'draw') winnerText = '平局';
    else if (winner) winnerText = (names[rt.seatRole(winner)] || '对方') + ' 获胜';
    if (winner && !this._recorded) { this._recorded = true; rt.recordPvp('monopoly', rt.myResult(winner, this.data.mySeat), role); }

    // 卖地请求握手
    const cells = this._cells;
    const sellReq = s.sellReq || null;
    if (sellReq && sellReq.by && sellReq.by !== role && !this._sellPrompted) {
      this._sellPrompted = true;
      const cell = cells[sellReq.idx];
      const me = this;
      wx.showModal({ title: '买地请求', content: (names[sellReq.by] || '对方') + ' 要把「' + (cell ? cell.name : '地块') + '」以 ' + sellReq.price + ' 卖给你，买吗？', confirmText: '买下', cancelText: '不要',
        success: r => {
          if (r.confirm) {
            rt.transactionState('monopoly', s => {
              if (!s || !s.cells) return s;
              const cs = s.cells.map(c => Object.assign({}, c));
              const cash = Object.assign({}, s.cash);
              if ((cash[role] || 0) < sellReq.price) { toast('现金不足'); return Object.assign({}, s, { sellReq: null }); }
              cash[role] -= sellReq.price; cash[sellReq.by] = (cash[sellReq.by] || 0) + sellReq.price;
              cs[sellReq.idx] = Object.assign({}, cs[sellReq.idx], { owner: role });
              const lg = (s.log || []).slice(); lg.push({ who: role, text: '买下{{' + sellReq.by + '}}的「' + cs[sellReq.idx].name + '」-' + sellReq.price });
              return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-30), sellReq: null });
            });
          } else { rt.transactionState('monopoly', s => Object.assign({}, s, { sellReq: null })); }
        } });
    } else if (!sellReq) { this._sellPrompted = false; }
    patch.sellReqPending = !!(sellReq && sellReq.by === role);

    const myProps = [];
    cells.forEach((c, idx) => { if (c && c.type === 'property' && c.owner === role) myProps.push({ idx, name: c.name, price: c.price, level: c.level || 0, sellBank: bankRecover(c), sellPeer: Math.round(c.price * 0.8) }); });
    const myLoanVal = (s.loan && s.loan[role]) || 0, myCap = loanCapOf(cells, role);
    Object.assign(patch, {
      started: true, turnSeat, myTurn: !winner && turnSeat === this.data.mySeat,
      dice: s.dice || 1,
      log: (s.log || []).slice(-30).reverse().map(it => fmtLog(it, role, this.data.peerName)),
      myCash: (s.cash && s.cash[role]) || 0, peerCash: (s.cash && s.cash[peer]) || 0,
      mySavings: (s.savings && s.savings[role]) || 0, peerSavings: (s.savings && s.savings[peer]) || 0,
      myLoan: myLoanVal, myLoanCap: myCap, myAvailLoan: Math.max(0, myCap - myLoanVal), peerLoan: (s.loan && s.loan[peer]) || 0,
      myPos: (s.pos && s.pos[role]) || 0, peerPos: (s.pos && s.pos[peer]) || 0,
      myProps, winner, winnerText
    });
    this.setData(patch);
    this.draw();
  },

  showFx(kind, text) {
    this._fxAnim = { kind, text, t0: Date.now() };
    if (!this._fxRaf && this.cv) {
      const step = () => {
        if (!this._fxAnim) { this._fxRaf = null; return; }
        if (Date.now() - this._fxAnim.t0 > 1500) { this._fxAnim = null; this._fxRaf = null; this.draw(); return; }
        this.draw();
        this._fxRaf = this.cv.requestAnimationFrame(step);
      };
      this._fxRaf = this.cv.requestAnimationFrame(step);
    }
  },

  async roll() {
    if (!this.data.myTurn || this.data.winner || this.data.rolling) return;
    if (this._lastRolledTurn === this.data.mySeat) return;   // 本回合已摇过：堵住 rolling 标志先于回合切换被清的竞态窗口(重复摇)
    this._lastRolledTurn = this.data.mySeat;
    const role = room.getRole();
    const s = this._state;
    this.setData({ rolling: true });
    try {
    const d = await this.rollDiceAnim();             // 单 8 面骰(棋盘中央翻滚 + 落定)
    const steps = d;
    this.setData({ dice: d });

    const from = s.pos[role];
    const crossed = (from + steps) >= BOARD;
    const to = (from + steps) % BOARD;
    let cash = Object.assign({}, s.cash);
    const savings = Object.assign({}, s.savings || { boy: 0, girl: 0 });
    const loan = Object.assign({}, s.loan || { boy: 0, girl: 0 });
    const log = (s.log || []).slice();
    if (crossed) {
      cash[role] = (cash[role] || 0) + 200;
      const sav = savings[role] || 0; if (sav) { const it = Math.round(sav * 0.05); savings[role] = sav + it; log.push({ who: role, text: '存款利息 +' + it }); }
      const ln = loan[role] || 0;
      if (ln) {                                                                       // 过起点必扣息：欠款 ×10%
        const li = Math.round(ln * 0.1);
        if ((cash[role] || 0) >= li) { cash[role] -= li; log.push({ who: role, text: '贷款利息 -' + li }); }
        else { const unpaid = li - (cash[role] || 0); cash[role] = 0; loan[role] = ln + unpaid; log.push({ who: role, text: '贷款利息 +' + unpaid + '（现金不足，滚入欠款）' }); }   // 还不起→利息资本化，债务雪球
      }
    }
    log.push({ who: role, text: '掷出 ' + steps + (crossed ? '，经过起点 +200' : '') });

    // 先写一次：棋子已移动 + 日志立即可见（携带 savings/loan）
    this._state = Object.assign({}, s, { pos: Object.assign({}, s.pos, { [role]: to }), cash, savings, loan, dice: d, log });
    rt.setState('monopoly', this._state);

    // 棋子滑行动画（沿环形），完成后结算
    await this.animateMove(role, from, to);
    await this.resolve(role, to, cash, log, s.turn);
    } catch (err) {
      console.error('[monopoly] roll err', err); toast('出错了，请重试');
      // 兜底：结算中途出错也要把回合交给对方，避免卡在某人手上或重复摇
      const peer = role === 'boy' ? 'girl' : 'boy';
      const st = this._state || s;
      if (st && !st.winner) rt.setState('monopoly', Object.assign({}, st, { turn: rt.seatOf(peer) }));
    }
    finally { this.setData({ rolling: false }); }
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

  rollDiceAnim() {
    return new Promise(res => {
      const f = 1 + Math.floor(Math.random() * 8);   // 单 8 面骰：1~8
      if (!this.cv) { res(f); return; }
      const t0 = Date.now(); const tumble = 720, settle = 600;
      const step = () => {
        const el = Date.now() - t0;
        if (el < tumble) {
          this._diceAnim = { phase: 'tumble', v: 1 + Math.floor(Math.random() * 8), angle: Math.sin(el / tumble * Math.PI * 5) * 0.6 * (1 - el / tumble) };
        } else if (el < tumble + settle) {
          this._diceAnim = { phase: 'settle', v: f, p: (el - tumble) / settle };
        } else { this._diceAnim = null; this.draw(); res(f); return; }
        this.draw();
        this._raf = this.cv.requestAnimationFrame(step);
      };
      this._raf = this.cv.requestAnimationFrame(step);
    });
  },
  drawDie(ctx, cx, cy, s, val, ang) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(ctx, -s / 2 + 5, -s / 2 + 8, s, s, s * 0.2); ctx.fill();
    const grad = ctx.createLinearGradient(0, -s / 2, 0, s / 2); grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#ffd6e2');
    ctx.fillStyle = grad; rr(ctx, -s / 2, -s / 2, s, s, s * 0.2); ctx.fill();
    ctx.strokeStyle = '#e85a86'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#e85a86'; ctx.font = 'bold ' + Math.round(s * 0.55) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(val), 0, s * 0.04);
    ctx.restore();
  },
  drawDiceCenter(ctx) {
    const cs = this.cs, cx = this.W / 2, cy = this.H / 2 + cs * 0.4;
    const anim = this._diceAnim;
    const d = this.data.dice || 1;
    const v = anim ? anim.v : d;
    const ang = anim && anim.phase === 'tumble' ? anim.angle : 0;
    const s = cs * 1.5;   // 单 8 面骰，放大居中
    this.drawDie(ctx, cx, cy, s, v, ang);
    // 落定后弹出「前进 N 格」
    if (!anim || anim.phase === 'settle') {
      const p = anim ? (anim.p || 1) : 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p * 1.5);
      const sc = 0.5 + 0.5 * Math.min(1, p);
      ctx.translate(cx, cy + s * 1.1); ctx.scale(sc, sc);
      ctx.fillStyle = '#e85a86'; ctx.font = 'bold ' + Math.round(cs * 0.46) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('前进 ' + v + ' 格', 0, 0);
      ctx.restore();
    }
  },
  drawCard() {
    return new Promise(res => {
      const c = DECK[Math.floor(Math.random() * DECK.length)];
      const kind = (c.cash != null && c.cash < 0) || c.skip || c.back ? 'bad' : 'good';
      if (!this.cv) { res(c); return; }
      // Phase 1: 棋盘中央洗牌动画(700ms)
      this._cardAnim = { phase: 'shuffle', t0: Date.now() };
      this.startCardRaf();
      setTimeout(() => {
        // Phase 2: 翻牌揭晓(1800ms)
        this._cardAnim = { phase: 'reveal', kind, text: c.t, revealP: 0, t0: Date.now() };
        setTimeout(() => { this._cardAnim = null; this.draw(); res(c); }, 1800);
      }, 700);
    });
  },
  startCardRaf() {
    if (this._cardRaf) return;
    const step = () => {
      if (!this._cardAnim) { this._cardRaf = null; return; }
      if (this._cardAnim.phase === 'reveal') this._cardAnim.revealP = Math.min(1, (Date.now() - this._cardAnim.t0) / 500);
      this.draw();
      this._cardRaf = this.cv.requestAnimationFrame(step);
    };
    this._cardRaf = this.cv.requestAnimationFrame(step);
  },
  drawCardAnim(ctx) {
    const a = this._cardAnim; if (!a) return;
    const cs = this.cs, cx = this.W / 2, cy = this.H / 2;
    if (a.phase === 'shuffle') {
      for (let i = 0; i < 3; i++) {
        const ox = (Math.random() - 0.5) * cs * 0.4, oy = (Math.random() - 0.5) * cs * 0.2, rot = (Math.random() - 0.5) * 0.3;
        this.drawCardBack(ctx, cx + ox + (i - 1) * cs * 0.5, cy + oy, cs * 1.3, cs * 1.8, rot);
      }
      ctx.fillStyle = '#8a6b78'; ctx.font = Math.round(cs * 0.3) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('洗牌中', cx, cy + cs * 1.4);
    } else {
      const p = a.revealP, w = cs * 3.2, h = cs * 4.2;
      const flip = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2, showFace = p > 0.5;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.02, flip), 1);
      ctx.fillStyle = showFace ? (a.kind === 'good' ? '#2ec24e' : '#e85a86') : '#e85a86';
      rr(ctx, -w / 2, -h / 2, w, h, 16); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      if (showFace) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(cs * 0.55) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(a.kind === 'good' ? '好事' : '坏事', 0, -cs * 0.9);
        ctx.font = Math.round(cs * 0.32) + 'px sans-serif';
        this.wrapText(ctx, a.text, 0, cs * 0.4, w * 0.8, cs * 0.38);
      } else { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = 'bold ' + Math.round(cs * 0.8) + 'px sans-serif'; ctx.fillText('?', 0, 0); }
      ctx.restore();
    }
  },
  drawCardBack(ctx, cx, cy, w, h, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = '#e85a86'; rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = 'bold ' + Math.round(w * 0.5) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 0);
    ctx.restore();
  },
  drawFxAnim(ctx) {
    const a = this._fxAnim; if (!a) return;
    const el = Date.now() - a.t0;
    const p = Math.min(1, el / 250);
    const fade = el > 1200 ? Math.max(0, 1 - (el - 1200) / 300) : 1;
    const cs = this.cs, cx = this.W / 2, cy = this.H / 2;
    const w = cs * 4.5, h = cs * 1.3;
    ctx.save();
    ctx.globalAlpha = fade * Math.min(1, p * 2);
    ctx.translate(cx, cy);
    ctx.scale(0.6 + 0.4 * p, 0.6 + 0.4 * p);
    ctx.fillStyle = a.kind === 'good' ? '#2ec24e' : '#e85a86';
    rr(ctx, -w / 2, -h / 2, w, h, 14); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(cs * 0.34) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.wrapText(ctx, a.text, 0, 0, w * 0.85, cs * 0.38);
    ctx.restore();
  },

  // 写一次中间态（让事件日志及时同步给双方）
  syncLog(cells, cash, log, pos, skip, extra) {
    this._state = Object.assign({}, this._state, { cells: cells.map(c => Object.assign({}, c)), cash: Object.assign({}, cash), pos: Object.assign({}, pos), skip: Object.assign({}, skip), log: log.slice(-30) }, extra || {});
    rt.setState('monopoly', this._state);
  },

  async resolve(role, idx, cash, log, turn) {
    const cells = this._cells.map(c => Object.assign({}, c));
    const cell = cells[idx];
    const peer = role === 'boy' ? 'girl' : 'boy';
    let skip = Object.assign({}, this._state.skip || { boy: 0, girl: 0 });
    let pos = Object.assign({}, this._state.pos);
    let loan = Object.assign({}, this._state.loan || { boy: 0, girl: 0 });
    let winner = null;
    let toIdx = idx;

    if (cell.type === 'start') { cash[role] += 100; log.push({ who: role, text: '到达起点 +100' }); }
    else if (cell.type === 'tax') { cash[role] -= cell.amt; log.push({ who: role, text: '缴税 -' + cell.amt }); this.showFx('bad', '缴税 -' + cell.amt); }
    else if (cell.type === 'bonus') { cash[role] += cell.amt; log.push({ who: role, text: '获得奖金 +' + cell.amt }); this.showFx('good', cell.name + ' +' + cell.amt); }
    else if (cell.type === 'jail') { skip[role] = (skip[role] || 0) + 1; log.push({ who: role, text: '进了监狱，下回合停留' }); this.showFx('bad', '进监狱，停一回合'); }
    else if (cell.type === 'freepark') { cash[role] = (cash[role] || 0) + 50; log.push({ who: role, text: '免费停车 +50' }); this.showFx('good', '免费停车 +50'); }
    else if (cell.type === 'card') {
      const card = await this.drawCard();
      log.push({ who: role, text: (cell.kind === 'fate' ? '抽中公共基金：' : '抽中机会：') + card.t });
      if (card.cash) cash[role] = (cash[role] || 0) + card.cash;
      if (card.cashPeer) { cash[role] = (cash[role] || 0) + card.cashPeer; cash[peer] = (cash[peer] || 0) - card.cashPeer; }
      if (card.to === 0) { cash[role] += 200; toIdx = 0; log.push({ who: role, text: '回到起点 +200' }); }
      if (card.back) { toIdx = (idx - card.back + BOARD) % BOARD; log.push({ who: role, text: '后退 ' + card.back + ' 格' }); }
      if (card.skip) skip[role] = (skip[role] || 0) + 1;
      this.syncLog(cells, cash, log, pos, skip);
    } else if (cell.type === 'property') {
      if (!cell.owner) {
        const shortAmt = cell.price - (cash[role] || 0);
        const afford = shortAmt <= 0;
        const canLoan = availableLoan(cells, role, loan[role] || 0) >= shortAmt;   // 贷款买房也受额度封顶
        const choice = await new Promise(res => {
          if (afford) wx.showModal({ title: cell.name, content: '花 ' + cell.price + ' 买下？（过路费 ' + rentOf(cell) + '）', confirmText: '买下', cancelText: '不买', success: r => res(r.confirm ? 'buy' : false) });
          else if (canLoan) wx.showModal({ title: cell.name, content: '现金不足，贷款 ' + shortAmt + ' 买下？（过路费 ' + rentOf(cell) + '，过起点扣息）', confirmText: '贷款买', cancelText: '不买', success: r => res(r.confirm ? 'loan' : false) });
          else res(false);
        });
        if (choice === 'buy') { cash[role] -= cell.price; cells[idx] = Object.assign({}, cell, { owner: role }); log.push({ who: role, text: '购买「' + cell.name + '」-' + cell.price }); this.showFx('good', '入手「' + cell.name + '」'); }
        else if (choice === 'loan') { loan[role] = (loan[role] || 0) + shortAmt; cash[role] = (cash[role] || 0) + shortAmt - cell.price; cells[idx] = Object.assign({}, cell, { owner: role }); log.push({ who: role, text: '贷款购买「' + cell.name + '」(欠款 +' + shortAmt + ')' }); this.showFx('good', '贷款入手「' + cell.name + '」'); }
      } else if (cell.owner === role) {
        // 自己的地：可升级（最高 3 级）；现金不足但额度够 → 可贷款升级
        if ((cell.level || 0) < 3) {
          const cost = upgradeCost(cell);
          const canCash = (cash[role] || 0) >= cost;
          const canLoan = availableLoan(cells, role, loan[role] || 0) >= cost;
          if (!canCash && !canLoan) { log.push({ who: role, text: '现金与额度都不足，无法升级「' + cell.name + '」' }); }
          else {
            const up = await new Promise(res => {
              if (canCash) wx.showModal({ title: '升级「' + cell.name + '」', content: '升到 ' + ((cell.level || 0) + 2) + ' 级？花 ' + cost + '（过路费变 ' + (rentOf(cell) + cell.rent) + '）', confirmText: '升级', cancelText: '不了', success: r => res(r.confirm ? 'cash' : false) });
              else wx.showModal({ title: '贷款升级「' + cell.name + '」', content: '现金不足，贷款 ' + cost + ' 升到 ' + ((cell.level || 0) + 2) + ' 级？(过路费变 ' + (rentOf(cell) + cell.rent) + '，过起点扣息)', confirmText: '贷款升级', cancelText: '不了', success: r => res(r.confirm ? 'loan' : false) });
            });
            if (up === 'cash') { cash[role] -= cost; cells[idx] = Object.assign({}, cell, { level: (cell.level || 0) + 1 }); log.push({ who: role, text: '升级「' + cell.name + '」到 ' + (cells[idx].level + 1) + ' 级' }); this.showFx('good', '升级！过路费上涨'); }
            else if (up === 'loan') { loan[role] = (loan[role] || 0) + cost; cells[idx] = Object.assign({}, cell, { level: (cell.level || 0) + 1 }); log.push({ who: role, text: '贷款升级「' + cell.name + '」到 ' + (cells[idx].level + 1) + ' 级 (欠款+' + cost + ')' }); this.showFx('good', '贷款升级！过路费上涨'); }
          }
        } else { log.push({ who: role, text: '「' + cell.name + '」已满级' }); }
      } else {
        const r = rentOf(cell); cash[role] -= r; cash[peer] += r;
        log.push({ who: role, text: '路过{{' + cell.owner + '}}的「' + cell.name + '」付过路费 ' + r });
        this.showFx('bad', '付过路费 ' + r);
      }
    }

    // 现金为负 → 破产救助（存款→卖地→贷款→破产），不再直接判输
    let savings = Object.assign({}, this._state.savings || { boy: 0, girl: 0 });
    if (cash[role] < 0) {
      const bankrupt = await this.coverShortfall(role, cells, cash, savings, loan, log);
      if (bankrupt) winner = role === 'boy' ? rt.BLUE : rt.RED;
    }
    if (toIdx !== idx) pos = Object.assign({}, pos, { [role]: toIdx });
    let nextRole = peer;
    if (!winner && (skip[peer] || 0) > 0) { skip[peer]--; nextRole = role; log.push({ who: peer, text: '停一回合（跳过本次）' }); }
    rt.setState('monopoly', Object.assign({}, this._state, { cells: cells.map(c => Object.assign({}, c)), pos, cash, savings, skip, loan, turn: winner ? turn : rt.seatOf(nextRole), dice: this.data.dice, log: log.slice(-30), winner, req: null }));
  },

  // 破产救助：现金为负时按「存款→卖地(优先还贷)→紧急贷款」自救；仍不足才真破产。
  // 就地修改传入的 cash/savings/loan/cells/log，返回是否破产。
  async coverShortfall(role, cells, cash, savings, loan, log) {
    while (cash[role] < 0 && (savings[role] || 0) > 0) {                       // 1) 存款补
      const need = Math.min(-cash[role], savings[role]);
      savings[role] -= need; cash[role] += need;
      log.push({ who: role, text: '取出存款 ' + need + ' 补亏空' });
      this.syncLog(cells, cash, log, this._state.pos, this._state.skip, { savings, loan });
    }
    while (cash[role] < 0) {                                                    // 2) 卖地补（困境中只卖银行；变卖款优先还贷）
      const mine = [];
      cells.forEach((c, i) => { if (c && c.type === 'property' && c.owner === role) mine.push(i); });
      if (!mine.length) break;
      const pick = await new Promise(res => {
        wx.showActionSheet({
          alertText: '现金为负 ' + cash[role] + '，选一块地卖给银行自救（变卖款优先还贷）',
          itemList: mine.slice(0, 6).map(i => cells[i].name + ' +' + bankRecover(cells[i])),
          success: r => res(mine[r.tapIndex]),
          fail: () => res(null)
        });
      });
      if (pick == null) break;
      const c = cells[pick], get = bankRecover(c);
      cells[pick] = Object.assign({}, c, { owner: null, level: 0 });
      if ((loan[role] || 0) > 0) { const payL = Math.min(get, loan[role]); loan[role] -= payL; cash[role] += get - payL; log.push({ who: role, text: '变卖「' + c.name + '」+' + get + '（优先还贷 ' + payL + '）' }); }
      else { cash[role] += get; log.push({ who: role, text: '变卖「' + c.name + '」+' + get }); }
      this.showFx('bad', '变卖「' + c.name + '」+' + get);
      this.syncLog(cells, cash, log, this._state.pos, this._state.skip, { savings, loan });
    }
    if (cash[role] < 0) {                                                       // 3) 紧急贷款补
      const avail = availableLoan(cells, role, loan[role] || 0);
      if (avail > 0) { const take = Math.min(-cash[role], avail); loan[role] = (loan[role] || 0) + take; cash[role] += take; log.push({ who: role, text: '紧急贷款 ' + take + ' 补亏空' }); this.syncLog(cells, cash, log, this._state.pos, this._state.skip, { savings, loan }); }
    }
    if (cash[role] < 0) { this.showFx('bad', '资产耗尽，破产！'); return true; }   // 4) 仍为负 → 破产
    return false;
  },

  dismissCard() { this._cardAnim = null; this.draw(); },

  // —— 银行/资产：存款/贷款/卖地 ——
  openBank() { this.setData({ bankOpen: true }); },
  noop() {},
  closeBank() { this.setData({ bankOpen: false }); setTimeout(() => this.setupCanvas(), 50); },
  bankAct(e) {
    const act = e.currentTarget.dataset.act, amt = parseInt(e.currentTarget.dataset.amt || '0', 10);
    const role = room.getRole();
    // 走 transactionState：从 DB 现读整份状态再派生，避免从陈旧 this._state 带出 turn/pos 把错回合写回（丢摇骰 bug 根因）
    rt.transactionState('monopoly', s => {
      if (!s || !s.cash) return s;
      const cash = Object.assign({}, s.cash), savings = Object.assign({}, s.savings || { boy: 0, girl: 0 }), loan = Object.assign({}, s.loan || { boy: 0, girl: 0 });
      const lg = (s.log || []).slice();
      if (act === 'deposit') {
        if ((cash[role] || 0) < amt) { toast('现金不足'); return s; }
        cash[role] -= amt; savings[role] = (savings[role] || 0) + amt; lg.push({ who: role, text: '存入银行 ' + amt });
      } else if (act === 'withdraw') {
        const v = Math.min(amt, savings[role] || 0); if (v <= 0) { toast('没有存款'); return s; }
        savings[role] -= v; cash[role] += v; lg.push({ who: role, text: '取出存款 ' + v });
      } else if (act === 'borrow') {
        const want = 200, take = Math.min(want, availableLoan(s.cells, role, loan[role] || 0));
        if (take <= 0) { toast('贷款额度不足'); return s; }
        cash[role] += take; loan[role] = (loan[role] || 0) + take; lg.push({ who: role, text: '向银行贷款 ' + take + (take < want ? '（已达额度上限）' : '') });
      } else if (act === 'repay') {
        const due = loan[role] || 0, pay = Math.min(due, cash[role] || 0);
        if (pay <= 0) { toast('没有欠款或现金不足'); return s; }
        cash[role] -= pay; loan[role] = due - pay; lg.push({ who: role, text: '还款 ' + pay });
      } else { toast('操作失败'); return s; }
      return Object.assign({}, s, { cash, savings, loan, log: lg.slice(-30) });
    });
  },
  sellToBank(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10), role = room.getRole();
    const cell = (this._state && this._state.cells[idx]) || {};
    const get = Math.round((cell.price + (cell.level || 0) * upgradeCost(cell)) * 0.6);
    wx.showModal({ title: '卖给银行', content: '确定把「' + cell.name + '」卖给银行，获得 ' + get + '？', confirmText: '卖出', cancelText: '取消',
      success: r => {
        if (!r.confirm) return;
        rt.transactionState('monopoly', s => {
          if (!s || !s.cells) return s;
          const c = s.cells[idx];
          if (!c || c.owner !== role) { toast('地块已变化'); return s; }   // 防御：非己地不卖
          const cs = s.cells.map(x => Object.assign({}, x));
          cs[idx] = Object.assign({}, c, { owner: null, level: 0 });
          const cash = Object.assign({}, s.cash); cash[role] = (cash[role] || 0) + get;
          const lg = (s.log || []).slice(); lg.push({ who: role, text: '把「' + c.name + '」卖给银行 +' + get });
          return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-30) });
        });
        toast('卖给银行 +' + get);
      }
    });
  },
  sellToPeer(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10), role = room.getRole();
    const cell = (this._state && this._state.cells[idx]) || {};
    const price = Math.round((cell.price || 0) * 0.8);
    wx.showModal({ title: '卖给对方', content: '确定把「' + cell.name + '」以 ' + price + ' 卖给对方？', confirmText: '发起', cancelText: '取消',
      success: r => {
        if (!r.confirm) return;
        rt.transactionState('monopoly', s => Object.assign({}, s, { sellReq: { by: role, idx, price } }));
        this.setData({ bankOpen: false });
        toast('已发起卖地请求(价 ' + price + ')，等对方');
      }
    });
  },
  cancelSell() { rt.transactionState('monopoly', s => Object.assign({}, s, { sellReq: null })); toast('已取消卖地'); },
  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); setTimeout(() => this.setupCanvas(), 60); },

  tokenXY(f) {
    const i0 = Math.floor(f) % BOARD, i1 = (i0 + 1) % BOARD, fr = f - Math.floor(f);
    const [c0, r0] = cellCR(i0), [c1, r1] = cellCR(i1);
    const c = c0 + (c1 - c0) * fr, r = r0 + (r1 - r0) * fr;
    return [c * this.cellW + this.cellW / 2, r * this.cellH + this.cellH * 0.6];
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
    const s = this.cs * 0.32;   // 放大棋子，更醒目
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
    const ctx = this.ctx, W = this.W, H = this.H, cs = this.cs, cw = this.cellW, ch = this.cellH;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f3e9d2'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff8ec'; ctx.fillRect(cw, ch, W - 2 * cw, H - 2 * ch);
    this.drawDiceCenter(ctx);

    const cells = this._cells || [];
    for (let i = 0; i < BOARD; i++) {
      const [c, r] = cellCR(i);
      const x = c * cw, y = r * ch;
      const cell = cells[i] || {};
      ctx.strokeStyle = '#cdb088'; ctx.lineWidth = 1; ctx.strokeRect(x, y, cw, ch);
      if (cell.type === 'property') {
        ctx.fillStyle = GROUP_COLOR[cell.group] || '#666'; ctx.font = 'bold ' + Math.round(cs * 0.2) + 'px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('$' + cell.price, x + 5, y + 4);                                   // 价格左上角，颜色=等级
        if (cell.level) { ctx.fillStyle = '#b58a5a'; ctx.font = Math.round(cs * 0.2) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; let st = ''; for (let k = 0; k < cell.level; k++) st += '★'; ctx.fillText(st, x + cw / 2, y + ch - 13); }  // 等级星在底部色条上方
        if (cell.owner) { ctx.fillStyle = seatColor(cell.owner); ctx.fillRect(x, y + ch - 9, cw, 9); }  // 归属=底部色条(玩家色)
      }
      const cmap = { start: '#3aa75c', card: '#e8b94d', tax: '#e85a86', jail: '#7a5c3a', bonus: '#3a86ff', freepark: '#06d6a0', property: '#5a4030' };
      ctx.fillStyle = cmap[cell.type] || '#5a4030';
      ctx.font = Math.round(cs * 0.21) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      this.wrapText(ctx, cell.name || '', x + cw / 2, y + (cell.type === 'property' ? ch * 0.38 : 5), cw - 4, cs * 0.22);
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
    this.drawCardAnim(ctx);
    this.drawFxAnim(ctx);
    this.drawWinner(ctx);
  },
  drawWinner(ctx) {
    if (!this.data.winner) return;
    const cs = this.cs, cx = this.W / 2, cy = this.H / 2;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(cs * 0.75) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.data.winnerText || '', cx, cy);
    ctx.font = Math.round(cs * 0.3) + 'px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fillText('点底部「再来」开始新一局', cx, cy + cs * 0.8);
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
