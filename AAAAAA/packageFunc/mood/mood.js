// mood —— 今日心情（功能1 重构）：自己+对方双卡片、历史心情、自定义表情、背景图+文字混色
// 数据：mood/{YYYY-MM-DD} = { boy:{emoji,label,whisper,bg,textColor,scrim,ts}, girl:{...} }
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const ident = require('@utils/ident.js');
const { analyzeImage } = require('@utils/colorMix.js');
const { todayStr, MOODS, toast } = require('@utils/util.js');

Page({
  data: {
    theme: 'sakura',
    moods: MOODS,
    role: 'boy', peer: 'girl',
    myName: '我', myAvatar: '', peerName: 'ta', peerAvatar: '',
    // 我的今日
    myEmoji: '🙂', myLabel: '点下面的表情选今日心情', picked: '', whisper: '',
    myBg: '', myTextColor: '', myScrim: '',
    // 对方今日
    peerHas: false, peerEmoji: '', peerLabel: '', peerWhisper: '', peerBg: '', peerTextColor: '', peerScrim: '',
    // 自定义表情弹层
    customOpen: false, customInput: '',
    saving: false
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom();
    room.join();
    ident.bind(this);
  },

  onShow() {
    if (this._unsub) return;
    this._unsub = Store.onValue('mood/' + todayStr(), data => {
      const role = room.getRole(), peer = room.getPeer();
      const m = data && data[role];
      if (m && m.emoji) {
        this.setData({
          myEmoji: m.emoji,
          picked: m.emoji,
          myLabel: m.label || this.labelOf(m.emoji) || '今日心情',
          whisper: m.whisper || '',
          myBg: m.bg || '', myTextColor: m.textColor || '', myScrim: m.scrim || ''
        });
      }
      const p = data && data[peer];
      this.setData({
        peerHas: !!(p && p.emoji),
        peerEmoji: (p && p.emoji) || '',
        peerLabel: (p && p.label) || '',
        peerWhisper: (p && p.whisper) || '',
        peerBg: (p && p.bg) || '', peerTextColor: (p && p.textColor) || '', peerScrim: (p && p.scrim) || ''
      });
    });
  },
  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    ident.teardown(this);
  },

  labelOf(emoji) { const f = MOODS.find(x => x.emoji === emoji); return f ? f.label : ''; },

  pickEmoji(e) {
    const emoji = e.currentTarget.dataset.e;
    this.setData({ picked: emoji, myEmoji: emoji, myLabel: this.labelOf(emoji) || '今日心情' });
  },

  // 自定义表情
  openCustom() { this.setData({ customOpen: true, customInput: '' }); },
  closeCustom() { this.setData({ customOpen: false }); },
  noop() {},
  onCustomInput(e) { this.setData({ customInput: e.detail.value }); },
  confirmCustom() {
    const v = (this.data.customInput || '').trim();
    if (!v) return toast('输个表情或几个字呀');
    this.setData({ picked: v, myEmoji: v, myLabel: '自定义', customOpen: false });
  },

  onWhisperInput(e) { this.setData({ whisper: e.detail.value }); },

  // 背景图：选图 → 采样算文字色 → 暂存临时路径（保存时上传）
  pickBg() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: async res => {
        const tempPath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!tempPath) return;
        const query = wx.createSelectorQuery().in(this);
        query.select('#bgCanvas').fields({ node: true, size: true }).exec(async nodes => {
          const canvas = nodes[0] && nodes[0].node;
          const { textColor, scrim } = await analyzeImage(canvas, tempPath);
          this._bgTemp = tempPath;
          this.setData({ myBg: tempPath, myTextColor: textColor, myScrim: scrim });
        });
      }
    });
  },
  clearBg() {
    this._bgTemp = null;
    this.setData({ myBg: '', myTextColor: '', myScrim: '' });
  },

  async save() {
    if (!this.data.picked) return toast('先选个心情呀～');
    const role = room.getRole();
    this.setData({ saving: true });
    let bg = this.data.myBg || '';
    // 新选的临时图 → 上传云存储拿 fileID（持久化、对方能加载）
    if (this._bgTemp && this._bgTemp === bg) {
      try {
        const cloudPath = `moodbg/${room.getRoom() || 'free'}/${role}_${todayStr()}_${Date.now()}.jpg`;
        const up = await wx.cloud.uploadFile({ cloudPath, filePath: this._bgTemp });
        bg = up.fileID;
      } catch (e) { console.warn('[mood] 背景图上传失败', e); }
      this._bgTemp = null;
    }
    await Store.update('mood/' + todayStr(), {
      [role]: {
        emoji: this.data.picked,
        label: this.data.myLabel === '今日心情' ? '' : this.data.myLabel,
        whisper: (this.data.whisper || '').trim(),
        bg, textColor: this.data.myTextColor, scrim: this.data.myScrim,
        ts: Store.now()
      }
    });
    this.setData({ saving: false, myBg: bg });
    toast('已保存，ta 能看到啦');
  },

  goHistory() { wx.navigateTo({ url: '/packageFunc/mood/history/history' }); }
});
