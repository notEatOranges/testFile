// wishlist —— 心愿清单（功能3 重构）：分类 + 打卡(照片/感受) + 进度 + 双人协作
// 数据：wishlist={id:{text,category,done,photo,note,createdBy,completedBy,ts,doneTs}}
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const ident = require('@utils/ident.js');
const { toast } = require('@utils/util.js');

const CATS = {
  go:      { name: '想去',   icon: 'location' },
  do:      { name: '想做',   icon: 'edit' },
  eat:     { name: '想吃',   icon: 'shop' },
  achieve: { name: '想完成', icon: 'trophy' }
};
const CAT_KEYS = Object.keys(CATS);

Page({
  data: {
    theme: 'sakura',
    role: 'boy', peer: 'girl', myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    items: [], totalCount: 0, doneCount: 0,
    catTabs: [{ key: 'all', name: '全部' }].concat(CAT_KEYS.map(k => ({ key: k, name: CATS[k].name }))),
    catChips: CAT_KEYS.map(k => ({ key: k, name: CATS[k].name, icon: CATS[k].icon })),
    filter: 'all', input: '', inputCat: 'do',
    // 完成打卡弹层
    finishOpen: false, finishId: '', finishPhoto: '', finishNote: '', finishing: false
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
    this._unsub = Store.onList('wishlist', list => { this._raw = list || []; this.recompute(); });
  },
  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    ident.teardown(this);
  },

  recompute() {
    const raw = this._raw || [];
    const role = this.data.role, peer = this.data.peer;
    const names = {}; names[role] = this.data.myName; names[peer] = this.data.peerName;
    const enriched = raw.map(it => ({
      id: it.id, text: it.text || '',
      category: it.category || 'do',
      catName: (CATS[it.category] || CATS.do).name,
      catIcon: (CATS[it.category] || CATS.do).icon,
      done: !!it.done,
      photo: it.photo || '', note: it.note || '',
      creatorName: names[it.createdBy] || '',
      completerName: names[it.completedBy] || ''
    }));
    const doneCount = enriched.filter(x => x.done).length;
    const filtered = this.data.filter === 'all' ? enriched : enriched.filter(x => x.category === this.data.filter);
    this.setData({ items: filtered, totalCount: enriched.length, doneCount });
  },

  switchTab(e) { this.setData({ filter: e.currentTarget.dataset.k }); this.recompute(); },
  onInput(e) { this.setData({ input: e.detail.value }); },
  pickInputCat(e) { this.setData({ inputCat: e.currentTarget.dataset.k }); },
  async addWish() {
    const t = (this.data.input || '').trim();
    if (!t) return toast('写个心愿吧～');
    this.setData({ input: '' });
    await Store.push('wishlist', {
      text: t, category: this.data.inputCat, done: false, photo: '', note: '',
      createdBy: room.getRole(), completedBy: null, ts: Store.now(), doneTs: null
    });
    toast('已加入心愿单');
  },

  // 完成 / 重新打开
  openFinish(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ finishOpen: true, finishId: id, finishPhoto: '', finishNote: '' });
  },
  closeFinish() { this.setData({ finishOpen: false }); },
  noop() {},
  onFinishNote(e) { this.setData({ finishNote: e.detail.value }); },
  pickFinishPhoto() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: res => { const tp = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath; if (tp) this.setData({ finishPhoto: tp }); }
    });
  },
  async confirmFinish() {
    const it = (this._raw || []).find(x => x.id === this.data.finishId);
    if (!it) return this.setData({ finishOpen: false });
    this.setData({ finishing: true });
    let photo = this.data.finishPhoto || '';
    if (photo && photo.indexOf('cloud://') !== 0 && photo.indexOf('http') !== 0) {
      try {
        const cloudPath = `wish/${room.getRoom() || 'free'}/${Date.now()}.jpg`;
        const up = await wx.cloud.uploadFile({ cloudPath, filePath: photo });
        photo = up.fileID;
      } catch (e) { photo = ''; }
    }
    await Store.update('wishlist', {
      [this.data.finishId]: { ...it, done: true, photo, note: (this.data.finishNote || '').trim(), completedBy: room.getRole(), doneTs: Store.now() }
    });
    this.setData({ finishing: false, finishOpen: false });
    toast('又完成一件，真棒');
  },
  reopen(e) {
    const id = e.currentTarget.dataset.id;
    const it = (this._raw || []).find(x => x.id === id);
    if (!it) return;
    wx.showModal({
      title: '重新打开', content: '把这个心愿重新放回未完成？', confirmText: '好的',
      success: async r => {
        if (!r.confirm) return;
        await Store.update('wishlist', { [id]: { ...it, done: false, photo: '', note: '', completedBy: null, doneTs: null } });
        toast('已重新打开');
      }
    });
  },
  delWish(e) {
    const id = e.currentTarget.dataset.id;
    const it = (this._raw || []).find(x => x.id === id);
    wx.showModal({
      title: '删除心愿', content: '确定删除「' + (it ? it.text : '') + '」？', confirmText: '删除', confirmColor: '#e85a86',
      success: async r => {
        if (!r.confirm) return;
        await Store.transaction('wishlist', cur => { if (cur && cur[id]) delete cur[id]; return cur; });
        toast('已删除');
      }
    });
  }
});
