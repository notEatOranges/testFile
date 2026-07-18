// monopoly —— 大富翁（功能8，双人联机，竖屏）
// 8×8 方形棋盘 28 格(DOM 渲染，非 canvas)。掷骰→棋子滑行→结算→事件特效。
// 地块 6 色组 + 可升级 + 机会/公共基金/缴税/监狱/奖金/免费停车；经典抵押/经典·休闲双模式(9.8)。
// 状态 games/monopoly/state = { mode, cells, pos, cash, savings, skip, turn, dice, log, winner, req, sellReq }
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');

const START_CASH = 1500;
const BOARD = 28;                       // 8×8 方形外圈：2*8+2*6=28，与原凹形一致，buildCells/pos 语义零变化
// cellCR：8×8 方形外圈格子的 [col,row]（0-based）。起点在左下，顺时针环绕（与原 PATH 顺序对齐）。
function cellCR(i) {
  i = ((i % BOARD) + BOARD) % BOARD;    // 支持负数/环绕（棋子插值复用）
  if (i < 8) return [i, 7];             // 底边 左→右（格0=起点=左下）
  if (i < 15) return [7, 14 - i];       // 右边 下→上
  if (i < 22) return [21 - i, 0];       // 顶边 右→左
  return [0, i - 21];                   // 左边 上→下
}
// 双卡组：机会(偏移动/机缘) + 公共基金(偏金钱事件)。cash 自己加减；cashPeer 对方给/收；to 回起点；back 后退；skip 停一回合
const DECK = [
  { t: '银行分红 +50', cash: 50 }, { t: '生日红包 对方送你 +100', cashPeer: 100 }, { t: '遗产继承 +100', cash: 100 },
  { t: '股票大涨 +150', cash: 150 }, { t: '退税 +40', cash: 40 }, { t: '中奖 +200', cash: 200 }, { t: '捡到钱包 +80', cash: 80 },
  { t: '前进到起点 +200', to: 0 }, { t: '对方请客 你 +60', cashPeer: 60 }, { t: '利息到账 +30', cash: 30 },
  { t: '经验骰子 摇骰前进(同正常掷骰)', fwdRoll: true }, { t: '幸运骰子 自选前进 1~8 步', luckyDice: true }, { t: '惩罚骰子 摇骰后退(落对方铺交租)', backRoll: true },
  { t: '修缮费 -120', cash: -120 }, { t: '医药费 -150', cash: -150 }, { t: '违章 -90', cash: -90 }, { t: '丢手机 -120', cash: -120 },
  { t: '进修学费 -150', cash: -150 }, { t: '爱心捐款 -60', cash: -60 }, { t: '请客吃饭 -80', cash: -80 }, { t: '进监狱 移到监狱并停一回合', toJail: true, skip: true }
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
    else { const g = ni % 6; const price = 80 + g * 60 + ni * 4; cells.push({ name: names[ni % names.length], type: 'property', group: g, price, rent: Math.round(price * 0.12), owner: null, level: 0, mortgaged: false }); ni++; }
  }
  return cells;
}
function rentOf(cell, cells) {
  if (cell.mortgaged) return 0;                                  // 经典：抵押中的地不收过路费
  const LEVEL_MULT = [1, 2, 3, 5];                               // 非线性：越高级涨幅越陡(对标 Monopoly 建房阶梯)
  let r = cell.rent * LEVEL_MULT[cell.level || 0];
  if (cell.owner && cells && ownsFullSet(cells, cell.group, cell.owner)) r = r * 2;   // 同色成套：过路费翻倍(经典原版)
  return Math.round(r);
}
function upgradeCost(cell) { return Math.round(cell.price * 0.5); }
// 卖银行回收价：(地皮价值 + 已投入升级费) × 60%。sellToBank / myProps 共用，避免重复公式。
function bankRecover(cell) { return Math.round((cell.price + (cell.level || 0) * upgradeCost(cell)) * 0.6); }
// 经典抵押：抵押拿地价一半现金(抵押中的地不收租)，赎回付抵押值 +10%(一次性，无循环利息)。
function mortgageValueOf(cell) { return Math.round(cell.price * 0.5); }
function redeemValueOf(cell) { return Math.round(cell.price * 0.55); }
// 同色组（连铺）：groupCells 取某色组全部地皮；ownsFullSet 判断是否被一人集齐（成套）。
function groupCells(cells, g) { return cells.filter(c => c && c.type === 'property' && c.group === g); }
function ownsFullSet(cells, g, owner) { const gs = groupCells(cells, g); return gs.length > 0 && gs.every(c => c.owner === owner); }
function seatShape(role) { return rt.seatOf(role) === rt.RED ? 'heart' : 'star'; }
function seatColor(role) { return rt.seatOf(role) === rt.RED ? '#ff5a5f' : '#00b8d4'; }   // 珊瑚红/青，避开地皮 6 色

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
    mode: 'casual', iconTheme: 'tdesign',   // iconTheme: tdesign(默认) | emoji | image，本地存储，9.9g 加切换
    grid: [], tokenMe: null, tokenPeer: null,   // DOM 棋盘 28 格 + 两个棋子(绝对定位)
    diceAnim: null, cardAnim: null, fx: null,    // 骰子/抽牌/特效 DOM 动画数据
    bankOpen: false, mySavings: 0, peerSavings: 0, myProps: [], mySets: [], sellReqPending: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura', iconTheme: wx.getStorageSync('mono_iconTheme') || 'tdesign' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    this.setData({ mySeat: rt.seatOf(room.getRole()) });
    ident.bind(this, { onChange: () => this.applyState() });
  },
  onReady() { this.measureBoard(); },
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'monopoly', s => { this._state = s; this.applyState(); });
  },
  onUnload() {
    rt.teardown(this); ident.teardown(this);
    if (this._diceTimer) clearTimeout(this._diceTimer);
    if (this._rollWatchdog) clearTimeout(this._rollWatchdog);
    if (this._raf) clearTimeout(this._raf);
    if (this._cardTimer) clearTimeout(this._cardTimer);
    if (this._fxTimer) clearTimeout(this._fxTimer);
    if (this._diceAnimTimer) clearTimeout(this._diceAnimTimer);
  },

  fresh(mode) {
    return { mode: mode || 'casual', cells: buildCells(), pos: { boy: 0, girl: 0 }, cash: { boy: START_CASH, girl: START_CASH }, savings: { boy: 0, girl: 0 }, skip: { boy: 0, girl: 0 }, turn: Math.random() < 0.5 ? rt.RED : rt.BLUE, dice: 1, log: [], winner: null, req: null, sellReq: null };
  },
  startMatch(e) { this._recorded = false; rt.setState('monopoly', this.fresh(e && e.currentTarget && e.currentTarget.dataset.mode)); },
  requestRestart() { rt.requestRestart('monopoly', this._state, room.getRole(), !!this.data.winner, () => this.fresh(this._state && this._state.mode)); },
  cancelReq() { rt.cancelRestart('monopoly', this._state); },
  resign() {
    if (!this.data.started || this.data.winner) return;
    wx.showModal({ title: '认输', content: '确定认输吗？将判定破产', confirmText: '认输', confirmColor: '#e85a86',
      success: r => { if (r.confirm) rt.resign('monopoly', this._state, room.getRole()); } });
  },

  // 测量棋盘 DOM 尺寸(替代旧 setupCanvas)：只读 .mp-board 宽，算 cellW = w/8。无 ctx/dpr。
  measureBoard() {
    wx.createSelectorQuery().in(this).select('.mp-board').boundingClientRect(res => {
      const f = res && res[0];
      if (!f || !f.width) { setTimeout(() => this.measureBoard(), 80); return; }   // .mp-board 受 wx:if 控制，未渲染则重试
      this.boardW = f.width;
      this.cellW = f.width / 8;
      this.applyState();
    }).exec();
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
        success: r => { if (r.confirm) rt.acceptRestart('monopoly', () => me.fresh(me._state && me._state.mode)); else rt.rejectRestart('monopoly', me._state); } });
    } else if (reqSide !== 'peer') this._restartPrompted = false;

    if (!s || !s.cells) { this.setData(Object.assign({ started: false }, patch)); return; }
    this._cells = s.cells;
    const winner = s.winner || null;
    const turnSeat = s.turn || rt.RED;
    const myTurnFlag = !winner && turnSeat === this.data.mySeat;
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
    cells.forEach((c, idx) => { if (c && c.type === 'property' && c.owner === role) myProps.push({ idx, name: c.name, price: c.price, level: c.level || 0, mortgaged: !!c.mortgaged, mortgageValue: mortgageValueOf(c), redeemValue: redeemValueOf(c), sellBank: bankRecover(c), sellPeer: Math.round(c.price * 0.8) }); });
    // 同色组成套：集齐且全员 <3 级 → 可整组升级(休闲 9 折)；rentOf 对成套组自动翻倍
    const mySets = [];
    [0, 1, 2, 3, 4, 5].forEach(g => {
      const gs = groupCells(cells, g);
      if (gs.length && gs.every(c => c.owner === role) && gs.every(c => (c.level || 0) < 3)) {
        mySets.push({ group: g, count: gs.length, cost: Math.round(gs.reduce((sum, c) => sum + upgradeCost(c), 0) * (s.mode === 'classic' ? 1 : 0.9)), names: gs.map(c => c.name).join('/') });
      }
    });

    // DOM 棋盘：28 格 → 每格带 col/row(1-based)/cls/groupColor/ownerColor/isFullSet/levelArr，供 wxml grid 渲染
    const grid = cells.map((c, i) => {
      const [col, row] = cellCR(i);
      return Object.assign({}, c, {
        idx: i, col: col + 1, row: row + 1,
        cls: 'type-' + (c.type || 'property'),
        groupColor: c.type === 'property' ? (GROUP_COLOR[c.group] || '#666') : '',
        ownerColor: c.owner ? seatColor(c.owner) : '',
        isFullSet: c.type === 'property' && !!c.owner && ownsFullSet(cells, c.group, c.owner),
        levelArr: c.type === 'property' ? new Array(c.level || 0).fill(1) : []
      });
    });
    // 棋子像素坐标(按 pos + cellW)；动画进行中(moving)不被对端 state 覆盖
    const peerRole = role === 'boy' ? 'girl' : 'boy';
    if (this.cellW && s.pos) {
      const [mx, my] = this.tokenXY(s.pos[role]);
      const [px, py] = this.tokenXY(s.pos[peerRole]);
      if (!this.data.tokenMe || !this.data.tokenMe.moving) patch.tokenMe = { x: mx, y: my, hop: 0, kind: seatShape(role), color: seatColor(role), moving: false };
      if (!this.data.tokenPeer || !this.data.tokenPeer.moving) patch.tokenPeer = { x: px, y: py, hop: 0, kind: seatShape(peerRole), color: seatColor(peerRole), moving: false };
    }

    Object.assign(patch, {
      started: true, turnSeat, myTurn: myTurnFlag, rolling: myTurnFlag ? this.data.rolling : false,
      mode: s.mode || 'casual',
      dice: s.dice || 1,
      grid,
      log: (s.log || []).slice(-30).reverse().map(it => fmtLog(it, role, this.data.peerName)),
      myCash: (s.cash && s.cash[role]) || 0, peerCash: (s.cash && s.cash[peer]) || 0,
      mySavings: (s.savings && s.savings[role]) || 0, peerSavings: (s.savings && s.savings[peer]) || 0,
      myPos: (s.pos && s.pos[role]) || 0, peerPos: (s.pos && s.pos[peer]) || 0,
      myProps, mySets, winner, winnerText
    });
    this.setData(patch);
  },

  showFx(kind, text) {
    this.setData({ fx: { kind, text } });
    if (this._fxTimer) clearTimeout(this._fxTimer);
    this._fxTimer = setTimeout(() => this.setData({ fx: null }), 1500);
  },

  async roll() {
    if (!this.data.myTurn || this.data.winner || this.data.rolling) return;
    const role = room.getRole();
    const s = this._state;
    this.setData({ rolling: true });
    // rolling 现在交由 applyState 在「回合离开我/胜负已定」时清掉（期间保持 true，堵住重复摇）。
    // 安全网：若回合未推进（异常/watch 漏推）导致 rolling 卡死，12s 后强制释放，避免「点摇骰无反应需重进」。
    if (this._rollWatchdog) clearTimeout(this._rollWatchdog);
    this._rollWatchdog = setTimeout(() => { if (this.data.rolling) { console.warn('[monopoly] roll watchdog: force-release'); this.setData({ rolling: false }); } }, 12000);
    try {
    const d = await this.rollDiceAnim();             // 单 8 面骰
    const steps = d;
    this.setData({ dice: d });

    const from = s.pos[role];
    const crossed = (from + steps) >= BOARD;
    const to = (from + steps) % BOARD;
    let cash = Object.assign({}, s.cash);
    const savings = Object.assign({}, s.savings || { boy: 0, girl: 0 });
    const log = (s.log || []).slice();
    if (crossed) {
      cash[role] = (cash[role] || 0) + 200;
      if (s.mode !== 'classic') { const sav = savings[role] || 0; if (sav) { const it = Math.round(sav * 0.05); savings[role] = sav + it; log.push({ who: role, text: '存款利息 +' + it }); } }   // 仅休闲模式：存款 +5%
    }
    log.push({ who: role, text: '掷出 ' + steps + (crossed ? '，经过起点 +200' : '') });

    // 先写一次：棋子已移动 + 日志立即可见（携带 savings）
    this._state = Object.assign({}, s, { pos: Object.assign({}, s.pos, { [role]: to }), cash, savings, dice: d, log });
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
    finally { if (this._rollWatchdog) { clearTimeout(this._rollWatchdog); this._rollWatchdog = null; } }
  },

  // 棋子滑行：9.9a 最简版(瞬移，由 applyState 按 pos 渲染)；真实滑行动画 9.9c 加(setTimeout + setData)。
  animateMove(role, from, to, backward) {
    return Promise.resolve();
  },

  // 骰子翻滚：tumble(数字乱跳+摆动衰减) → settle(落定显点数+前进提示) → idle。
  rollDiceAnim() {
    return new Promise(res => {
      const f = 1 + Math.floor(Math.random() * 8);   // 单 8 面骰：1~8
      const t0 = Date.now(); const tumble = 720, settle = 600;
      const step = () => {
        const el = Date.now() - t0;
        if (el < tumble) {
          const ang = Math.sin(el / tumble * Math.PI * 5) * 350 * (1 - el / tumble);
          this.setData({ diceAnim: { phase: 'tumble', v: 1 + Math.floor(Math.random() * 8), angle: ang, showHint: false } });
          this._diceAnimTimer = setTimeout(step, 60);
        } else if (el < tumble + settle) {
          this.setData({ diceAnim: { phase: 'settle', v: f, angle: 0, showHint: true } });
          this._diceAnimTimer = setTimeout(step, 60);
        } else { this.setData({ dice: f, diceAnim: { phase: 'idle', v: f, angle: 0, showHint: true } }); res(f); }
      };
      step();
    });
  },

  // 抽牌：9.9a 最简版(直接揭晓文字 1.5s)；翻面动画 9.9e 加(rotateY)。
  drawCard() {
    return new Promise(res => {
      const c = DECK[Math.floor(Math.random() * DECK.length)];
      const kind = (c.cash != null && c.cash < 0) || c.skip || c.back || c.backRoll ? 'bad' : 'good';
      this.setData({ cardAnim: { kind, text: c.t } });
      this._cardTimer = setTimeout(() => { this.setData({ cardAnim: null }); res(c); }, 1500);
    });
  },

  // 写一次中间态（让事件日志及时同步给双方）
  syncLog(cells, cash, log, pos, skip, extra) {
    this._state = Object.assign({}, this._state, { cells: cells.map(c => Object.assign({}, c)), cash: Object.assign({}, cash), pos: Object.assign({}, pos), skip: Object.assign({}, skip), log: log.slice(-30) }, extra || {});
    rt.setState('monopoly', this._state);
  },

  async resolve(role, idx, cash, log, turn, opts) {
    opts = opts || {};
    const cells = this._cells.map(c => Object.assign({}, c));
    const cell = cells[idx];
    const peer = role === 'boy' ? 'girl' : 'boy';
    let skip = Object.assign({}, this._state.skip || { boy: 0, girl: 0 });
    let pos = Object.assign({}, this._state.pos);
    let savings = Object.assign({}, this._state.savings || { boy: 0, girl: 0 });
    let winner = null;
    let toIdx = idx;

    if (cell.type === 'start') { cash[role] += 100; log.push({ who: role, text: '到达起点 +100' }); }
    else if (cell.type === 'tax') { cash[role] -= cell.amt; log.push({ who: role, text: '缴税 -' + cell.amt }); this.showFx('bad', '缴税 -' + cell.amt); }
    else if (cell.type === 'bonus') { cash[role] += cell.amt; log.push({ who: role, text: '获得奖金 +' + cell.amt }); this.showFx('good', cell.name + ' +' + cell.amt); }
    else if (cell.type === 'jail') { skip[role] = (skip[role] || 0) + 1; log.push({ who: role, text: '进了监狱，下回合停留' }); this.showFx('bad', '进监狱，停一回合'); }
    else if (cell.type === 'freepark') { cash[role] = (cash[role] || 0) + 50; log.push({ who: role, text: '免费停车 +50' }); this.showFx('good', '免费停车 +50'); }
    else if (cell.type === 'card') {
      if (opts.backward) { log.push({ who: role, text: '后退路过「' + cell.name + '」（不触发抽牌）' }); }   // 后退落地不抽牌，避免移动卡循环
      else {
        const card = await this.drawCard();
        log.push({ who: role, text: (cell.kind === 'fate' ? '抽中公共基金：' : '抽中机会：') + card.t });
        if (card.cash) cash[role] = (cash[role] || 0) + card.cash;
        if (card.cashPeer) { cash[role] = (cash[role] || 0) + card.cashPeer; cash[peer] = (cash[peer] || 0) - card.cashPeer; }
        if (card.to === 0) { cash[role] += 200; toIdx = 0; log.push({ who: role, text: '回到起点 +200' }); }
        if (card.toJail) { const ji = cells.findIndex(c => c && c.type === 'jail'); if (ji >= 0) { toIdx = ji; log.push({ who: role, text: '被关进监狱' }); this.showFx('bad', '关进监狱'); } }
        if (card.skip) skip[role] = (skip[role] || 0) + 1;
        // 移动类卡牌：摇/选步数 → 动画移动 → 在新落点递归结算（前进同正常掷骰；后退为惩罚：不买不升级、对方铺交租、监狱坐牢）
        if (card.fwdRoll || card.luckyDice || card.backRoll) {
          const backward = !!card.backRoll;
          let steps;
          if (card.luckyDice) {
            steps = await new Promise(res => wx.showModal({ title: '幸运骰子', editable: true, placeholderText: '输入前进 1~8 步', confirmText: '前进', success: r => { if (r.confirm) { const n = parseInt(r.content, 10); res((n >= 1 && n <= 8) ? n : 1); } else res(1); }, fail: () => res(1) }));
            log.push({ who: role, text: '幸运骰子：选择前进 ' + steps + ' 步' });
          } else {
            steps = 1 + Math.floor(Math.random() * 8);
            log.push({ who: role, text: (backward ? '惩罚骰子' : '经验骰子') + '：摇出 ' + steps + '，' + (backward ? '后退' : '前进') + ' ' + steps + ' 步' });
          }
          const fromIdx = idx, to = backward ? ((idx - steps) % BOARD + BOARD) % BOARD : (idx + steps) % BOARD;
          if (!backward && fromIdx + steps >= BOARD) {       // 前进跨起点：同正常掷骰（+200/休闲模式存款息）
            cash[role] = (cash[role] || 0) + 200;
            if ((this._state.mode || 'casual') !== 'classic') { const sav = savings[role] || 0; if (sav) { const it = Math.round(sav * 0.05); savings[role] = sav + it; log.push({ who: role, text: '存款利息 +' + it }); } }
            log.push({ who: role, text: '经过起点 +200' });
          }
          pos = Object.assign({}, pos, { [role]: to });
          this.syncLog(cells, cash, log, pos, skip, { savings });
          await this.animateMove(role, fromIdx, to, backward);
          if (backward) this.showFx('bad', '后退 ' + steps);
          return await this.resolve(role, to, cash, log, turn, backward ? { backward: true } : {});
        }
        this.syncLog(cells, cash, log, pos, skip, { savings });
      }
    } else if (cell.type === 'property') {
      if (opts.backward) {
        // 后退惩罚落地：对方铺交过路费；空地/自家都不能购买或升级
        if (cell.owner && cell.owner !== role) {
          const r = rentOf(cell, cells); cash[role] -= r; cash[peer] += r;
          log.push({ who: role, text: '后退到{{' + cell.owner + '}}的「' + cell.name + '」付过路费 ' + r }); this.showFx('bad', '后退付过路费 ' + r);
        } else { log.push({ who: role, text: '后退到「' + cell.name + '」(' + (cell.owner === role ? '自家' : '空地') + '，不能购买/升级)' }); }
      } else if (!cell.owner) {
        const afford = (cash[role] || 0) >= cell.price;
        const choice = await new Promise(res => {
          if (afford) wx.showModal({ title: cell.name, content: '花 ' + cell.price + ' 买下？（过路费 ' + rentOf(cell, cells) + '）', confirmText: '买下', cancelText: '不买', success: r => res(r.confirm ? 'buy' : false) });
          else { toast('现金不足，买不起「' + cell.name + '」(可去银行抵押地皮周转)'); res(false); }
        });
        if (choice === 'buy') { cash[role] -= cell.price; cells[idx] = Object.assign({}, cell, { owner: role }); log.push({ who: role, text: '购买「' + cell.name + '」-' + cell.price }); this.showFx('good', '入手「' + cell.name + '」'); }
      } else if (cell.owner === role) {
        // 自己的地：可升级（最高 3 级）
        if ((cell.level || 0) < 3) {
          const cost = upgradeCost(cell);
          if ((cash[role] || 0) < cost) { log.push({ who: role, text: '现金不足，无法升级「' + cell.name + '」' }); }
          else {
            const up = await new Promise(res => {
              wx.showModal({ title: '升级「' + cell.name + '」', content: '升到 ' + ((cell.level || 0) + 2) + ' 级？花 ' + cost + '（过路费变 ' + rentOf(Object.assign({}, cell, { level: (cell.level || 0) + 1 }), cells) + '）', confirmText: '升级', cancelText: '不了', success: r => res(r.confirm) });
            });
            if (up) { cash[role] -= cost; cells[idx] = Object.assign({}, cell, { level: (cell.level || 0) + 1 }); log.push({ who: role, text: '升级「' + cell.name + '」到 ' + (cells[idx].level + 1) + ' 级' }); this.showFx('good', '升级！过路费上涨'); }
          }
        } else { log.push({ who: role, text: '「' + cell.name + '」已满级' }); }
      } else {
        const r = rentOf(cell, cells); cash[role] -= r; cash[peer] += r;
        log.push({ who: role, text: '路过{{' + cell.owner + '}}的「' + cell.name + '」付过路费 ' + r });
        this.showFx('bad', '付过路费 ' + r);
      }
    }

    // 现金为负 → 破产救助（存款→抵押→卖地→破产），不再直接判输
    if (cash[role] < 0) {
      const bankrupt = await this.coverShortfall(role, cells, cash, savings, log);
      if (bankrupt) winner = role === 'boy' ? rt.BLUE : rt.RED;
    }
    if (toIdx !== idx) pos = Object.assign({}, pos, { [role]: toIdx });
    let nextRole = peer;
    if (!winner && (skip[peer] || 0) > 0) { skip[peer]--; nextRole = role; log.push({ who: peer, text: '停一回合（跳过本次）' }); }
    rt.setState('monopoly', Object.assign({}, this._state, { cells: cells.map(c => Object.assign({}, c)), pos, cash, savings, skip, turn: winner ? turn : rt.seatOf(nextRole), dice: this.data.dice, log: log.slice(-30), winner, req: null }));
  },

  // 破产救助：现金为负时自动自救，全程不弹窗。顺序：取存款 → 自动抵押自有地(拿半价) → 卖地给银行；仍不足才真破产。
  // 就地修改传入的 cash/savings/cells/log，返回是否破产。
  async coverShortfall(role, cells, cash, savings, log) {
    while (cash[role] < 0 && (savings[role] || 0) > 0) {                       // 1) 存款补
      const need = Math.min(-cash[role], savings[role]);
      savings[role] -= need; cash[role] += need;
      log.push({ who: role, text: '取出存款 ' + need + ' 补亏空' });
      this.syncLog(cells, cash, log, this._state.pos, this._state.skip, { savings });
    }
    while (cash[role] < 0) {                                                    // 2) 自动抵押自有未抵押地(拿半价，地仍归己只是暂不收租)
      const cand = [];
      cells.forEach((c, i) => { if (c && c.type === 'property' && c.owner === role && !c.mortgaged) cand.push(i); });
      if (!cand.length) break;
      cand.sort((a, b) => mortgageValueOf(cells[b]) - mortgageValueOf(cells[a]));   // 优先抵押值高的
      const i = cand[0], c = cells[i], get = mortgageValueOf(c);
      cells[i] = Object.assign({}, c, { mortgaged: true });
      cash[role] += get; log.push({ who: role, text: '自动抵押「' + c.name + '」+' + get + '(暂不收租)' });
      this.syncLog(cells, cash, log, this._state.pos, this._state.skip, { savings });
    }
    while (cash[role] < 0) {                                                    // 3) 抵押光了还不够 → 卖地给银行
      const cand = [];
      cells.forEach((c, i) => { if (c && c.type === 'property' && c.owner === role) cand.push(i); });
      if (!cand.length) break;
      cand.sort((a, b) => bankRecover(cells[b]) - bankRecover(cells[a]));
      const i = cand[0], c = cells[i], get = bankRecover(c);
      cells[i] = Object.assign({}, c, { owner: null, level: 0, mortgaged: false });
      cash[role] += get; log.push({ who: role, text: '变卖「' + c.name + '」给银行 +' + get });
      this.showFx('bad', '变卖「' + c.name + '」+' + get);
      this.syncLog(cells, cash, log, this._state.pos, this._state.skip, { savings });
    }
    if (cash[role] < 0) { this.showFx('bad', '资产耗尽，破产！'); return true; }   // 4) 仍为负 → 破产
    return false;
  },

  // —— 银行/资产：存款/卖地/抵押 ——
  openBank() { this.setData({ bankOpen: true }); },
  noop() {},
  closeBank() { this.setData({ bankOpen: false }); },
  bankAct(e) {
    const act = e.currentTarget.dataset.act, amt = parseInt(e.currentTarget.dataset.amt || '0', 10);
    const role = room.getRole();
    // 走 transactionState：从 DB 现读整份状态再派生，避免从陈旧 this._state 带出 turn/pos 把错回合写回（丢摇骰 bug 根因）
    rt.transactionState('monopoly', s => {
      if (!s || !s.cash) return s;
      const cash = Object.assign({}, s.cash), savings = Object.assign({}, s.savings || { boy: 0, girl: 0 });
      const lg = (s.log || []).slice();
      if (act === 'deposit') {
        if ((cash[role] || 0) < amt) { toast('现金不足'); return s; }
        cash[role] -= amt; savings[role] = (savings[role] || 0) + amt; lg.push({ who: role, text: '存入银行 ' + amt });
      } else if (act === 'withdraw') {
        const v = Math.min(amt, savings[role] || 0); if (v <= 0) { toast('没有存款'); return s; }
        savings[role] -= v; cash[role] += v; lg.push({ who: role, text: '取出存款 ' + v });
      } else { toast('操作失败'); return s; }
      return Object.assign({}, s, { cash, savings, log: lg.slice(-30) });
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
          cs[idx] = Object.assign({}, c, { owner: null, level: 0, mortgaged: false });
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
  // 经典抵押：把自有地抵押给银行换半价现金，抵押中的地不收过路费。走 transactionState 现读现写 + 防御。
  mortgageProp(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10), role = room.getRole();
    rt.transactionState('monopoly', s => {
      if (!s || !s.cells) return s;
      const c = s.cells[idx];
      if (!c || c.owner !== role) { toast('地块已变化'); return s; }
      if (c.mortgaged) { toast('已抵押'); return s; }
      const get = mortgageValueOf(c);
      const cs = s.cells.map(x => Object.assign({}, x));
      cs[idx] = Object.assign({}, c, { mortgaged: true });
      const cash = Object.assign({}, s.cash); cash[role] = (cash[role] || 0) + get;
      const lg = (s.log || []).slice(); lg.push({ who: role, text: '抵押「' + c.name + '」+' + get + '(抵押中不收租)' });
      return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-30) });
    });
  },
  // 赎回：付抵押值+10% 解除抵押，恢复收租。
  redeemProp(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10), role = room.getRole();
    rt.transactionState('monopoly', s => {
      if (!s || !s.cells) return s;
      const c = s.cells[idx];
      if (!c || c.owner !== role) { toast('地块已变化'); return s; }
      if (!c.mortgaged) { toast('未抵押'); return s; }
      const due = redeemValueOf(c);
      if ((s.cash[role] || 0) < due) { toast('现金不足赎回'); return s; }
      const cs = s.cells.map(x => Object.assign({}, x));
      cs[idx] = Object.assign({}, c, { mortgaged: false });
      const cash = Object.assign({}, s.cash); cash[role] = (cash[role] || 0) - due;
      const lg = (s.log || []).slice(); lg.push({ who: role, text: '赎回「' + c.name + '」-' + due });
      return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-30) });
    });
  },
  // 同色组成套升级：整组每块 level+1，休闲模式打 9 折；走 transaction 现读现写
  upgradeGroup(e) {
    const g = parseInt(e.currentTarget.dataset.group, 10), role = room.getRole();
    rt.transactionState('monopoly', s => {
      if (!s || !s.cells) return s;
      const gs = s.cells.filter(c => c && c.type === 'property' && c.group === g);
      if (!gs.length || !gs.every(c => c.owner === role) || !gs.every(c => (c.level || 0) < 3)) { toast('整组不可升级'); return s; }
      const cost = Math.round(gs.reduce((sum, c) => sum + upgradeCost(c), 0) * (s.mode === 'classic' ? 1 : 0.9));
      const cash = Object.assign({}, s.cash);
      if ((cash[role] || 0) < cost) { toast('现金不足，无法整组升级'); return s; }
      cash[role] -= cost;
      const cs = s.cells.map(c => (c && c.type === 'property' && c.group === g) ? Object.assign({}, c, { level: (c.level || 0) + 1 }) : c);
      const lg = (s.log || []).slice(); lg.push({ who: role, text: '整组升级[' + gs.map(c => c.name).join('/') + '] -' + cost + '（过路费翻倍）' });
      this.showFx('good', '整组升级！过路费大涨');
      return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-30) });
    });
  },
  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); },

  // 棋子像素坐标：按连续位置 f(可小数) 在 8×8 外圈插值算中心。tokenMe/tokenPeer 的 left/top 用。
  tokenXY(f) {
    if (!this.cellW) return [0, 0];
    const i0 = Math.floor(f) % BOARD, i1 = (i0 + 1) % BOARD, fr = f - Math.floor(f);
    const [c0, r0] = cellCR(i0), [c1, r1] = cellCR(i1);
    const c = c0 + (c1 - c0) * fr, r = r0 + (r1 - r0) * fr;
    return [c * this.cellW + this.cellW / 2, r * this.cellW + this.cellW * 0.6];
  }
});
