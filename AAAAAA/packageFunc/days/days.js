// days —— 纪念日（功能2 重构）：在一起天数 + 分类/循环/倒数/照片/备注 + 提醒天数
// 数据：anniversary={startDate}；anniversary/events={id:{title,date,type,recurrence,note,photo,advanceDays,createdBy,ts}}
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const { daysBetween, toast } = require('@utils/util.js');
const anniv = require('@utils/anniv.js');

function buildAdvance(selected) {
  return anniv.ADVANCE_OPTIONS.map(o => ({ d: o.d, label: o.label, sel: !!selected[o.d] }));
}

Page({
  data: {
    theme: 'sakura',
    days: '?', sinceText: '先设置「在一起的日子」吧', startDate: '',
    events: [],
    typeList: anniv.TYPE_KEYS.map(k => ({ key: k, name: anniv.TYPES[k].name, icon: anniv.TYPES[k].icon })),
    recurList: anniv.RECURRENCE_KEYS.map(k => ({ key: k, name: anniv.RECURRENCE[k].name })),
    // 添加表单
    addOpen: false, adding: false,
    fTitle: '', fDate: '', fType: 'anniversary', fRecur: 'yearly', fNote: '', fPhoto: '',
    advanceRender: buildAdvance({ 0: true, 1: true })
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
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
      const list = items.map(it => {
        const n = anniv.daysToNext(it);
        const past = n != null && n < 0 && (it.recurrence || 'once') === 'once';
        return {
          id: it.id, title: it.title || '', date: it.date,
          type: it.type || 'countdown',
          typeName: (anniv.TYPES[it.type] || anniv.TYPES.countdown).name,
          typeIcon: (anniv.TYPES[it.type] || anniv.TYPES.countdown).icon,
          recurrence: it.recurrence || 'once',
          recurName: (anniv.RECURRENCE[it.recurrence] || {}).name || '',
          note: it.note || '', photo: it.photo || '',
          n, text: anniv.countdownText(it), past
        };
      });
      list.sort((a, b) => {
        if (a.past && !b.past) return 1;
        if (!a.past && b.past) return -1;
        return (a.n == null ? 1e9 : a.n) - (b.n == null ? 1e9 : b.n);
      });
      this.setData({ events: list });
    });
  },
  onUnload() {
    if (this._u1) this._u1();
    if (this._u2) this._u2();
    this._u1 = this._u2 = null;
  },

  // 起始日
  onStart(e) { this.setData({ startDate: e.detail.value }); },
  async saveStart() {
    if (!this.data.startDate) return toast('选个日期～');
    await Store.update('anniversary', { startDate: this.data.startDate });
    toast('已设置在一起的日子');
  },

  // 添加表单
  openAdd() {
    this.setData({
      addOpen: true, fTitle: '', fDate: '', fType: 'anniversary', fRecur: 'yearly', fNote: '', fPhoto: '',
      advanceRender: buildAdvance({ 0: true, 1: true })
    });
  },
  closeAdd() { this.setData({ addOpen: false }); },
  noop() {},
  onFTitle(e) { this.setData({ fTitle: e.detail.value }); },
  onFDate(e) { this.setData({ fDate: e.detail.value }); },
  onFNote(e) { this.setData({ fNote: e.detail.value }); },
  pickType(e) { this.setData({ fType: e.currentTarget.dataset.k }); },
  pickRecur(e) { this.setData({ fRecur: e.currentTarget.dataset.k }); },
  toggleAdvance(e) {
    const d = e.currentTarget.dataset.d;
    const arr = this.data.advanceRender.map(o => o.d === d ? { d: o.d, label: o.label, sel: !o.sel } : o);
    this.setData({ advanceRender: arr });
  },
  pickPhoto() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: res => { const tp = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath; if (tp) this.setData({ fPhoto: tp }); }
    });
  },
  clearPhoto() { this.setData({ fPhoto: '' }); },

  async addEvent() {
    const t = (this.data.fTitle || '').trim();
    if (!t) return toast('填个名称～');
    if (!this.data.fDate) return toast('选个日期～');
    this.setData({ adding: true });
    let photo = this.data.fPhoto || '';
    if (photo && photo.indexOf('cloud://') !== 0 && photo.indexOf('http') !== 0) {
      try {
        const cloudPath = `anniv/${room.getRoom() || 'free'}/${Date.now()}.jpg`;
        const up = await wx.cloud.uploadFile({ cloudPath, filePath: photo });
        photo = up.fileID;
      } catch (e) { photo = ''; }
    }
    const advance = this.data.advanceRender.filter(o => o.sel).map(o => o.d);
    await Store.push('anniversary/events', {
      title: t, date: this.data.fDate, type: this.data.fType, recurrence: this.data.fRecur,
      note: (this.data.fNote || '').trim(), photo,
      advanceDays: advance.length ? advance : [0, 1],
      createdBy: room.getRole(), ts: Store.now()
    });
    this.setData({ adding: false, addOpen: false });
    toast('已添加，到日子会提醒你们');
  },

  delEvent(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除', content: '确定删除这个日子吗？', confirmText: '删除', confirmColor: '#e85a86',
      success: async r => {
        if (!r.confirm) return;
        await Store.transaction('anniversary/events', cur => { if (cur && cur[id]) delete cur[id]; return cur; });
        toast('已删除');
      }
    });
  }
});
