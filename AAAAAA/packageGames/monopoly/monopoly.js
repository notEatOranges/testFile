// monopoly —— 大富翁（功能8，双人联机，竖屏）
// 8×8 方形棋盘 28 格(DOM 渲染，非 canvas)。掷骰→棋子滑行→结算→事件特效。
// 地块 6 色组 + 可升级 + 机会/公共基金/缴税/监狱/奖金/免费停车；经典抵押/经典·休闲双模式(9.8)。
// 状态 games/monopoly/state = { mode, cells, pos, cash, savings, skip, turn, dice, log, winner, req, sellReq }
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const ident = require('@utils/ident.js');
const rt = require('@utils/rtgame.js');
const { toast } = require('@utils/util.js');
const ICONS = require('./mono-icons.js');   // 棋盘图标表(店铺/功能格/房子酒店/标记，三主题素材)

const START_CASH = 1500;
const BOARD = 32;                       // 8×10 长方形外圈：2*8+2*8=32，比 8×8 多 4 格，容纳医院/警局且不减少 property
// cellCR：8×10 外圈格子的 [col,row]（0-based，col 0-7 × row 0-9）。起点在左下，顺时针环绕。
function cellCR(i) {
  i = ((i % BOARD) + BOARD) % BOARD;    // 支持负数/环绕（棋子插值复用）
  if (i < 8) return [i, 9];             // 底边 左→右（格0=起点=左下）
  if (i < 16) return [7, 16 - i];       // 右边 下→上
  if (i < 24) return [23 - i, 0];       // 顶边 右→左
  return [0, i - 23];                   // 左边 上→下
}
// 双牌组(符合经典 Monopoly):机会(chance)偏移动、公共基金(fate)偏金钱。落到对应格抽对应副。
const DECK = {
  chance: [   // 机会:移动为主
    { t: '前进到起点 +150', to: 0 },
    { t: '经验骰子 摇骰前进(同正常掷骰)', fwdRoll: true },
    { t: '幸运骰子 自选前进 1~6 步', luckyDice: true },
    { t: '惩罚骰子 摇骰后退(落对方铺交租)', backRoll: true },
    { t: '进监狱 移到监狱并停一回合', toJail: true, skip: true },
    { t: '退税 +40', cash: 40 },
    { t: '中奖 +150', cash: 150 },
    { t: '捡到钱包 +80', cash: 80 },
    { t: '意外收入 +60', cash: 60 },
    { t: '打架斗殴 受伤 -150', cash: -150 }
  ],
  fate: [     // 公共基金:金钱为主
    { t: '银行分红 +50', cash: 50 },
    { t: '生日红包 对方送你 +100', cashPeer: 100 },
    { t: '遗产继承 +100', cash: 100 },
    { t: '股票大涨 +150', cash: 150 },
    { t: '对方请客 你 +60', cashPeer: 60 },
    { t: '利息到账 +30', cash: 30 },
    { t: '修缮费 -120', cash: -120 },
    { t: '医药费 -150', cash: -150 },
    { t: '违章 -90', cash: -90 },
    { t: '丢手机 -120', cash: -120 },
    { t: '进修学费 -150', cash: -150 },
    { t: '爱心捐款 -60', cash: -60 },
    { t: '请客吃饭 -80', cash: -80 },
    { t: '门诊 -100', cash: -100 },
    { t: '住院观察 停一回合', skip: true }
  ]
};
const GROUP_COLOR = ['#9b7fd4', '#3a86ff', '#06d6a0', '#ffb703', '#e85a86', '#fb8500'];

