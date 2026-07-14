// chat —— 微信风格实时聊天（文本 + 图片 + 文件 + 表情包）
// 乐观回显：发送即上屏（loading），sendMsg 成功转 sent，失败转 failed
// 头像聚合：连续同 sender 只首条带头像；气泡带小箭头指向发送者
// 戳一戳：后缀在「我的」页预设（pokeSuffix/{role}）；双击头像/点按钮直接戳；
//         写入 chat 流居中记录；被戳方头像抖动 + 震动
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const { toast, roleFull } = require('@utils/util.js');
const { BUILTIN_STICKERS } = require('@utils/stickers.js');

// 会话内记住的聊天浏览位置（scrollTop, px）。模块级变量：页面销毁不丢，只有冷启动重载模块才清空。
// 借此区分「返回首页再进 → 恢复上次位置」与「杀掉小程序重进 → 回到底部」。
let _savedScrollTop = null;

const EMOJIS = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😋',
  '🤗','🤔','😐','😏','😶','🙄','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛',
  '😜','🤪','😝','🤤','😒','😓','😔','😕','🙃','🫠','😞','😖','😟','😤','😢','😭',
  '😦','😧','😨','😩','🤯','😬','😰','😱','😳','🤩','🥳','🤠','😇','🥺','🤒','🤕',
  '🤧','😷','🥵','🥶','🤴','👸','🤵','👰','💑','💏','👪','🫶','💖','❤️','🧡','💛',
  '💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💘','💝','💌','🔥',
  '✨','🌟','⭐','🌈','☀️','🌙','🍉','🍓','🍒','🍑','🍰','🎂','🍬','🍭','🍫','🍩',
  '🐱','🐶','🐰','🐻','🐼','🐨','👋','👌','✌️','🤞','🙏','💪','👏','👀','🌹','🎁'
];

