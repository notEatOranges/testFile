// me —— 「我的」tab：资料 + 邀请码 + 主题 + 通知 + 戳一戳后缀 + 退出
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const notify = require('../../utils/notify.js');
const { Store } = require('../../utils/store.js');
const { toast } = require('../../utils/util.js');
const { THEMES } = require('../../utils/themes.js');

Page({
  data: {
    theme: 'sakura',
    role: 'boy',
    nick: '', avatar: '', roomCode: '', inviteCode: '',
    themeSheet: false,
    themeList: Object.keys(THEMES).map(k => ({ key: k, name: THEMES[k].name, primary: THEMES[k].primary, primaryDeep: THEMES[k].primaryDeep })),
    pokeSuffix: '', suffixOpen: false, suffixInput: '',
    // 编辑资料（网名 + 头像）
    editOpen: false, editNick: '', editAvatar: '', savingProfile: false
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1, hidden: false });   // 回到本页确保 tabBar 可见（防换肤弹层打开时切走导致永久隐藏）
    }
    if (!user.isPaired()) { wx.reLaunch({ url: '/pages/setup/setup' }); return; }
    this.applyUser();
    // 读我预设的戳一戳后缀
    if (!this._sfSub) {
      this._sfSub = Store.onValue('pokeSuffix/' + (room.getRole() || 'boy'), v => {
        this.setData({ pokeSuffix: (v && v.suffix) || '' });
      });
    }
  },
  onUnload() { if (this._sfSub) { this._sfSub(); this._sfSub = null; } },

  applyUser() {
    const role = room.getRole() || 'boy';
    const u = user.getUser() || {};
    this.setData({
      role,
      nick: u.nick || '', avatar: u.avatar || '',
      roomCode: room.getRoom() || '',
      inviteCode: wx.getStorageSync('lh5_invite') || ''
    });
  },

  // —— 编辑资料：网名 + 头像 ——
  openEdit() {
    this._avatarTemp = null;
    this.setData({ editOpen: true, editNick: this.data.nick || '', editAvatar: this.data.avatar || '' });
  },
  closeEdit() { this.setData({ editOpen: false }); },
  onEditNick(e) { this.setData({ editNick: e.detail.value }); },
  pickAvatar() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: res => {
        const tempPath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!tempPath) return;
        this._avatarTemp = tempPath;
        this.setData({ editAvatar: tempPath });
      }
    });
  },
  async saveProfile() {
    const nick = (this.data.editNick || '').trim();
    const avatar = this.data.editAvatar;
    if (!nick && !avatar) return toast('填个网名或选个头像吧');
    this.setData({ savingProfile: true });
    let finalAvatar = avatar;
    // 新选的临时图 → 上传云存储拿 fileID（持久化，对方也能加载）
    if (this._avatarTemp && this._avatarTemp !== this.data.avatar) {
      try {
        const role = room.getRole() || 'boy';
        const cloudPath = `avatar/${room.getRoom() || 'free'}/${role}_${Date.now()}.jpg`;
        const up = await wx.cloud.uploadFile({ cloudPath, filePath: this._avatarTemp });
        finalAvatar = up.fileID;
      } catch (e) {
        console.warn('[me] 头像上传失败，回退临时路径', e);
      }
      this._avatarTemp = null;
    }
    const finalNick = nick || this.data.nick || '我';
    try {
      await user.saveProfile({ nick: finalNick, avatar: finalAvatar });
      // 同步写 profile/{role}，对方主页/各页经订阅实时刷新
      Store.update('profile/' + (room.getRole() || 'boy'), { nick: finalNick, avatar: finalAvatar });
      this.setData({ savingProfile: false, editOpen: false, nick: finalNick, avatar: finalAvatar });
      toast('已保存，ta 马上能看到');
    } catch (e) {
      this.setData({ savingProfile: false });
      toast('保存失败，稍后再试');
    }
  },

  copyInvite() {
    const c = this.data.inviteCode; if (!c) return;
    wx.setClipboardData({ data: c, success: () => toast('邀请码已复制，发给 ta 吧') });
  },

  pickTheme() { this.setData({ themeSheet: true }); this._hideTabBar(true); },
  selectTheme(e) {
    const key = e.currentTarget.dataset.key;
    getApp().setTheme(key);
    this.setData({ themeSheet: false });
    this._hideTabBar(false);
    const t = THEMES[key];
    if (t) toast('已切换 ' + t.name);
  },
  closeTheme() { this.setData({ themeSheet: false }); this._hideTabBar(false); },
  // Skyline 下自定义 tabBar 独立成层，底部弹层的 z-index 盖不住它 → 打开换肤弹层时把 tabBar 滑出屏幕
  _hideTabBar(hidden) {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden });
    }
  },

  onNotifyTap() {
    notify.requestSubscribeMessage().then(res => {
      const ok = Object.keys(res).some(k => res[k] === 'accept');
      toast(ok ? '已开启，ta 回复时提醒你' : '可稍后再开启');
    });
  },

  // —— 戳一戳后缀设置 ——
  openPokeSuffix() { this.setData({ suffixOpen: true, suffixInput: this.data.pokeSuffix || '' }); },
  closeSuffix() { this.setData({ suffixOpen: false }); },
  noop() {},
  onSuffixInput(e) { this.setData({ suffixInput: e.detail.value }); },
  confirmSuffix() {
    const v = (this.data.suffixInput || '').trim();
    Store.update('pokeSuffix/' + (room.getRole() || 'boy'), { suffix: v });
    this.setData({ suffixOpen: false, pokeSuffix: v });
    toast(v ? '已设置' : '已清空后缀');
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