function buildCells() {
  const cells = [{ name: '起点', type: 'start' }];
  const names = ['棉花糖摊', '奶茶店', '电影院', '咖啡馆', '书店', '花店', '游乐场', '海滩', '摩天轮', '甜品屋', '民宿', '烟火大会', '星空营地', '音乐节', '滑雪场', '温泉', '灯塔', '古镇', '画廊', '酒庄', '马场', '茶园', '果园', '城堡', '集市', '甜品街', '玩具店', '面包房'];
  let ni = 0;
  for (let i = 1; i < BOARD; i++) {
    const m = i % 6;
    if (m === 0) cells.push({ name: i % 12 === 0 ? '公共基金' : '机会', type: 'card', kind: i % 12 === 0 ? 'fate' : 'chance' });
    else if (i === 11 || i === 22 || i === 29) cells.push({ name: '缴税', type: 'tax', amt: i === 11 ? 100 : (i === 22 ? 150 : 200) });
    else if (i === 16) cells.push({ name: '监狱', type: 'jail' });
    else if (i === 27 || i === 19) cells.push({ name: '奖金', type: 'bonus', amt: 180 });
    else if (i === 21 || i === 28) cells.push({ name: '免费停车', type: 'freepark' });
    else if (i === 7) cells.push({ name: '医院', type: 'hospital' });
    else if (i === 15) cells.push({ name: '警局', type: 'police' });
    else { const g = ni % 6; const price = 80 + g * 60 + ni * 4; cells.push({ name: names[ni % names.length], type: 'property', group: g, price, rent: Math.round(price * 0.12), owner: null, level: 0, mortgaged: false }); ni++; }
  }
  return cells;
}
function rentOf(cell, cells) {
  if (cell.mortgaged) return 0;                                  // 经典：抵押中的地不收过路费
  const LEVEL_MULT = [1, 2, 3, 4];                               // 非线性：越高级涨幅越陡(对标 Monopoly 建房阶梯)
  let r = cell.rent * LEVEL_MULT[cell.level || 0];
  if (cell.owner && cells && ownsFullSet(cells, cell.group, cell.owner)) r = Math.round(r * 1.5);   // 同色成套：过路费 ×1.5(双人对局落对方地概率高,×2 过致命)
  return Math.round(r);
}
function upgradeCost(cell) { return Math.round(cell.price * 0.5); }
// 卖银行回收价：(地皮价值 + 已投入升级费) × 60%。sellToBank / myProps 共用，避免重复公式。
function bankRecover(cell) { return Math.round((cell.price + (cell.level || 0) * upgradeCost(cell)) * 0.6); }
// 经典抵押：抵押拿地价一半现金(抵押中的地不收租)，赎回付抵押值 +10%(一次性，无循环利息)。
function mortgageValueOf(cell) { return Math.round(cell.price * 0.5); }
function redeemValueOf(cell) { return Math.round(cell.price * 0.55); }
const MEDICARE_CODE = 'C3T7Q5C3T7Q5';
// 医院看病 3 档：小病/中病 医保真减免 10%~60%；大病只扣 20 或 50(提示大额减免 1000~10000 但不真减) + 住院 1~2 天
function pickHospital() {
  const r = Math.random();
  if (r < 0.25) return { tier: '检查无病', cost: 0, deduct: 0, actualCost: 0, stay: 0, code: MEDICARE_CODE, healthy: true };   // 25% 无病,医保报销检查费不花钱
  if (r < 0.75) {                                   // 小病 50%：30~90，医保 10%~60% 真减
    const cost = 30 + Math.floor(Math.random() * 61), pct = 10 + Math.floor(Math.random() * 51);
    return { tier: '小病', cost, deduct: Math.round(cost * pct / 100), actualCost: Math.round(cost * (1 - pct / 100)), stay: 0, code: MEDICARE_CODE };
  }
  if (r < 0.95) {                                   // 中病 20%：100~150，医保 10%~60% 真减
    const cost = 100 + Math.floor(Math.random() * 51), pct = 10 + Math.floor(Math.random() * 51);
    return { tier: '中病', cost, deduct: Math.round(cost * pct / 100), actualCost: Math.round(cost * (1 - pct / 100)), stay: 0, code: MEDICARE_CODE };
  }
  const cost = Math.random() < 0.5 ? 20 : 50;        // 大病 5%：扣 20 或 50
  return { tier: '大病', cost, deduct: 1000 + Math.floor(Math.random() * 9001), actualCost: cost, stay: Math.random() < 0.5 ? 2 : 1, code: MEDICARE_CODE, fake: true };
}
// 警局 4 档奖励(真奖励,不夸大)：小额 70% / 中额 25% / 见义勇为 4%(+200) / 个人三等功 1%(+1000)
function pickPolice() {
  const r = Math.random();
  if (r < 0.70) return { tier: '小额奖励', actualReward: 20 + Math.floor(Math.random() * 51) };   // 20~70
  if (r < 0.95) return { tier: '中额奖励', actualReward: 100 + Math.floor(Math.random() * 51) };
  if (r < 0.99) return { tier: '见义勇为', actualReward: 200 };
  return { tier: '个人三等功', actualReward: 1000 };
}
// 同色组（连铺）：groupCells 取某色组全部地皮；ownsFullSet 判断是否被一人集齐（成套）。
function groupCells(cells, g) { return cells.filter(c => c && c.type === 'property' && c.group === g); }
function ownsFullSet(cells, g, owner) { const gs = groupCells(cells, g); return gs.length > 0 && gs.every(c => c.owner === owner); }
function seatShape(role) { return rt.seatOf(role) === rt.RED ? 'heart' : 'star'; }
function seatColor(role) { return rt.seatOf(role) === rt.RED ? '#ff5a5f' : '#00b8d4'; }   // 珊瑚红/青，避开地皮 6 色

