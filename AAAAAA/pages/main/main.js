// main —— 首页（pages[0]，真正的启动页）：login 分发 + 欢迎栏 + 对方在线 + 导航 + 主题/退出
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const { roleFull, toast } = require('../../utils/util.js');
const { THEME_LIST, THEMES } = require('../../utils/themes.js');
const notify = require('../../utils/notify.js');

const CARDS = [
  { page: 'chat',     icon: 'chat',      nt: '悄悄对话', nd: '只属于你俩',  ready: true },
  { page: 'mood',     icon: 'heart',     nt: '今日心情', nd: '心情+悄悄话', ready: true },
  { page: 'days',     icon: 'calendar',  nt: '在一起',   nd: '天数·纪念日', ready: true },
  { page: 'wishlist', icon: 'check',     nt: '心愿清单', nd: '一起打卡',    ready: true },
  { page: 'truthbox', icon: 'edit-1',    nt: '真心话',   nd: '默契问答',    ready: true },
  { page: 'lobby',    icon: 'app',       nt: '游戏大厅', nd: '敬请期待',    ready: false }
];

Page({
  data: {
    theme: 'sakura', cards: CARDS, booting: true,
    role: 'boy', peer: 'girl', roleFull: '男生', peerFull: '女生',
    nick: '', myAvatar: '', peerAvatar: '',
    roomCode: '', peerOnline: false, inviteCode: '',
    themeSheet: false,
    themeList: Object.keys(THEMES).map(k => ({ key: k, name: THEMES[k].name, primary: THEMES[k].primary, primaryDeep: THEMES[k].primaryDeep }))
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    this.boot();
  },

  async boot() {
    try {
      await user.login();
    } catch (e) {
      this.setData({ booting: false });
      toast('登录失败，检查云环境');
      return;
    }
    if (!user.isPaired()) {
      wx.redirectTo({ url: '/pages/setup/setup' });
      return;
    }
    user.applyToRoom();
    room.join();
    this.applyUser();
    this.setData({ booting: false });
    if (!this._unsub) {
      this._unsub = room.onPeerPresence(p => this.setData({ peerOnline: room.isOnline(p) }));
    }
  },

  onUnload() { if (this._unsub) { this._unsub(); this._unsub = null; } },

  applyUser() {
    const role = room.getRole() || 'boy';
    const peer = room.getPeer() || 'girl';
    const u = user.getUser() || {};
    this.setData({
      role, peer,
      roleFull: roleFull(role), peerFull: roleFull(peer),
      nick: u.nick || '', myAvatar: u.avatar || '',
      roomCode: room.getRoom() || '',
      inviteCode: wx.getStorageSync('lh5_invite') || ''
    });
  },

  goCard(e) {
    const c = CARDS[e.currentTarget.dataset.idx];
    if (!c.ready) return toast(c.nt + ' 敬请期待');
    wx.navigateTo({ url: '/pages/' + c.page + '/' + c.page });
  },

  copyInvite() {
    const c = this.data.inviteCode;
    if (!c) return;
    wx.setClipboardData({ data: c, success: () => toast('邀请码已复制，发给 ta 吧') });
  },

  pickTheme() { this.setData({ themeSheet: true }); },
  selectTheme(e) {
    const key = e.currentTarget.dataset.key;
    getApp().setTheme(key);
    this.setData({ themeSheet: false });
    const t = THEMES[key];
    if (t) toast('已切换 ' + t.name);
  },
  closeTheme() { this.setData({ themeSheet: false }); },

  onNotifyTap() {
    notify.requestSubscribeMessage().then(res => {
      const ok = Object.keys(res).some(k => res[k] === 'accept');
      toast(ok ? '已开启，ta 回复时提醒你' : '可稍后再开启');
    });
  },

  logout() {
    wx.showModal({
      title: '退出空间', content: '退出后将解除与这个情侣空间的绑定，下次需要重新配对。确定吗？',
      confirmText: '退出', confirmColor: '#e85a86',
      success: async r => {
        if (!r.confirm) return;
        wx.showLoading({ title: '退出中', mask: true });
        room.leave();
        await user.leaveCouple();
        if (this._unsub) { this._unsub(); this._unsub = null; }
        wx.hideLoading();
        wx.reLaunch({ url: '/pages/setup/setup' });
      }
    });
  }
});
