// wishlist —— 共同心愿清单
// 数据：wishlist={id:{text,done,createdBy,completedBy,ts,doneTs}}
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const { Store } = require('../../utils/store.js');
const { toast } = require('../../utils/util.js');

Page({
  data: { theme: 'sakura', items: [], input: '' },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/index/index' });
    user.applyToRoom();
    room.join();
  },

  onShow() {
    if (this._unsub) return;
    this._unsub = Store.onList('wishlist', items => this.setData({ items }));
  },
  onUnload() { if (this._unsub) { this._unsub(); this._unsub = null; } },

  onInput(e) { this.setData({ input: e.detail.value }); },
  async addWish() {
    const t = (this.data.input || '').trim();
    if (!t) return;
    this.setData({ input: '' });
    await Store.push('wishlist', {
      text: t, done: false, createdBy: room.getRole(), completedBy: null, ts: Store.now(), doneTs: null
    });
    toast('已添加');
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id;
    const it = this.data.items.find(x => x.id === id);
    if (!it) return;
    if (!it.done) {
      wx.showModal({
        title: '完成心愿', content: '确定完成「' + it.text + '」吗？', confirmText: '完成',
        success: async r => {
          if (!r.confirm) return;
          await Store.update('wishlist', { [id]: { ...it, done: true, completedBy: room.getRole(), doneTs: Store.now() } });
          toast('完成一件啦');
        }
      });
    } else {
      Store.update('wishlist', { [id]: { ...it, done: false, completedBy: null, doneTs: null } });
    }
  },
  delWish(e) {
    const id = e.currentTarget.dataset.id;
    const it = this.data.items.find(x => x.id === id);
    wx.showModal({
      title: '删除心愿', content: '确定删除「' + (it ? it.text : '') + '」吗？', confirmText: '删除', confirmColor: '#e85a86',
      success: async r => {
        if (!r.confirm) return;
        await Store.transaction('wishlist', cur => { if (cur && cur[id]) delete cur[id]; return cur; });
        toast('已删除');
      }
    });
  }
});
