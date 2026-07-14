// truthbox —— 真心话盲盒（异步默契问答）
// 数据：truthbox/q={question,pickedBy,pickedTs}；truthbox/answer/{role}={text,ts}
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const { Store } = require('../../utils/store.js');
const { TRUTH_QUESTIONS, roleFull, fmtDateTime, toast } = require('../../utils/util.js');

function pickQ() { return TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)]; }

Page({
  data: {
    theme: 'sakura',
    q: null, pickedByFull: '',
    myAns: '', peerAns: null, peerAnsTime: '',
    peer: 'girl', peerFull: '女生', role: 'boy',
    picking: false, saving: false
  },

  onLoad() {
    const role = room.getRole() || 'boy';
    const peer = room.getPeer() || 'girl';
    this.setData({
      theme: getApp().globalData.theme || 'sakura',
      role, peer, peerFull: roleFull(peer)
    });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/index/index' });
    user.applyToRoom();
    room.join();
  },

  onShow() {
    if (this._uq) return;
    this._uq = Store.onValue('truthbox/q', q => {
      this.setData({ q: q || null, pickedByFull: q ? roleFull(q.pickedBy) : '' });
    });
    this._ua = Store.onValue('truthbox/answer/' + this.data.role, a => {
      this.setData({ myAns: (a && a.text) || '' });
    });
    this._ub = Store.onValue('truthbox/answer/' + this.data.peer, a => {
      this.setData({
        peerAns: a && a.text ? a : null,
        peerAnsTime: a && a.ts ? fmtDateTime(a.ts) : ''
      });
    });
  },
  onUnload() {
    ['_uq', '_ua', '_ub'].forEach(k => { if (this[k]) { this[k](); this[k] = null; } });
  },

  onMyAns(e) { this.setData({ myAns: e.detail.value }); },

  async newQ() {
    this.setData({ picking: true });
    const q = pickQ();
    await Store.set('truthbox/q', { question: q, pickedBy: this.data.role, pickedTs: Store.now() });
    await Store.set('truthbox/answer/boy', null);
    await Store.set('truthbox/answer/girl', null);
    this.setData({ picking: false, myAns: '' });
    toast('新题已抽');
  },

  async saveAns() {
    const t = (this.data.myAns || '').trim();
    if (!t) return toast('写点什么～');
    this.setData({ saving: true });
    await Store.update('truthbox/answer/' + this.data.role, { text: t, ts: Store.now() });
    this.setData({ saving: false });
    toast('已提交');
  }
});
