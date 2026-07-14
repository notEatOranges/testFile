// me —— 「我的」tab：资料 + 邀请码 + 主题 + 通知 + 退出
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const notify = require('../../utils/notify.js');
const { roleFull, toast } = require('../../utils/util.js');
const { THEMES } = require('../../utils/themes.js');

Page({
  data: {
    theme: 'sakura',
    role: 'boy', roleFull: '男生',
    nick: '', avatar: '', roomCode: '', inviteCode: '',
    themeSheet: false,
    themeList: Object.keys(THEMES).map(k => ({ key: k, name: THEMES[k].name, primary: THEMES[k].primary, primaryDeep: THEMES[k].primaryDeep }))
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    if (!user.isPaired()) { wx.reLaunch({ url: '/pages/setup/setup' }); return; }
    this.applyUser();
  },

  applyUser() {
    const role = room.getRole() || 'boy';
    const u = user.getUser() || {};
    this.setData({
      role, roleFull: roleFull(role),
      nick: u.nick || '', avatar: u.avatar || '',
      roomCode: room.getRoom() || '',
      inviteCode: wx.getStorageSync('lh5_invite') || ''
    });
  },

  copyInvite() {
    const c = this.data.inviteCode; if (!c) return;
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
        wx.hideLoading();
        wx.reLaunch({ url: '/pages/setup/setup' });
      }
    });
  }
});
