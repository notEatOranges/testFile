// mood —— 每日心情 + 悄悄话（验证两手机实时同步的最小切片）
// 数据：mood/{YYYY-MM-DD} = { boy:{emoji,whisper,ts}, girl:{...} }
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const { Store } = require('../../utils/store.js');
const { todayStr, MOODS, toast } = require('../../utils/util.js');

Page({
  data: {
    theme: 'sakura',
    moods: MOODS,
    myEmoji: '🙂', myLabel: '点下面的表情选今日心情',
    picked: '', whisper: '',
    peerHas: false, peerEmoji: '', peerWhisper: '',
    peerRole: 'girl', saving: false
  },

  onLoad() {
    this.setData({
      theme: getApp().globalData.theme || 'sakura',
      peerRole: room.getPeer() || 'girl'
    });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/index/index' });
    user.applyToRoom();
    room.join();
  },

  onShow() {
    if (this._unsub) return;
    // 订阅今日心情：自己/对方任一方更新都实时回调
    this._unsub = Store.onValue('mood/' + todayStr(), data => {
      const role = room.getRole(), peer = room.getPeer();
      if (data && data[role]) {
        const m = data[role];
        this.setData({
          myEmoji: m.emoji || '🙂',
          picked: m.emoji || '',
          whisper: m.whisper || '',
          myLabel: (MOODS.find(x => x.emoji === m.emoji) || {}).label || '今日心情'
        });
      }
      const p = data && data[peer];
      this.setData({
        peerHas: !!(p && p.emoji),
        peerEmoji: (p && p.emoji) || '',
        peerWhisper: (p && p.whisper) || ''
      });
    });
  },

  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
  },

  pickEmoji(e) {
    const emoji = e.currentTarget.dataset.e;
    this.setData({
      picked: emoji,
      myEmoji: emoji,
      myLabel: (MOODS.find(x => x.emoji === emoji) || {}).label || ''
    });
  },
  onWhisperInput(e) { this.setData({ whisper: e.detail.value }); },

  async save() {
    if (!this.data.picked) return toast('先选个心情呀～');
    const role = room.getRole();
    this.setData({ saving: true });
    await Store.update('mood/' + todayStr(), {
      [role]: { emoji: this.data.picked, whisper: (this.data.whisper || '').trim(), ts: Store.now() }
    });
    this.setData({ saving: false });
    toast('已保存 💕 ta 能看到啦');
  }
});