function isEmojiOnly(t) {
  if (!t || t.length > 6) return false;
  const stripped = t.replace(/[️‍♀♂]/g, '');
  return /^(\p{Extended_Pictographic})+$/u.test(stripped);
}
function fmtShort(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function formatChatTime(ts) {
  const d = new Date(ts), now = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (d.toDateString() === now.toDateString()) return hh + ':' + mm;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return '昨天 ' + hh + ':' + mm;
  if (d.getFullYear() === now.getFullYear()) return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hh + ':' + mm;
  return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hh + ':' + mm;
}
function fmtSize(n) {
  if (!n) return '';
  if (n < 1024) return n + 'B';
  if (n < 1048576) return (n / 1024).toFixed(1) + 'KB';
  return (n / 1048576).toFixed(1) + 'MB';
}

Page({
  data: {
    theme: 'sakura', messages: [], scrollTop: 0, loaded: false,
    input: '', emojiOpen: false, emojis: EMOJIS,
    myRole: 'boy', peer: 'girl', myAvatar: '', peerAvatar: '',
    myNick: '',               // 我的昵称（戳一戳记录显示用）
    mySuffix: '',             // 我预设的戳一戳后缀（pokeSuffix/{myRole}）
    pokeTip: false, pokeText: '',
    pokeShakeTarget: '',      // 当前要抖动的头像 role（被戳方）
    kbHeight: 0,              // 键盘高度（弹起时抬高输入栏，防遮挡）
    inputHeight: 80,          // 输入框高度（rpx）：按行数同步算，不用 auto-height，避免首帧闪烁
    fullInput: false, fullInputText: '',  // 全屏输入
    msgView: false, msgViewText: '',      // 文本消息全屏查看
    // —— 媒体 ——
    plusOpen: false,
    plusItems: [
      { label: '拍照', icon: 'camera' },
      { label: '相册', icon: 'image' },
      { label: '文件', icon: 'file-1' }
    ],
    emojiTab: 0,                                  // 表情面板：0=表情 1=表情包
    builtinStickers: BUILTIN_STICKERS,            // 内置表情（utils/stickers.js）
    collectedStickers: [],                        // 收藏的表情（kv stickers/{role}）
    imgView: false, imgViewList: []               // 图片全屏预览（t-image-viewer）
  },

  onLoad() {
    const role = room.getRole() || 'boy';
    const peer = room.getPeer() || 'girl';
    const u = user.getUser() || {};
    this._pending = [];
    this._serverItems = [];
    this._lastPokeTs = null;   // 对方戳我的基线 ts
    this._lastTap = 0;         // 双击头像检测
    this._lastBubbleTap = 0;   // 双击气泡检测（全屏查看）
    this._bottomToggle = false; // 钉底 scroll-top 交替标记（值必须每次变才触发重新定位）
    this._vh = 0;              // 消息列表可视高度（px，判 atBottom 用）
    this._atBottom = true;     // 当前是否贴在底部
    this._scrollAction = null; // 进入后首次 compose 的滚动动作：'bottom' | 'restore'
    this.setData({
      theme: getApp().globalData.theme || 'sakura',
      myRole: role, peer,
      myNick: u.nick || '',
      myAvatar: u.avatar || ('/assets/images/' + role + '.jpg'),
      peerAvatar: '/assets/images/' + peer + '.jpg'
    });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom();
    room.join();
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    this._scrollAction = (_savedScrollTop == null) ? 'bottom' : 'restore';
    wx.createSelectorQuery().select('.chat-list').boundingClientRect(r => { if (r) this._vh = r.height; }).exec();
    if (!this._unsub) {
      this._unsub = Store.onList('chat', items => {
        const arr = items || [];
        this._serverItems = arr;
        const peerPokes = arr.filter(it => it && it.type === 'poke' && it.from !== this.data.myRole);
        if (peerPokes.length) {
          const top = peerPokes.reduce((a, b) => ((b.ts || 0) > (a.ts || 0) ? b : a));
          if (this._lastPokeTs === null) {
            this._lastPokeTs = top.ts || 0;
          } else if ((top.ts || 0) > this._lastPokeTs) {
            this._lastPokeTs = top.ts || 0;
            this.receivePoke(top.suffix);
          }
        }
        this.compose();
      });
    }
    if (!this._suffixSub) {
      this._suffixSub = Store.onValue('pokeSuffix/' + this.data.myRole, v => {
        this.setData({ mySuffix: (v && v.suffix) || '' });
      });
    }
    // 收藏的表情（实时）
    if (!this._stickerSub) {
      this._stickerSub = Store.onList('stickers/' + this.data.myRole, items => {
        this.setData({ collectedStickers: items || [] });
      });
    }
    if (!this._kbhandler) {
      this._kbhandler = res => { this.applyKeyboard(res.height || 0); };
      wx.onKeyboardHeightChange(this._kbhandler);
    }
  },
  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    if (this._suffixSub) { this._suffixSub(); this._suffixSub = null; }
    if (this._stickerSub) { this._stickerSub(); this._stickerSub = null; }
    if (this._kbhandler) { wx.offKeyboardHeightChange(this._kbhandler); this._kbhandler = null; }
    if (this._pokeTimer) clearTimeout(this._pokeTimer);
    if (this._shakeTimer) clearTimeout(this._shakeTimer);
    this._pending = [];
  },

  compose() {
    const serverTs = new Set(this._serverItems.map(m => m.ts));
    const all = this._serverItems.slice();
    for (const p of this._pending) {
      if (!serverTs.has(p.ts)) all.push({ ...p, _status: p.status, _uid: p.uid });
    }
    all.sort((a, b) => (a.ts || 0) - (b.ts || 0));

    let prevTs = 0, prevSender = null;
    const messages = all.map(m => {
      const showTime = !prevTs || (m.ts - prevTs) > 5 * 60 * 1000;
      prevTs = m.ts;
      if (m.type === 'poke') {
        const from = m.from;
        const isMe = from === this.data.myRole;
        const fromNick = m.fromNick || roleFull(from);
        prevSender = from;
        return {
          uid: m._uid || m.id || ('p' + m.ts),
          poke: true, kind: 'poke',
          pokeText: fromNick + ' 拍了拍 ' + (isMe ? 'ta' : '你') + (m.suffix ? ' ' + m.suffix : ''),
          timeText: showTime ? formatChatTime(m.ts) : '', showTime
        };
      }
      const mine = m.sender === this.data.myRole;
      const showAvatar = (m.sender !== prevSender) || showTime;
      prevSender = m.sender;
      const base = {
        uid: m._uid || m.id || ('s' + m.ts),
        mine, showAvatar,
        avatar: mine ? this.data.myAvatar : this.data.peerAvatar,
        timeText: showTime ? formatChatTime(m.ts) : '',
        showTime, timeShort: fmtShort(m.ts),
        status: m._status || 'sent'
      };
      if (m.type === 'image') {
        return { ...base, kind: m.sticker ? 'sticker' : 'image', src: m.fileID || m._local, w: m.w, h: m.h };
      }
      if (m.type === 'file') {
        const ext = ((m.name || '').split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
        return { ...base, kind: 'file', fileID: m.fileID, name: m.name, ext, sizeText: fmtSize(m.size) };
      }
      return { ...base, kind: 'text', text: m.text, emojiOnly: isEmojiOnly(m.text) };
    });
    this.setData({ messages, loaded: true });
    const action = this._scrollAction; this._scrollAction = null;
    if (action === 'restore') {
      this._atBottom = false;
      this.setData({ scrollTop: _savedScrollTop || 0 });
    } else if (action === 'bottom' || this._atBottom) {
      this.pinBottom();
    }
  },

  onInput(e) { const v = e.detail.value; this.setData({ input: v }); this._computeInputHeight(v); },
  onInputFocus() { if (this.data.emojiOpen) this.setData({ emojiOpen: false }); },
  onKbHeight(e) { this.applyKeyboard(e.detail.height || 0); },
  toggleEmoji() {
    const open = !this.data.emojiOpen;
    this.setData({ emojiOpen: open });
    if (open && wx.hideKeyboard) wx.hideKeyboard();
  },
  pickEmoji(e) {
    const v = (this.data.input || '') + e.currentTarget.dataset.e;
    this.setData({ input: v });
    this._computeInputHeight(v);
  },
  // 输入框高度按换行数同步计算（不用原生 auto-height，避免进入时高度闪一下）
  _computeInputHeight(text) {
    const lines = Math.max(1, (text || '').split('\n').length);
    const h = Math.max(80, Math.min(80 + (lines - 1) * 44, 230));
    if (h !== this.data.inputHeight) this.setData({ inputHeight: h });
  },

  async send() {
    const t = (this.data.input || '').trim();
    if (!t) return;
    this.setData({ input: '', emojiOpen: false, inputHeight: 80 });
    const ts = Store.now();
    const uid = 'p' + ts;
    const entry = { uid, sender: this.data.myRole, text: t, ts, status: 'sending' };
    this._pending.push(entry);
    this._scrollAction = 'bottom';
    this.compose();
    try {
      const coupleId = (user.getUser() || {}).coupleId;
      const r = await wx.cloud.callFunction({ name: 'sendMsg', data: { coupleId, text: entry.text, ts: entry.ts } });
      entry.status = 'sent';
      const push = r && r.result && r.result.push;
      if (push) console.log('[sendMsg push]', push);
      if (push && !push.ok) {
        const tip = push.errCode === 43101 ? '对方还没开启通知，让 ta 点首页「消息通知」'
          : push.errCode === 47003 ? '订阅模板参数不符，检查模板关键词'
          : push.errCode === 40037 ? '模板 ID 有误'
          : ('通知推送失败 ' + (push.errCode || ''));
        toast(tip);
      }
    } catch (e) {
      entry.status = 'failed';
      toast('发送失败');
    }
    this.compose();
  },

  // —— 媒体：「+」菜单 / 选图 / 选文件 / 上传发送 ——
  openPlus() { this.setData({ plusOpen: true, emojiOpen: false }); if (wx.hideKeyboard) wx.hideKeyboard(); },
  onPlusChange(e) { this.setData({ plusOpen: e.detail.visible }); },
  onPlusPick(e) {
    const d = e.detail || {};
    const label = (d.item && d.item.label) || d.label;
    this.setData({ plusOpen: false });
    if (label === '拍照') this.chooseImage('camera');
    else if (label === '相册') this.chooseImage('album');
    else if (label === '文件') this.chooseFile();
  },
  chooseImage(source) {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: [source], sizeType: ['compressed'],
      success: res => {
        const f = res.tempFiles && res.tempFiles[0];
        if (f) this.uploadAndSend({ kind: 'image', localPath: f.tempFilePath, w: f.width, h: f.height });
      },
      fail: () => {}
    });
  },
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      success: res => {
        const f = res.tempFiles && res.tempFiles[0];
        if (f) this.uploadAndSend({ kind: 'file', localPath: f.path, name: f.name, size: f.size });
      },
      fail: () => {}
    });
  },
  // 本地文件 → 上传云存储 → 调 sendMsg（乐观上屏用 localPath，成功后切 fileID）
  async uploadAndSend(payload) {
    const coupleId = (user.getUser() || {}).coupleId || 'common';
    const ext = ((payload.localPath || '').split('.').pop() || 'bin').split('?')[0].slice(0, 5);
    const cloudPath = `chat-msg/${coupleId}/${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const ts = Store.now();
    const uid = 'p' + ts;
    const entry = Object.assign(
      { uid, sender: this.data.myRole, type: payload.kind, ts, status: 'sending', _local: payload.localPath },
      payload.kind === 'image' ? { w: payload.w, h: payload.h } : { name: payload.name, size: payload.size }
    );
    this._pending.push(entry);
    this._scrollAction = 'bottom';
    this.compose();
    wx.showLoading({ title: '发送中', mask: true });
    try {
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: payload.localPath });
      const media = payload.kind === 'image'
        ? { kind: 'image', fileID: up.fileID, w: payload.w, h: payload.h }
        : { kind: 'file', fileID: up.fileID, name: payload.name, size: payload.size };
      await wx.cloud.callFunction({ name: 'sendMsg', data: { coupleId, ts, media } });
      entry.status = 'sent'; entry.fileID = up.fileID; entry._local = null;
    } catch (e) {
      entry.status = 'failed';
      toast('发送失败');
    }
    wx.hideLoading();
    this.compose();
  },
  // 已有 fileID 的媒体（收藏表情）直接发，不重复上传
  async _sendMediaMsg(media) {
    const coupleId = (user.getUser() || {}).coupleId;
    const ts = Store.now();
    const uid = 'p' + ts;
    const entry = Object.assign(
      { uid, sender: this.data.myRole, type: media.kind, fileID: media.fileID, ts, status: 'sending' },
      media.kind === 'image' ? { sticker: !!media.sticker, w: media.w, h: media.h } : { name: media.name, size: media.size }
    );
    this._pending.push(entry);
    this._scrollAction = 'bottom';
    this.compose();
    try {
      await wx.cloud.callFunction({ name: 'sendMsg', data: { coupleId, ts, media } });
      entry.status = 'sent';
    } catch (e) { entry.status = 'failed'; toast('发送失败'); }
    this.compose();
  },
  sendSticker(e) {
    const fileID = e.currentTarget.dataset.fid;
    if (!fileID) return;
    this.setData({ emojiOpen: false });
    this._sendMediaMsg({ kind: 'image', fileID, sticker: true });
  },
  async sendBuiltinSticker(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    this.setData({ emojiOpen: false });
    const coupleId = (user.getUser() || {}).coupleId || 'common';
    const ext = (src.split('.').pop() || 'png').slice(0, 5);
    const cloudPath = `chat-msg/${coupleId}/sticker_${Date.now().toString(36)}.${ext}`;
    wx.showLoading({ title: '发送中', mask: true });
    try {
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: src });
      await this._sendMediaMsg({ kind: 'image', fileID: up.fileID, sticker: true });
    } catch (e) { toast('发送失败'); }
    wx.hideLoading();
  },
  collectSticker(e) {
    const fileID = e.currentTarget.dataset.src;
    if (!fileID || fileID.indexOf('cloud://') !== 0) return toast('图片还在上传，稍后再收藏');
    Store.push('stickers/' + this.data.myRole, { fileID, ts: Store.now() });
    toast('已收藏到表情包');
  },
  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    this.setData({ imgView: true, imgViewList: [src] });
  },
  onImgViewClose() { this.setData({ imgView: false }); },
  openFile(e) {
    const fileID = e.currentTarget.dataset.fid;
    if (!fileID) return;
    wx.showLoading({ title: '下载中', mask: true });
    wx.cloud.downloadFile({
      fileID,
      success: res => {
        wx.hideLoading();
        wx.openDocument({ filePath: res.tempFilePath, showMenu: true, fail: () => toast('暂无法打开该文件') });
      },
      fail: () => { wx.hideLoading(); toast('下载失败'); }
    });
  },
  onEmojiTab(e) { this.setData({ emojiTab: e.detail.value }); },

  // —— 列表滚动 / 钉底 / 键盘 ——
  onListScroll(e) {
    const top = e.detail.scrollTop || 0;
    _savedScrollTop = top;
    const sh = e.detail.scrollHeight || 0;
    this._atBottom = !this._vh || (top + this._vh >= sh - 40);
  },
  pinBottom() {
    this._bottomToggle = !this._bottomToggle;
    this._atBottom = true;
    this.setData({ scrollTop: this._bottomToggle ? 1000000000 : 999999999 });
  },
  applyKeyboard(px) {
    if (!this._sw) this._sw = (wx.getWindowInfo ? wx.getWindowInfo().windowWidth : wx.getSystemInfoSync().windowWidth) || 375;
    const rpx = px ? px * 750 / this._sw : 0;
    this._bottomToggle = !this._bottomToggle;
    this._atBottom = true;
    this.setData({ kbHeight: rpx, scrollTop: this._bottomToggle ? 1000000000 : 999999999 });
  },

  // —— 全屏输入 ——
  openFullInput() { this.setData({ fullInput: true, fullInputText: this.data.input || '' }); },
  onFullInput(e) { this.setData({ fullInputText: e.detail.value }); },
  closeFullInput() { this.setData({ fullInput: false }); },
  confirmFullInput() {
    const text = this.data.fullInputText || '';
    this.setData({ input: text, fullInput: false });
    this._computeInputHeight(text);
  },

  // —— 文本消息：长按复制 / 双击全屏查看 ——
  onBubbleLongPress(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.text || '', success: () => wx.showToast({ title: '已复制', icon: 'none' }) });
  },
  onBubbleTap(e) {
    const now = Date.now();
    if (this._lastBubbleTap && now - this._lastBubbleTap < 300) {
      this._lastBubbleTap = 0;
      this.setData({ msgView: true, msgViewText: e.currentTarget.dataset.text || '' });
    } else { this._lastBubbleTap = now; }
  },
  closeMsgView() { this.setData({ msgView: false }); },
  copyMsgView() {
    wx.setClipboardData({ data: this.data.msgViewText || '', success: () => wx.showToast({ title: '已复制', icon: 'success' }) });
  },

  // —— 戳一戳（学微信）——
  onAvatarTap() {
    const now = Date.now();
    if (this._lastTap && now - this._lastTap < 300) { this._lastTap = 0; this.sendPoke(); }
    else this._lastTap = now;
  },
  sendPoke() {
    Store.push('chat', {
      type: 'poke', from: this.data.myRole, to: this.data.peer,
      fromNick: this.data.myNick || '', suffix: this.data.mySuffix || '', ts: Store.now()
    });
    this.triggerShake(this.data.peer);
  },
  receivePoke(suffix) {
    this.setData({ pokeTip: true, pokeText: 'ta 拍了拍你' + (suffix ? ' ' + suffix : '') });
    if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
    this.triggerShake(this.data.myRole);
    if (this._pokeTimer) clearTimeout(this._pokeTimer);
    this._pokeTimer = setTimeout(() => this.setData({ pokeTip: false }), 2000);
  },
  triggerShake(target) {
    this.setData({ pokeShakeTarget: '' });
    setTimeout(() => {
      this.setData({ pokeShakeTarget: target });
      if (this._shakeTimer) clearTimeout(this._shakeTimer);
      this._shakeTimer = setTimeout(() => this.setData({ pokeShakeTarget: '' }), 600);
    }, 20);
  }
});
