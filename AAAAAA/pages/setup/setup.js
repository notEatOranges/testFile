// setup —— 资料 + 配对（创建/加入情侣空间）
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const { Store } = require('../../utils/store.js');
const { toast } = require('../../utils/util.js');

Page({
  data: {
    theme: 'sakura',
    step: 'profile',          // 'profile'（填资料） | 'pair'（配对）
    nick: '', avatar: '',
    tab: 'create',            // 'create' | 'join'
    role: 'boy',
    creating: false, joining: false,
    inviteCode: '',
    inputCode: ''
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (user.isPaired()) return this.goMood();
    const u = user.getUser();
    if (u && u.nick) this.setData({ step: 'pair', nick: u.nick, avatar: u.avatar });
  },
  onUnload() { if (this._unsub) this._unsub(); },

  /* —— 阶段 1：资料 —— */
  onChooseAvatar(e) { this.setData({ avatar: e.detail.avatarUrl }); },
  onNickInput(e) { this.setData({ nick: e.detail.value }); },
  async saveProfile() {
    const nick = (this.data.nick || '').trim();
    if (!nick) return toast('先起个昵称呀～');
    wx.showLoading({ title: '保存中', mask: true });
    let avatar = this.data.avatar;
    // chooseAvatar 返回临时路径，需上传云存储换 fileID 才能持久
    if (avatar && /^(wxfile|http:\/\/tmp|https:\/\/tmp|http:\/\/127)/.test(avatar)) {
      try {
        const up = await wx.cloud.uploadFile({ cloudPath: 'avatar/' + Date.now() + '.jpg', filePath: avatar });
        avatar = up.fileID;
      } catch (e) { avatar = ''; }
    }
    await user.saveProfile({ nick, avatar });
    wx.hideLoading();
    this.setData({ step: 'pair' });
  },

  /* —— 阶段 2：配对 —— */
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.t }); },
  pickRole(e) { this.setData({ role: e.currentTarget.dataset.r }); },
  async doCreate() {
    this.setData({ creating: true });
    const r = await user.createCouple(this.data.role);
    this.setData({ creating: false });
    if (!r.ok) {
      if (r.reason === 'already_in_couple') return this.goMood();
      return toast('创建失败：' + r.reason);
    }
    this.setData({ inviteCode: r.inviteCode });
    user.applyToRoom();        // coupleId 写入 room 上下文
    room.join();               // 写自己 presence + 心跳
    // 等对方加入：订阅对端 presence（joinCouple 云函数会写 members/{peer}）
    const peer = room.getPeer();
    this._unsub = Store.onValue('members/' + peer, p => {
      if (p && p.openid && !this._gone) {
        this._gone = true;
        toast('ta 来啦');
        setTimeout(() => this.goMood(), 700);
      }
    });
  },
  copyCode() {
    wx.setClipboardData({ data: this.data.inviteCode, success: () => toast('邀请码已复制') });
  },
  onCodeInput(e) { this.setData({ inputCode: (e.detail.value || '').toUpperCase() }); },
  async doJoin() {
    const code = (this.data.inputCode || '').trim();
    if (code.length < 4) return toast('请输入邀请码');
    this.setData({ joining: true });
    const r = await user.joinCouple(code);
    this.setData({ joining: false });
    if (!r.ok) {
      const msg = ({ invalid_code: '邀请码无效', full: '空间已满', already_in_couple: '你已在空间里', self: '不能加入自己的空间' })[r.reason] || '加入失败';
      return toast(msg);
    }
    user.applyToRoom();
    room.join();
    this.goMood();
  },
  goMood() { wx.reLaunch({ url: '/pages/main/main' }); }
});
