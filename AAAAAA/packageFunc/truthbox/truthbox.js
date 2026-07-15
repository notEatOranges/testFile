// truthbox —— 真心话（功能4 重构）：堆叠卡组 + 多题并存 + 答前可改/对方答后锁定 + 互看答案 + 分类题库
// 数据：truthbox/questions={id:{text,category,createdBy,createdTs,answers:{boy:{text,ts},girl:{text,ts}}}}
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const ident = require('@utils/ident.js');
const { TRUTH_CATS, TRUTH_BANK, toast } = require('@utils/util.js');

const CAT_KEYS = Object.keys(TRUTH_CATS);

Page({
  data: {
    theme: 'sakura',
    role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    questions: [],        // 全部题目（enriched，最新在前）
    deck: [],             // 等我回答的题（堆叠卡组，最多 3 张可视）
    catList: CAT_KEYS.map(k => ({ key: k, name: TRUTH_CATS[k].name, icon: TRUTH_CATS[k].icon })),
    // 回答弹层
    ansOpen: false, ansQ: null, ansText: '', ansLocked: false, ansShowPeer: false, ansPeerText: '', saving: false,
    // 出题弹层
    addOpen: false, addText: '', addCat: 'sweet',
    drawing: false,
    // 堆叠滑动 & 全部题目弹层
    deckTop: null, deckRest: [], topDx: 0, allOpen: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom();
    room.join();
    ident.bind(this, { onChange: () => this.recompute() });
  },

  onShow() {
    if (this._unsub) return;
    this._unsub = Store.onList('truthbox/questions', list => { this._raw = list || []; this.recompute(); });
  },
  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    ident.teardown(this);
  },

  recompute() {
    const raw = this._raw || [];
    const role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    const enriched = raw.map(q => {
      const ans = q.answers || {};
      const my = ans[role], pe = ans[peer];
      const hasMy = !!(my && my.text), hasPeer = !!(pe && pe.text);
      const cat = TRUTH_CATS[q.category] || TRUTH_CATS.sweet;
      return {
        id: q.id, text: q.text || '', ts: q.ts || q.createdTs || 0,
        category: q.category || 'sweet', catName: cat.name, catIcon: cat.icon,
        creatorName: names[q.createdBy] || '', byMe: q.createdBy === role,
        hasMy, hasPeer, myText: my ? my.text : '', peerText: pe ? pe.text : '',
        both: hasMy && hasPeer,
        statusText: hasMy && hasPeer ? '你们都回答了' : (hasMy ? '等 ta 回答' : (hasPeer ? '等你回答' : '都还没回答'))
      };
    }).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const deck = enriched.filter(q => !q.hasMy).slice(0, 3);
    this.setData({ questions: enriched, deck, deckTop: deck[0] || null, deckRest: deck.slice(1), topDx: 0 });
  },

  // —— 回答 / 修改 ——
  openAns(e) {
    if (this._swiped) { this._swiped = false; return; }   // 滑动切换不触发作答
    const id = e.currentTarget.dataset.id;
    const q = this.data.questions.find(x => x.id === id);
    if (!q) return;
    this.setData({
      ansOpen: true, allOpen: false, ansQ: q, ansId: id,
      ansText: q.myText || '',
      ansLocked: q.hasMy && q.hasPeer,
      ansShowPeer: q.hasMy, ansPeerText: q.peerText || ''
    });
  },
  closeAns() { this.setData({ ansOpen: false }); },
  noop() {},
  onAnsInput(e) { this.setData({ ansText: e.detail.value }); },
  async submitAns() {
    const text = (this.data.ansText || '').trim();
    if (!text) return toast('写点什么～');
    const id = this.data.ansId;
    const q = (this._raw || []).find(x => x.id === id);
    if (!q) return;
    this.setData({ saving: true });
    const role = this.data.role;
    const answers = Object.assign({}, q.answers || {});
    answers[role] = { text, ts: Store.now() };
    await Store.update('truthbox/questions', { [id]: { text: q.text, category: q.category, createdBy: q.createdBy, createdTs: q.createdTs, answers } });
    this.setData({ saving: false, ansOpen: false });
    toast(this.data.ansLocked ? '已更新' : '已提交');
  },

  // —— 抽题（联网找题，云函数优先，本地兜底）——
  async draw(e) {
    const cat = e.currentTarget.dataset.k;
    this.setData({ drawing: true });
    let q = '';
    try {
      const res = await wx.cloud.callFunction({ name: 'truthQuestions', data: { category: cat, count: 1 } });
      if (res.result && res.result.questions && res.result.questions.length) q = res.result.questions[0];
    } catch (e) {}
    if (!q) {
      const arr = TRUTH_BANK[cat] || [];
      if (arr.length) q = arr[Math.floor(Math.random() * arr.length)];
    }
    this.setData({ drawing: false });
    if (!q) return toast('暂时没抽到题，稍后再试');
    await Store.push('truthbox/questions', { text: q, category: cat, createdBy: room.getRole(), createdTs: Store.now(), answers: {} });
    toast('抽到一题，去回答');
  },

  // —— 出题 ——
  openAdd() { this.setData({ addOpen: true, addText: '', addCat: 'sweet' }); },
  closeAdd() { this.setData({ addOpen: false }); },
  onAddInput(e) { this.setData({ addText: e.detail.value }); },
  pickAddCat(e) { this.setData({ addCat: e.currentTarget.dataset.k }); },
  async addCustom() {
    const t = (this.data.addText || '').trim();
    if (!t) return toast('写个问题～');
    await Store.push('truthbox/questions', { text: t, category: this.data.addCat, createdBy: room.getRole(), createdTs: Store.now(), answers: {} });
    this.setData({ addOpen: false });
    toast('已添加');
  },

  // —— 堆叠卡片：左右滑动切换 ——
  onDeckTouchStart(e) { this._deckSX = e.touches[0].clientX; this._swiped = false; },
  onDeckTouchMove(e) {
    const dx = e.touches[0].clientX - this._deckSX;
    if (Math.abs(dx) > 12) this._swiped = true;
    this.setData({ topDx: dx });
  },
  onDeckTouchEnd() {
    const dx = this.data.topDx;
    if (Math.abs(dx) > 80 && this.data.deck.length > 1) {
      this.setData({ topDx: dx > 0 ? 1000 : -1000 });     // 顶卡飞出屏幕
      setTimeout(() => { this.switchDeck(); this.setData({ topDx: 0 }); }, 240);
    } else {
      this.setData({ topDx: 0 });                          // 未达阈值，回弹
    }
  },
  switchDeck() {
    const d = this.data.deck;
    if (d.length < 2) return;
    const nd = [...d.slice(1), d[0]];
    this.setData({ deck: nd, deckTop: nd[0], deckRest: nd.slice(1) });
  },

  // —— 全部题目弹层 ——
  openAll() { this.setData({ allOpen: true }); },
  closeAll() { this.setData({ allOpen: false }); },

  delQuestion(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除', content: '删除这道题？', confirmText: '删除', confirmColor: '#e85a86',
      success: async r => {
        if (!r.confirm) return;
        await Store.transaction('truthbox/questions', cur => { if (cur && cur[id]) delete cur[id]; return cur; });
        toast('已删除');
      }
    });
  }
});
