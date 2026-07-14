// history —— 历史心情（功能1）：按日期倒序列出过往每天的我+ta心情
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const ident = require('@utils/ident.js');

Page({
  data: { theme: 'sakura', days: [], loading: true, role: 'boy', peer: 'girl', myName: '我', peerName: 'ta', myAvatar: '', peerAvatar: '' },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom();
    room.join();
    ident.bind(this);
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    try {
      const map = await Store.getPrefix('mood/');
      const role = room.getRole(), peer = room.getPeer();
      const days = Object.keys(map).sort((a, b) => (a < b ? 1 : -1)).map(date => {
        const v = map[date] || {};
        const me = v[role] || {}, ta = v[peer] || {};
        return {
          date,
          myEmoji: me.emoji || '', myWhisper: me.whisper || '', myBg: me.bg || '', myTextColor: me.textColor || '', myScrim: me.scrim || '',
          peerEmoji: ta.emoji || '', peerWhisper: ta.whisper || '', peerBg: ta.bg || '', peerTextColor: ta.textColor || '', peerScrim: ta.scrim || ''
        };
      });
      this.setData({ days, loading: false });
    } catch (e) {
      console.warn('[mood/history] load fail', e);
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() { this.load().then(() => wx.stopPullDownRefresh()); }
});