// 日志条目结构化：{ who: 触发者role, text: '描述' }，text 内可用 {{boy}}/{{girl}} 占位指代某个玩家。
// 渲染时按「当前观看者」视角转换：自己 →「你」，对方 → 对方昵称。双方共享同一份中立 log，各自看到自己的视角。
function fmtCash(n) {
  n = Math.abs(n || 0);
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '亿';
  if (n >= 1e7) return (n / 1e7).toFixed(1) + '千万';
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '万';
  return String(n);
}
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
    mode: 'casual', iconTheme: 'emoji',   // iconTheme: emoji(默认) | tdesign | image，本地存储，9.9g 加切换
    grid: [], tokenMe: null, tokenPeer: null,   // DOM 棋盘 28 格 + 两个棋子(绝对定位)
    diceAnim: null, cardAnim: null, fx: null,    // 骰子/抽牌/特效 DOM 动画数据
    bankOpen: false, mySavings: 0, peerSavings: 0, myProps: [], mySets: [], sellReqPending: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura', iconTheme: wx.getStorageSync('mono_iconTheme') || 'emoji' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom(); room.join();
    this.setData({ mySeat: rt.seatOf(room.getRole()) });
    ident.bind(this, { onChange: () => this.applyState() });
  },
  onReady() {},
  onShow() {
    if (this._bound) return;
    this._bound = true;
    rt.bind(this, 'monopoly', s => {
      // 拒旧推送：一次摇骰多次写(syncLog/末尾)的 emit+watch 回调可能乱序/同毫秒到达，
      // 旧态(turn=自己)晚到覆盖 this._state → 连摇。用单调递增 seq 拒旧(比 ts 可靠,无同毫秒漏洞)。
      if (s && this._state && s.seq != null && this._state.seq != null && s.seq < this._state.seq) return;
      this._state = s; this.applyState();
    });
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
    return { mode: mode || 'casual', cells: buildCells(), pos: { boy: 0, girl: 0 }, cash: { boy: START_CASH, girl: START_CASH }, savings: { boy: 0, girl: 0 }, skip: { boy: 0, girl: 0 }, turn: Math.random() < 0.5 ? rt.RED : rt.BLUE, dice: 1, log: [], winner: null, req: null, sellReq: null, phase: 'idle', anim: null };
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
    // 新局检测：winner 从有变 null(认输/重开后开新局)→ 清本地 flag,避免上局残留(_recorded/_servedKey 等)影响新局
    if (!s.winner && this._state && this._state.winner) {
      this._recorded = false; this._servedKey = null; this._sellPrompted = false; this._restartPrompted = false;
    }
    // 自动服刑:轮到我 + skip[me]>0 → 跳过交对方(经典:进监狱/住院,下次自己回合自动停,不掷骰)。
    // 解决「两人都进监狱卡死」:各自在自己回合自动服刑,resolve 末尾不再检查对方停。
    if (!s.winner && s.turn === rt.seatOf(role) && (s.skip || {})[role] > 0) {
      const key = s.turn + '-' + (s.seq || 0);
      if (this._servedKey !== key) {
        this._servedKey = key;
        const lg = (s.log || []).slice(); lg.push({ who: role, text: '服刑/住院中,跳过本回合' });
        this.commit({ skip: Object.assign({}, s.skip, { [role]: s.skip[role] - 1 }), turn: rt.seatOf(peer), log: lg.slice(-20000) });
        return;
      }
    }
    // phase 恢复:重进/异常/杀后台后,phase!=idle 但 _rolling=false → roll 断了,恢复 idle + 交回合(防死锁)
    if (s.phase && s.phase !== 'idle') {
      if (!this._rolling && s.turn === rt.seatOf(role)) {
        // 我是 phase 发起者(turn=我)但 roll 已断(_rolling=false)→ 立即恢复
        const lg = (s.log || []).slice(); lg.push({ text: '中断恢复,自动结束回合' });
        this.commit({ phase: 'idle', anim: null, turn: rt.seatOf(peer), log: lg.slice(-20000) });
        return;
      }
      // 超时兜底(30s,任意一方检测):防发起者不回来,对方永久卡
      if (!this._phaseT0 || this._phaseT0 !== s.phase) { this._phaseT0 = s.phase; this._phaseT = Date.now(); }
      else if (Date.now() - this._phaseT > 30000) {
        const otherSeat = s.turn === rt.RED ? rt.BLUE : rt.RED;
        const lg = (s.log || []).slice(); lg.push({ text: '操作超时,自动结束回合' });
        this.commit({ phase: 'idle', anim: null, turn: otherSeat, log: lg.slice(-20000) });
        return;
      }
    } else { this._phaseT0 = null; }

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
            this.mtxn( s => {
              if (!s || !s.cells) return s;
              const cs = s.cells.map(c => Object.assign({}, c));
              const cash = Object.assign({}, s.cash);
              if ((cash[role] || 0) < sellReq.price) { toast('现金不足'); return Object.assign({}, s, { sellReq: null }); }
              cash[role] -= sellReq.price; cash[sellReq.by] = (cash[sellReq.by] || 0) + sellReq.price;
              cs[sellReq.idx] = Object.assign({}, cs[sellReq.idx], { owner: role });
              const lg = (s.log || []).slice(); lg.push({ who: role, text: '买下{{' + sellReq.by + '}}的「' + cs[sellReq.idx].name + '」-' + sellReq.price });
              return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-20000), sellReq: null });
            });
          } else { this.mtxn( s => Object.assign({}, s, { sellReq: null })); }
        } });
    } else if (!sellReq) { this._sellPrompted = false; }
    patch.sellReqPending = !!(sellReq && sellReq.by === role);

    const myProps = [];
    cells.forEach((c, idx) => { if (c && c.type === 'property' && c.owner === role) myProps.push({ idx, name: c.name, price: c.price, level: c.level || 0, mortgaged: !!c.mortgaged, mortgageValue: mortgageValueOf(c), redeemValue: redeemValueOf(c), sellBank: bankRecover(c), sellPeer: Math.round(c.price * 0.8) }); });
    const myPropCount = myProps.length, myMortgagedCount = myProps.filter(p => p.mortgaged).length;
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
      const icon = c.type === 'property' ? ICONS.shop[c.name]
        : (c.type === 'card' ? (c.kind === 'fate' ? ICONS.fate : ICONS.card) : ICONS[c.type]);
      return Object.assign({}, c, {
        idx: i, col: col + 1, row: row + 1,
        cls: 'type-' + (c.type || 'property'),
        groupColor: c.type === 'property' ? (GROUP_COLOR[c.group] || '#666') : '',
        ownerColor: c.owner ? seatColor(c.owner) : '',
        icon: icon || null,                       // 店铺/功能格图标(三主题素材 {t,e,i})
        houseIcon: ICONS.house, hotelIcon: ICONS.hotel,
        isFullSet: c.type === 'property' && !!c.owner && ownsFullSet(cells, c.group, c.owner),
        levelArr: c.type === 'property' ? new Array(c.level || 0).fill(1) : []
      });
    });
    // 棋子坐标:phase=idle 时才覆盖(rolling/moving/resolving 中由 anim/本地 animateMove 管)
    const peerRole = role === 'boy' ? 'girl' : 'boy';
    const isIdle = !s.phase || s.phase === 'idle';
    if (isIdle && s.pos) {
      const same = s.pos[role] === s.pos[peerRole];
      const [mx, my] = this.tokenXY(s.pos[role]);
      const [px, py] = this.tokenXY(s.pos[peerRole]);
      if (!this.data.tokenMe || !this.data.tokenMe.moving) patch.tokenMe = { x: same ? mx - 3 : mx, y: my, hop: 0, kind: seatShape(role), color: seatColor(role), moving: false };
      if (!this.data.tokenPeer || !this.data.tokenPeer.moving) patch.tokenPeer = { x: same ? px + 3 : px, y: py, hop: 0, kind: seatShape(peerRole), color: seatColor(peerRole), moving: false };
    }
    // 对端 moving 动画:对方 phase=moving + anim → 本地播 animateMove(不覆盖 pos)
    if (s.phase === 'moving' && s.anim && s.anim.role !== role && (!this._peerAnimKey || this._peerAnimKey !== s.seq)) {
      this._peerAnimKey = s.seq;
      this.animateMove(s.anim.role, s.anim.from, s.anim.to);
    }

    Object.assign(patch, {
      started: true, turnSeat, myTurn: myTurnFlag,
      mode: s.mode || 'casual',
      grid,
      log: (s.log || []).slice(-20000).reverse().map(it => fmtLog(it, role, this.data.peerName)),
      myCash: (s.cash && s.cash[role]) || 0, peerCash: (s.cash && s.cash[peer]) || 0,
      mySavings: (s.savings && s.savings[role]) || 0, peerSavings: (s.savings && s.savings[peer]) || 0,
      myPos: (s.pos && s.pos[role]) || 0, peerPos: (s.pos && s.pos[peer]) || 0,
      myProps, mySets, winner, winnerText, myPropCount, myMortgagedCount, myCashFmt: fmtCash((s.cash && s.cash[role]) || 0), mySavingsFmt: fmtCash((s.savings && s.savings[role]) || 0)
    });
    this.setData(patch);
  },

  showFx(kind, text) {
    this.setData({ fx: { kind, text } });
    if (this._fxTimer) clearTimeout(this._fxTimer);
    this._fxTimer = setTimeout(() => this.setData({ fx: null }), 1500);
  },

  async roll() {
    const role = room.getRole();
    const s = this._state;
    if (!s || s.winner || this._rolling || s.turn !== rt.seatOf(role) || (s.phase && s.phase !== 'idle')) return;
    this._rolling = true;
    this.setData({ rolling: true });
    try {
      // phase=rolling:摇骰中(不含 turn,对方看到"摇骰中")
      this.commit({ phase: 'rolling' });
      const d = await this.rollDiceAnim();
      const steps = d;
      this.setData({ dice: d });

      const from = s.pos[role];
      const crossed = (from + steps) >= BOARD;
      const to = (from + steps) % BOARD;
      let cash = Object.assign({}, s.cash);
      const savings = Object.assign({}, s.savings || { boy: 0, girl: 0 });
      const log = (s.log || []).slice();
      if (crossed) {
        cash[role] = (cash[role] || 0) + 150;
        if (s.mode !== 'classic') { const sav = savings[role] || 0; if (sav) { const it = Math.round(sav * 0.03); savings[role] = sav + it; log.push({ who: role, text: '存款利息 +' + it }); } }
      }
      log.push({ who: role, text: '掷出 ' + steps + (crossed ? '，经过起点 +150' : '') });

      // phase=moving:棋子移动中(推 anim 指令让对方看到动画,不含 turn/pos)
      this.commit({ phase: 'moving', anim: { role, from, to }, dice: d, cash, savings, log: log.slice(-20000) });
      await this.animateMove(role, from, to);

      // phase=resolving:结算中(买房 modal 等,不含 turn)
      this.commit({ phase: 'resolving', pos: Object.assign({}, s.pos, { [role]: to }) });
      const result = await this.resolve(role, to, cash, log, s.turn);

      // phase=idle:最终态,交回合
      this.commit(Object.assign({}, result, { phase: 'idle', anim: null }));
    } catch (err) {
      console.error('[monopoly] roll err', err); toast('出错了，请重试');
      // 异常时恢复 idle(不交回合,玩家可重试)
      try { this.commit({ phase: 'idle', anim: null }); } catch (e) {}
    }
    finally { this._rolling = false; this.setData({ rolling: false }); }
  },

  // 棋子沿外圈滑行：setTimeout(33ms) 逐帧 setData 棋子 x/y(百分比)/hop(rpx)；moving 标志防 applyState 覆盖；结束 res()。
  animateMove(role, from, to, backward) {
    return new Promise(res => {
      const span = backward ? -(((from - to + BOARD) % BOARD) || 0) : (((to < from ? to + BOARD : to)) - from);
      const key = role === room.getRole() ? 'tokenMe' : 'tokenPeer';
      const spanAbs = Math.abs(span); const t0 = Date.now(); const dur = Math.max(260, Math.min(1400, spanAbs * 120));   // 单位距离:每格 120ms,1步≥260,封顶 1400
      const step = () => {
        const p = Math.min(1, (Date.now() - t0) / dur);
        const hop = Math.abs(Math.sin(p * Math.PI * 2)) * 10;   // 跳动 rpx
        const f = from + span * p;
        const [x, y] = this.tokenXY(f);
        this.setData({ [key]: Object.assign({}, this.data[key], { x, y, hop, moving: true }) });
        if (p < 1) this._raf = setTimeout(step, 33);
        else { this.setData({ [key]: Object.assign({}, this.data[key], { hop: 0, moving: false }) }); res(); }
      };
      step();
    });
  },

  // 骰子翻滚：tumble(数字乱跳+摆动衰减) → settle(落定显点数+前进提示) → idle。
  rollDiceAnim() {
    return new Promise(res => {
      const f = 1 + Math.floor(Math.random() * 6);   // 单 6 面骰：1~6
      const t0 = Date.now(); const tumble = 720, settle = 600;
      const step = () => {
        const el = Date.now() - t0;
        if (el < tumble) {
          const ang = Math.sin(el / tumble * Math.PI * 5) * 350 * (1 - el / tumble);
          this.setData({ diceAnim: { phase: 'tumble', v: 1 + Math.floor(Math.random() * 6), angle: ang, showHint: false } });
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
  drawCard(deckKind) {
    return new Promise(res => {
      const pile = DECK[deckKind] || DECK.chance;   // 机会(chance)/公共基金(fate) 各抽各的
      const c = pile[Math.floor(Math.random() * pile.length)];
      const kind = (c.cash != null && c.cash < 0) || c.skip || c.back || c.backRoll ? 'bad' : 'good';
      this.setData({ cardAnim: { phase: 'shuffle' } });                // Phase 1: 洗牌 700ms
      setTimeout(() => {
        this.setData({ cardAnim: { phase: 'reveal', kind, text: c.t, flip: 1, face: false } });   // Phase 2: 翻面
        const t0 = Date.now(); const flipDur = 500;
        const flipStep = () => {                                       // scaleX 1→0→1 水平翻面，中点切正/反面
          const p = Math.min(1, (Date.now() - t0) / flipDur);
          const flip = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
          this.setData({ ['cardAnim.flip']: Math.max(0.02, flip), ['cardAnim.face']: p > 0.5 });
          if (p < 1) this._cardTimer = setTimeout(flipStep, 33);
        };
        flipStep();
        setTimeout(() => { this.setData({ cardAnim: null }); res(c); }, 1800);   // 停留后收牌
      }, 700);
    });
  },

  // 统一提交：本地递增 seq + 立即更新 _state + 推送。所有写状态走它，保证 seq 单调(防异步回调旧态覆盖 → 连摇)。
  commit(patch) {
    const ns = Object.assign({}, this._state, patch, { seq: (this._state.seq || 0) + 1 });
    this._state = ns;
    rt.setState('monopoly', ns);
    return ns;
  },
  // transactionState 包装：updater 派生后自动加 seq(银行/卖地/抵押等「读后改」操作)。
  mtxn(updater) {
    return rt.transactionState('monopoly', s => {
      if (s && s.winner) return s;   // 已结束,拒绝银行/卖地/抵押等操作
      const next = updater(s);
      // seq 取 DB 与本地较大者+1：bankAct 等用 transactionState(读 DB),DB.seq 可能落后于本地
      // this._state.seq(roll/resolve 的 commit 已本地 +1 但 setState 异步未到 DB),只按 DB.seq+1
      // 会小于本地 → 被 cb 拒旧 → 存款/抵押/卖地不生效。取 max 保证单调大于本地。
      const maxSeq = Math.max(((s && s.seq) || 0), (this._state.seq || 0));
      return next ? Object.assign({}, next, { seq: maxSeq + 1 }) : next;
    });
  },
  // 写一次中间态（让事件日志及时同步给双方）
  syncLog(cells, cash, log, pos, skip, extra) {
    this.commit(Object.assign({ cells: cells.map(c => Object.assign({}, c)), cash: Object.assign({}, cash), pos: Object.assign({}, pos), skip: Object.assign({}, skip), log: log.slice(-20000) }, extra || {}));
  },

  // resolve:纯计算函数(不 commit/syncLog),返回最终 patch。modal(买房/升级)可 await。
  async resolve(role, idx, cash, log, turn, opts) {
    opts = opts || {};
    const cells = this._cells.map(c => Object.assign({}, c));
    const cell = cells[idx];
    const peer = role === 'boy' ? 'girl' : 'boy';
    let skip = Object.assign({}, this._state.skip || { boy: 0, girl: 0 });
    let pos = Object.assign({}, this._state.pos, { [role]: idx });
    let savings = Object.assign({}, this._state.savings || { boy: 0, girl: 0 });
    let winner = null;
    let toIdx = idx;

    // 惩罚倒退屏蔽获利
    if (opts.backward && ['start', 'bonus', 'freepark', 'hospital', 'police'].indexOf(cell.type) >= 0) {
      log.push({ who: role, text: '后退路过「' + cell.name + '」(惩罚模式,不触发)' });
    } else if (cell.type === 'start') { cash[role] += 100; log.push({ who: role, text: '到达起点 +100' }); }
    else if (cell.type === 'tax') {
      const props = cells.filter(c => c.type === 'property' && c.owner === role);
      const totalRent = props.reduce((s, c) => s + rentOf(c, cells), 0);
      const tax = Math.max(20, Math.min(Math.round(totalRent * 0.1), 300));
      cash[role] -= tax; log.push({ who: role, text: '缴税(地皮过路费10%) -' + tax }); this.showFx('bad', '缴税 -' + tax);
    }
    else if (cell.type === 'bonus') { cash[role] += cell.amt; log.push({ who: role, text: '获得奖金 +' + cell.amt }); this.showFx('good', cell.name + ' +' + cell.amt); }
    else if (cell.type === 'jail') { log.push({ who: role, text: opts.backward ? '后退路过监狱(无事)' : '路过监狱(只是探望,不坐牢)' }); }
    else if (cell.type === 'freepark') { cash[role] = (cash[role] || 0) + 50; log.push({ who: role, text: '免费停车 +50' }); this.showFx('good', '免费停车 +50'); }
    else if (cell.type === 'hospital') {
      const h = pickHospital();
      if (h.healthy) {
        log.push({ who: role, text: '检查无病,医保' + h.code + ' 报销检查费' }); this.showFx('good', '检查无病,免费!');
      } else {
        cash[role] = (cash[role] || 0) - h.actualCost;
        if (h.fake) log.push({ who: role, text: '大病!医保' + h.code + ' 减免 ' + h.deduct + '(实际仍扣 ' + h.actualCost + '),住院 ' + h.stay + ' 天' });
        else log.push({ who: role, text: h.tier + '看病 -' + h.cost + ',医保' + h.code + ' 减免 ' + h.deduct + ',实扣 ' + h.actualCost });
        this.showFx('bad', (h.fake ? '大病 ' : h.tier + ' ') + '-' + h.actualCost + (h.stay > 0 ? ' 住院' + h.stay + '天' : ''));
        if (h.stay > 0) skip[role] = (skip[role] || 0) + h.stay;
      }
    }
    else if (cell.type === 'police') {
      const p = pickPolice();
      cash[role] = (cash[role] || 0) + p.actualReward;
      log.push({ who: role, text: '警局 ' + p.tier + ' +' + p.actualReward }); this.showFx('good', p.tier + ' +' + p.actualReward);
    }
    else if (cell.type === 'card') {
      if (opts.backward) { log.push({ who: role, text: '后退路过「' + cell.name + '」（不触发抽牌）' }); }
      else {
        const card = await this.drawCard(cell.kind);
        log.push({ who: role, text: (cell.kind === 'fate' ? '抽中公共基金：' : '抽中机会：') + card.t });
        if (card.cash) cash[role] = (cash[role] || 0) + card.cash;
        if (card.cashPeer) { cash[role] = (cash[role] || 0) + card.cashPeer; cash[peer] = (cash[peer] || 0) - card.cashPeer; }
        if (card.to === 0) { cash[role] += 150; toIdx = 0; log.push({ who: role, text: '回到起点 +150' }); }
        if (card.toJail) { const ji = cells.findIndex(c => c && c.type === 'jail'); if (ji >= 0) { toIdx = ji; log.push({ who: role, text: '被关进监狱' }); this.showFx('bad', '关进监狱'); } }
        if (card.skip) skip[role] = (skip[role] || 0) + 1;
        if (card.fwdRoll || card.luckyDice || card.backRoll) {
          const backward = !!card.backRoll;
          let steps;
          if (card.luckyDice) {
            steps = await new Promise(res => wx.showModal({ title: '幸运骰子', editable: true, placeholderText: '输入前进 1~6 步', confirmText: '前进', success: r => { if (r.confirm) { const n = parseInt(r.content, 10); res((n >= 1 && n <= 6) ? n : 1); } else res(1); }, fail: () => res(1) }));
            log.push({ who: role, text: '幸运骰子：选择前进 ' + steps + ' 步' });
          } else {
            steps = 1 + Math.floor(Math.random() * 6);
            log.push({ who: role, text: (backward ? '惩罚骰子' : '经验骰子') + '：摇出 ' + steps + '，' + (backward ? '后退' : '前进') + ' ' + steps + ' 步' });
          }
          const fromIdx = idx, to = backward ? ((idx - steps) % BOARD + BOARD) % BOARD : (idx + steps) % BOARD;
          if (!backward && fromIdx + steps >= BOARD) {
            cash[role] = (cash[role] || 0) + 150;
            if ((this._state.mode || 'casual') !== 'classic') { const sav = savings[role] || 0; if (sav) { const it = Math.round(sav * 0.03); savings[role] = sav + it; log.push({ who: role, text: '存款利息 +' + it }); } }
            log.push({ who: role, text: '经过起点 +150' });
          }
          pos = Object.assign({}, pos, { [role]: to });
          await this.animateMove(role, fromIdx, to, backward);
          if (backward) this.showFx('bad', '后退 ' + steps);
          return this._resolveInner(role, to, cash, savings, log, cells, pos, skip, turn, peer, winner, backward ? { backward: true } : {});
        }
        if (toIdx !== idx) { pos = Object.assign({}, pos, { [role]: toIdx }); await this.animateMove(role, idx, toIdx); }
      }
    } else if (cell.type === 'property') {
      if (opts.backward) {
        if (cell.owner && cell.owner !== role) {
          const r = rentOf(cell, cells);
          if (r > 0) { cash[role] -= r; cash[peer] += r; log.push({ who: role, text: '后退到{{' + cell.owner + '}}的「' + cell.name + '」付过路费 ' + r }); this.showFx('bad', '后退付过路费 ' + r); }
          else { log.push({ who: role, text: '后退到{{' + cell.owner + '}}的「' + cell.name + '」(已抵押，免过路费)' }); }
        } else { log.push({ who: role, text: '后退到「' + cell.name + '」(' + (cell.owner === role ? '自家' : '空地') + '，不能购买/升级)' }); }
      } else if (!cell.owner) {
        const cashNow = cash[role] || 0, sav = savings[role] || 0;
        const afford = cashNow >= cell.price;
        const canFromSav = !afford && (cashNow + sav) >= cell.price;
        const choice = await new Promise(res => {
          if (afford) wx.showModal({ title: cell.name, content: '花 ' + cell.price + ' 买下？（过路费 ' + rentOf(cell, cells) + '）', confirmText: '买下', cancelText: '不买', fail: () => res(false), success: r => res(r.confirm ? 'buy' : false) });
          else if (canFromSav) wx.showModal({ title: cell.name, content: '现金 ' + cashNow + ' 不足,从存款取 ' + (cell.price - cashNow) + ' 凑 ' + cell.price + ' 购买?(失去少量利息)', confirmText: '取存款买', cancelText: '不买', fail: () => res(false), success: r => res(r.confirm ? 'buyFromSav' : false) });
          else { toast('现金+存款仍不足,买不起「' + cell.name + '」(可去银行抵押地皮)'); res(false); }
        });
        if (choice === 'buy' || choice === 'buyFromSav') {
          if (choice === 'buyFromSav') { const need = cell.price - cashNow; savings[role] = sav - need; cash[role] = cashNow + need; log.push({ who: role, text: '从存款取 ' + need + ' 凑购房款' }); }
          cash[role] -= cell.price; cells[idx] = Object.assign({}, cell, { owner: role }); log.push({ who: role, text: '购买「' + cell.name + '」-' + cell.price }); this.showFx('good', '入手「' + cell.name + '」');
        }
      } else if (cell.owner === role) {
        if ((cell.level || 0) < 3) {
          const cost = upgradeCost(cell);
          const cashNow = cash[role] || 0, sav = savings[role] || 0;
          const afford = cashNow >= cost;
          const canFromSav = !afford && (cashNow + sav) >= cost;
          if (!afford && !canFromSav) { log.push({ who: role, text: '现金+存款都不足，无法升级「' + cell.name + '」' }); }
          else {
            const up = await new Promise(res => {
              if (afford) wx.showModal({ title: '升级「' + cell.name + '」', content: '升到 ' + ((cell.level || 0) + 2) + ' 级？花 ' + cost + '（过路费变 ' + rentOf(Object.assign({}, cell, { level: (cell.level || 0) + 1 }), cells) + '）', confirmText: '升级', cancelText: '不了', fail: () => res(false), success: r => res(r.confirm ? 'cash' : false) });
              else wx.showModal({ title: '取存款升级「' + cell.name + '」', content: '现金 ' + cashNow + ' 不足,从存款取 ' + (cost - cashNow) + ' 升到 ' + ((cell.level || 0) + 2) + ' 级?(过路费变 ' + rentOf(Object.assign({}, cell, { level: (cell.level || 0) + 1 }), cells) + ',失去少量利息)', confirmText: '取存款升级', cancelText: '不了', fail: () => res(false), success: r => res(r.confirm ? 'fromSav' : false) });
            });
            if (up === 'cash') { cash[role] -= cost; cells[idx] = Object.assign({}, cell, { level: (cell.level || 0) + 1 }); log.push({ who: role, text: '升级「' + cell.name + '」到 ' + (cells[idx].level + 1) + ' 级' }); this.showFx('good', '升级！过路费上涨'); }
            else if (up === 'fromSav') { const need = cost - cashNow; savings[role] = sav - need; cash[role] = cashNow + need - cost; cells[idx] = Object.assign({}, cell, { level: (cell.level || 0) + 1 }); log.push({ who: role, text: '取存款 ' + need + ' 升级「' + cell.name + '」到 ' + (cells[idx].level + 1) + ' 级' }); this.showFx('good', '升级！过路费上涨'); }
          }
        } else { log.push({ who: role, text: '「' + cell.name + '」已满级' }); }
      } else {
        const r = rentOf(cell, cells);
        if (r > 0) { cash[role] -= r; cash[peer] += r; log.push({ who: role, text: '路过{{' + cell.owner + '}}的「' + cell.name + '」付过路费 ' + r }); this.showFx('bad', '付过路费 ' + r); }
        else { log.push({ who: role, text: '路过{{' + cell.owner + '}}的「' + cell.name + '」(已抵押，免过路费)' }); }
      }
    }

    // 破产救助(纯计算)
    if (cash[role] < 0) {
      const bankrupt = this._coverShortfallPure(role, cells, cash, savings, log);
      if (bankrupt) winner = role === 'boy' ? rt.BLUE : rt.RED;
    }
    if (toIdx !== idx) pos = Object.assign({}, pos, { [role]: toIdx });
    return { cells: cells.map(c => Object.assign({}, c)), pos, cash, savings, skip: { boy: Math.max(0, skip.boy||0), girl: Math.max(0, skip.girl||0) }, turn: winner ? turn : rt.seatOf(peer), dice: this.data.dice, log: log.slice(-20000), winner, req: null, sellReq: null };
  },

  // resolve 递归入口(移动卡牌用):复用 resolve 逻辑但共享 cells/pos/skip
  async _resolveInner(role, idx, cash, savings, log, cells, pos, skip, turn, peer, winner, opts) {
    opts = opts || {};
    const cell = cells[idx];
    let toIdx = idx;
    if (opts.backward && ['start', 'bonus', 'freepark', 'hospital', 'police'].indexOf(cell.type) >= 0) {
      log.push({ who: role, text: '后退路过「' + cell.name + '」(惩罚模式,不触发)' });
    } else if (cell.type === 'start') { cash[role] += 100; log.push({ who: role, text: '到达起点 +100' }); }
    else if (cell.type === 'tax') {
      const props = cells.filter(c => c.type === 'property' && c.owner === role);
      const totalRent = props.reduce((s, c) => s + rentOf(c, cells), 0);
      const tax = Math.max(20, Math.min(Math.round(totalRent * 0.1), 300));
      cash[role] -= tax; log.push({ who: role, text: '缴税(地皮过路费10%) -' + tax }); this.showFx('bad', '缴税 -' + tax);
    }
    else if (cell.type === 'bonus') { cash[role] += cell.amt; log.push({ who: role, text: '获得奖金 +' + cell.amt }); this.showFx('good', cell.name + ' +' + cell.amt); }
    else if (cell.type === 'jail') { log.push({ who: role, text: opts.backward ? '后退路过监狱(无事)' : '路过监狱(只是探望)' }); }
    else if (cell.type === 'freepark') { cash[role] = (cash[role] || 0) + 50; log.push({ who: role, text: '免费停车 +50' }); this.showFx('good', '免费停车 +50'); }
    else if (cell.type === 'hospital') {
      const h = pickHospital();
      if (!h.healthy) {
        cash[role] = (cash[role] || 0) - h.actualCost;
        log.push({ who: role, text: h.fake ? '大病!医保减免(实际扣' + h.actualCost + ')' : h.tier + '看病 -' + h.actualCost });
        this.showFx('bad', h.tier + ' -' + h.actualCost); if (h.stay > 0) skip[role] = (skip[role] || 0) + h.stay;
      } else { log.push({ who: role, text: '检查无病' }); }
    }
    else if (cell.type === 'police') { const p = pickPolice(); cash[role] += p.actualReward; log.push({ who: role, text: '警局 +' + p.actualReward }); this.showFx('good', '+' + p.actualReward); }
    else if (cell.type === 'property') {
      if (opts.backward) {
        if (cell.owner && cell.owner !== role) { const r = rentOf(cell, cells); if (r > 0) { cash[role] -= r; cash[peer] += r; log.push({ who: role, text: '后退付过路费 ' + r }); this.showFx('bad', '过路费 ' + r); } }
      } else if (!cell.owner) {
        const afford = (cash[role] || 0) >= cell.price;
        const choice = await new Promise(res => { if (afford) wx.showModal({ title: cell.name, content: '花 ' + cell.price + ' 买下？', confirmText: '买下', cancelText: '不买', fail: () => res(false), success: r => res(r.confirm ? 'buy' : false) }); else { toast('现金不足'); res(false); } });
        if (choice === 'buy') { cash[role] -= cell.price; cells[idx] = Object.assign({}, cell, { owner: role }); log.push({ who: role, text: '购买「' + cell.name + '」-' + cell.price }); this.showFx('good', '入手'); }
      } else if (cell.owner !== role) { const r = rentOf(cell, cells); if (r > 0) { cash[role] -= r; cash[peer] += r; log.push({ who: role, text: '付过路费 ' + r }); this.showFx('bad', '过路费 ' + r); } }
    }
    if (cash[role] < 0) { const bankrupt = this._coverShortfallPure(role, cells, cash, savings, log); if (bankrupt) winner = role === 'boy' ? rt.BLUE : rt.RED; }
    if (toIdx !== idx) pos = Object.assign({}, pos, { [role]: toIdx });
    return { cells: cells.map(c => Object.assign({}, c)), pos, cash, savings, skip: { boy: Math.max(0, skip.boy||0), girl: Math.max(0, skip.girl||0) }, turn: winner ? turn : rt.seatOf(peer), dice: this.data.dice, log: log.slice(-20000), winner, req: null, sellReq: null };
  },

  // 破产救助纯计算版(不 commit/syncLog,就地修改)
  _coverShortfallPure(role, cells, cash, savings, log) {
    while (cash[role] < 0 && (savings[role] || 0) > 0) { const need = Math.min(-cash[role], savings[role]); savings[role] -= need; cash[role] += need; log.push({ who: role, text: '取出存款 ' + need }); }
    while (cash[role] < 0) {
      const cand = []; cells.forEach((c, i) => { if (c && c.type === 'property' && c.owner === role && !c.mortgaged) cand.push(i); });
      if (!cand.length) break;
      cand.sort((a, b) => mortgageValueOf(cells[b]) - mortgageValueOf(cells[a]));
      const i = cand[0], c = cells[i], get = mortgageValueOf(c);
      cells[i] = Object.assign({}, c, { mortgaged: true });
      cash[role] += get; log.push({ who: role, text: '自动抵押「' + c.name + '」+' + get });
    }
    while (cash[role] < 0) {
      const cand = []; cells.forEach((c, i) => { if (c && c.type === 'property' && c.owner === role) cand.push(i); });
      if (!cand.length) break;
      cand.sort((a, b) => bankRecover(cells[b]) - bankRecover(cells[a]));
      const i = cand[0], c = cells[i], get = bankRecover(c);
      cells[i] = Object.assign({}, c, { owner: null, level: 0, mortgaged: false });
      cash[role] += get; log.push({ who: role, text: '变卖「' + c.name + '」+' + get });
    }
    if (cash[role] < 0) { this.showFx('bad', '资产耗尽，破产！'); return true; }
    return false;
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
    this.mtxn( s => {
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
      return Object.assign({}, s, { cash, savings, log: lg.slice(-20000) });
    });
  },
  sellToBank(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10), role = room.getRole();
    const cell = (this._state && this._state.cells[idx]) || {};
    const get = Math.round((cell.price + (cell.level || 0) * upgradeCost(cell)) * 0.6);
    wx.showModal({ title: '卖给银行', content: '确定把「' + cell.name + '」卖给银行，获得 ' + get + '？', confirmText: '卖出', cancelText: '取消',
      success: r => {
        if (!r.confirm) return;
        this.mtxn( s => {
          if (!s || !s.cells) return s;
          const c = s.cells[idx];
          if (!c || c.owner !== role) { toast('地块已变化'); return s; }   // 防御：非己地不卖
          const cs = s.cells.map(x => Object.assign({}, x));
          cs[idx] = Object.assign({}, c, { owner: null, level: 0, mortgaged: false });
          const cash = Object.assign({}, s.cash); cash[role] = (cash[role] || 0) + get;
          const lg = (s.log || []).slice(); lg.push({ who: role, text: '把「' + c.name + '」卖给银行 +' + get });
          return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-20000) });
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
        this.mtxn( s => Object.assign({}, s, { sellReq: { by: role, idx, price } }));
        this.setData({ bankOpen: false });
        toast('已发起卖地请求(价 ' + price + ')，等对方');
      }
    });
  },
  cancelSell() { this.mtxn( s => Object.assign({}, s, { sellReq: null })); toast('已取消卖地'); },
  // 经典抵押：把自有地抵押给银行换半价现金，抵押中的地不收过路费。走 transactionState 现读现写 + 防御。
  mortgageProp(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10), role = room.getRole();
    const cell = (this._state && this._state.cells[idx]) || {};
    const get = mortgageValueOf(cell);
    wx.showModal({ title: '抵押', content: '把「' + cell.name + '」抵押给银行 +' + get + '？(抵押中不收过路费)', confirmText: '抵押', cancelText: '取消',
      success: r => {
        if (!r.confirm) return;
        this.mtxn( s => {
          if (!s || !s.cells) return s;
          const c = s.cells[idx];
          if (!c || c.owner !== role) { toast('地块已变化'); return s; }
          if (c.mortgaged) { toast('已抵押'); return s; }
          const g = mortgageValueOf(c);
          const cs = s.cells.map(x => Object.assign({}, x));
          cs[idx] = Object.assign({}, c, { mortgaged: true });
          const cash = Object.assign({}, s.cash); cash[role] = (cash[role] || 0) + g;
          const lg = (s.log || []).slice(); lg.push({ who: role, text: '抵押「' + c.name + '」+' + g + '(抵押中不收租)' });
          return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-20000) });
        });
        toast('已抵押,抵押中不收过路费');
      }
    });
  },
  // 赎回：付抵押值+10% 解除抵押，恢复收租。
  redeemProp(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10), role = room.getRole();
    this.mtxn( s => {
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
      return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-20000) });
    });
  },
  // 同色组成套升级：整组每块 level+1，休闲模式打 9 折；走 transaction 现读现写
  upgradeGroup(e) {
    const g = parseInt(e.currentTarget.dataset.group, 10), role = room.getRole();
    this.mtxn( s => {
      if (!s || !s.cells) return s;
      const gs = s.cells.filter(c => c && c.type === 'property' && c.group === g);
      if (s.turn !== rt.seatOf(role)) { toast('等你的回合才能升级'); return s; }
      if (!gs.length || !gs.every(c => c.owner === role) || !gs.every(c => (c.level || 0) < 3)) { toast('整组不可升级'); return s; }
      const cost = Math.round(gs.reduce((sum, c) => sum + upgradeCost(c), 0) * (s.mode === 'classic' ? 1 : 0.9));
      const cash = Object.assign({}, s.cash);
      if ((cash[role] || 0) < cost) { toast('现金不足，无法整组升级'); return s; }
      cash[role] -= cost;
      const cs = s.cells.map(c => (c && c.type === 'property' && c.group === g) ? Object.assign({}, c, { level: (c.level || 0) + 1 }) : c);
      const lg = (s.log || []).slice(); lg.push({ who: role, text: '整组升级[' + gs.map(c => c.name).join('/') + '] -' + cost + '（过路费翻倍）' });
      this.showFx('good', '整组升级！过路费大涨');
      return Object.assign({}, s, { cells: cs, cash, log: lg.slice(-20000) });
    });
  },
  openRules() { this.setData({ rulesOpen: true }); },
  closeRules() { this.setData({ rulesOpen: false }); },
  switchIconTheme() {
    wx.showActionSheet({
      alertText: '图标主题',
      itemList: ['TDesign 图标', 'Emoji 表情', '图片图标'],
      success: r => {
        const t = ['tdesign', 'emoji', 'image'][r.tapIndex];
        this.setData({ iconTheme: t });
        wx.setStorageSync('mono_iconTheme', t);
      }
    });
  },

  // 棋子坐标：按连续位置 f(可小数) 在 8×8 外圈插值算格子中心，返回百分比(0-100)。不依赖 DOM 测量，规避 cellW 时机问题。
  tokenXY(f) {
    const i0 = ((Math.floor(f) % BOARD) + BOARD) % BOARD, i1 = (i0 + 1) % BOARD, fr = f - Math.floor(f);   // 负数取模修正(backward 中间帧不越界/不错位)
    const [c0, r0] = cellCR(i0), [c1, r1] = cellCR(i1);
    const c = c0 + (c1 - c0) * fr, r = r0 + (r1 - r0) * fr;
    return [(c + 0.5) / 8 * 100, (r + 0.5) / 10 * 100];   // 8×10：宽8列 / 高10行
  }
});
