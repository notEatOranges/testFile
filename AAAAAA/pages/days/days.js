// days —— 在一起天数 + 纪念日倒数
// 数据：anniversary={startDate}；anniversary/events={id:{title,date,ts}}
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const { Store } = require('../../utils/store.js');
const { daysBetween, daysUntil, toast } = require('../../utils/util.js');

Page({
  data: {
    theme: 'sakura',
    days: '?', sinceText: '先设置「在一起的日子」吧',
    events: [],
    evTitle: '', evDate: '', startDate: '',
    adding: false, savingStart: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/index/index' });
    user.applyToRoom();
    room.join();
  },

  onShow() {
    if (this._u1) return;
    this._u1 = Store.onValue('anniversary', data => {
      const sd = data && data.startDate;
      this.setData({
        startDate: sd || '',
        days: sd ? daysBetween(sd) : '?',
        sinceText: sd ? '从 ' + sd + ' 起的每一天' : '先设置「在一起的日子」吧'
      });
    });
    this._u2 = Store.onList('anniversary/events', items => {
      this.setData({
        events: items.map(it => {
          const n = daysUntil(it.date);
          return { id: it.id, title: it.title, date: it.date, n: Math.abs(n), past: n < 0 };
        })
      });
    });
  },

  onUnload() {
    if (this._u1) this._u1();
    if (this._u2) this._u2();
    this._u1 = this._u2 = null;
  },

  onEvTitle(e) { this.setData({ evTitle: e.detail.value }); },
  onEvDate(e) { this.setData({ evDate: e.detail.value }); },
  async addEvent() {
    const t = (this.data.evTitle || '').trim();
    if (!t || !this.data.evDate) return toast('填完整～');
    this.setData({ adding: true });
    await Store.push('anniversary/events', { title: t, date: this.data.evDate, ts: Store.now() });
    this.setData({ adding: false, evTitle: '', evDate: '' });
    toast('已添加');
  },
  onStart(e) { this.setData({ startDate: e.detail.value }); },
  async saveStart() {
    if (!this.data.startDate) return toast('选个日期～');
    this.setData({ savingStart: true });
    await Store.update('anniversary', { startDate: this.data.startDate });
    this.setData({ savingStart: false });
    toast('已设置');
  },
  delEvent(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除纪念日', content: '确定删除这个纪念日吗？', confirmText: '删除', confirmColor: '#e85a86',
      success: async r => {
        if (!r.confirm) return;
        await Store.transaction('anniversary/events', cur => { if (cur && cur[id]) delete cur[id]; return cur; });
        toast('已删除');
      }
    });
  }
});
