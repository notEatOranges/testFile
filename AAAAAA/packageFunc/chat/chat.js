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

// 语音：录音器/播放器为模块级单例（页面内共享，避免重复创建）。
// 回调通过 _chatPage 分发给当前活跃的聊天页实例（借鉴参考仓库的模块级单例写法）。
const recorder = wx.getRecorderManager();
const audio = wx.createInnerAudioContext();
audio.obeyMuteSwitch = false;          // 静音键下仍可播放语音消息
let _chatPage = null;                  // 活跃聊天页实例（回调分发用）
recorder.onStop(res => { if (_chatPage) _chatPage._onRecordStop(res); });
recorder.onError(() => {
  if (_chatPage) _chatPage.setData({ recording: false, willCancel: false });
  toast('录音权限不足，请到设置开启');
});
audio.onEnded(() => { if (_chatPage) { _chatPage._voicePlayingUid = ''; _chatPage.compose(); } });
audio.onError(() => { if (_chatPage) { _chatPage._voicePlayingUid = ''; _chatPage.compose(); toast('语音播放失败'); } });

// 聊天背景预设（马卡龙渐变，无需图片资源）
const BG_PRESETS = [
  { key: 'sakura',    label: '樱粉', css: 'linear-gradient(160deg, #fff5f7, #ffe4ec)' },
  { key: 'mint',      label: '薄荷', css: 'linear-gradient(160deg, #f0fbf6, #d7f2e3)' },
  { key: 'lavender',  label: '薰衣', css: 'linear-gradient(160deg, #f6f2fc, #e6dcf5)' },
  { key: 'babyblue',  label: '晴空', css: 'linear-gradient(160deg, #eef6fd, #d6ebfa)' },
  { key: 'peach',     label: '蜜桃', css: 'linear-gradient(160deg, #fff3ec, #ffe4d4)' },
  { key: 'night',     label: '夜空', css: 'linear-gradient(160deg, #2b2b3a, #4a3b5e)' }
];

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

// 浅相等：两个消息对象所有字段都相同（用于 compose 复用旧引用，避免未变消息被重新渲染、头像重新加载）
function objSame(a, b) {
  if (!a || !b) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (let i = 0; i < kb.length; i++) if (a[kb[i]] !== b[kb[i]]) return false;
  return true;
}
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
function fmtDur(ms) { return Math.max(1, Math.round((ms || 0) / 1000)) + '″'; }

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
      { label: '文件', icon: 'file-1' },
      { label: '戳一戳', icon: 'heart' },
      { label: '聊天背景', icon: 'image-1' }
    ],
    emojiTab: 0,                                  // 表情面板：0=表情 1=表情包
    builtinStickers: BUILTIN_STICKERS,            // 内置表情（utils/stickers.js）
    collectedStickers: [],                        // 收藏的表情（kv stickers/{role}）
    imgView: false, imgViewList: [],              // 图片全屏预览（t-image-viewer）
    // —— 语音 ——
    voiceMode: false,                             // 语音/文本输入切换
    recording: false,                             // 正在录音
    willCancel: false,                            // 上滑将取消
    longInput: false,                             // 输入较多内容时才浮现「全屏」入口
    // —— 聊天背景 ——
    bgSrc: '',                                    // 自定义背景图 fileID
    bgStyle: '',                                  // 预设背景渐变 inline
    bgPanel: false,                               // 背景选择面板
    bgPresets: BG_PRESETS                         // 预设列表（面板渲染用）
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
    _chatPage = this;                        // 语音回调分发到本实例
    this._voiceUrlCache = {};                // fileID → tempURL 缓存（避免重复 getTempFileURL）
    this._voicePlayingUid = '';              // 当前播放中的语音 uid
    this._talkStartY = 0;                    // 按住说话起点 Y（判上滑取消）
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
    // 聊天背景（couple 共享，实时同步）
    if (!this._bgSub) {
      this._bgSub = Store.onValue('chatBg', v => this.applyBg(v));
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
    if (this._bgSub) { this._bgSub(); this._bgSub = null; }
    if (this._kbhandler) { wx.offKeyboardHeightChange(this._kbhandler); this._kbhandler = null; }
    if (this._pokeTimer) clearTimeout(this._pokeTimer);
    if (this._shakeTimer) clearTimeout(this._shakeTimer);
    // 语音收尾：先摘掉活跃实例（让在途的录音 onStop 回调失效，避免离开页面还发消息），再停播放器
    if (_chatPage === this) _chatPage = null;
    if (this.data.recording) { try { recorder.stop(); } catch (e) {} }
    try { audio.stop(); } catch (e) {}
    this._voicePlayingUid = '';
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
    const _oldMap = {};
    (this.data.messages || []).forEach(m => _oldMap[m.uid] = m);
    const raw = all.map(m => {
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
        status: m._status || 'sent',
        progress: m.progress
      };
      if (m.type === 'image') {
        return { ...base, kind: m.sticker ? 'sticker' : 'image', src: m.fileID || m._local, w: m.w, h: m.h };
      }
      if (m.type === 'voice') {
        return { ...base, kind: 'voice', fileID: m.fileID, src: m._local || m.fileID, durText: fmtDur(m.duration), playing: base.uid === this._voicePlayingUid };
      }
      if (m.type === 'file') {
        const ext = ((m.name || '').split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
        return { ...base, kind: 'file', fileID: m.fileID, name: m.name, ext, sizeText: fmtSize(m.size) };
      }
      return { ...base, kind: 'text', text: m.text, emojiOnly: isEmojiOnly(m.text) };
    });
    // 复用未变化消息的旧引用：setData diff 会跳过这些 item，头像 image 不重新加载、发送更流畅
    const messages = raw.map(it => { const old = _oldMap[it.uid]; return (old && objSame(old, it)) ? old : it; });
    this.setData({ messages, loaded: true });
    const action = this._scrollAction; this._scrollAction = null;
    if (action === 'restore') {
      this._atBottom = false;
      this.setData({ scrollTop: _savedScrollTop || 0 });
    } else if (action === 'bottom' || this._atBottom) {
      this.pinBottom();
    }
  },

  onInput(e) { const v = e.detail.value; this.setData({ input: v, longInput: v.length >= 30 }); this._computeInputHeight(v); },
  onInputFocus() { if (this.data.emojiOpen) this.setData({ emojiOpen: false }); },
  onKbHeight(e) { this.applyKeyboard(e.detail.height || 0); },
  toggleEmoji() {
    const open = !this.data.emojiOpen;
    this.setData({ emojiOpen: open, plusOpen: false, kbHeight: 0 });
    if (open && wx.hideKeyboard) wx.hideKeyboard();
  },
  pickEmoji(e) {
    const v = (this.data.input || '') + e.currentTarget.dataset.e;
    this.setData({ input: v, longInput: v.length >= 30 });
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
    this.setData({ input: '', emojiOpen: false, plusOpen: false, inputHeight: 80, longInput: false });
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
  // 「+」底部面板（微信式：内联在输入栏下方，顶起输入栏）
  openPlus() {
    const open = !this.data.plusOpen;
    this.setData({ plusOpen: open, emojiOpen: false, kbHeight: 0 });
    if (open && wx.hideKeyboard) wx.hideKeyboard();
  },
  onPlusItem(e) {
    const label = e.currentTarget.dataset.label;
    this.setData({ plusOpen: false });
    if (label === '拍照') this.chooseImage('camera');
    else if (label === '相册') this.chooseImage('album');
    else if (label === '文件') this.chooseFile();
    else if (label === '戳一戳') this.sendPoke();
    else if (label === '聊天背景') this.openBgPanel();
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
  // 上传进度实时回写到气泡（替代全局 loading），5% 一刷避免抖动
  async uploadAndSend(payload) {
    const coupleId = (user.getUser() || {}).coupleId || 'common';
    const ext = ((payload.localPath || '').split('.').pop() || 'bin').split('?')[0].slice(0, 5);
    const cloudPath = `chat-msg/${coupleId}/${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const ts = Store.now();
    const uid = 'p' + ts;
    const entry = Object.assign(
      { uid, sender: this.data.myRole, type: payload.kind, ts, status: 'sending', _local: payload.localPath, progress: 0, _lastP: 0 },
      payload.kind === 'image' ? { w: payload.w, h: payload.h } : { name: payload.name, size: payload.size }
    );
    this._pending.push(entry);
    this._scrollAction = 'bottom';
    this.compose();
    try {
      const up = await new Promise((resolve, reject) => {
        const task = wx.cloud.uploadFile({ cloudPath, filePath: payload.localPath, success: resolve, fail: reject });
        task.onProgressUpdate(({ progress }) => {
          entry.progress = progress;
          if (Math.abs(progress - entry._lastP) >= 5 || progress >= 100) { entry._lastP = progress; this.compose(); }
        });
      });
      const media = payload.kind === 'image'
        ? { kind: 'image', fileID: up.fileID, w: payload.w, h: payload.h }
        : { kind: 'file', fileID: up.fileID, name: payload.name, size: payload.size };
      await wx.cloud.callFunction({ name: 'sendMsg', data: { coupleId, ts, media } });
      entry.status = 'sent'; entry.fileID = up.fileID; entry._local = null; entry.progress = null;
    } catch (e) {
      entry.status = 'failed'; entry.progress = null;
      toast('发送失败');
    }
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

  // —— 语音消息（按住说话：松开发送，上滑取消，<1s 丢弃，60s 自动停）——
  toggleVoice() {
    const open = !this.data.voiceMode;
    this.setData({ voiceMode: open, emojiOpen: false, plusOpen: false, kbHeight: 0 });
    if (open && wx.hideKeyboard) wx.hideKeyboard();
  },
  onTalkStart(e) {
    this._talkStartY = (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
    this.setData({ recording: true, willCancel: false });
    try {
      recorder.start({ duration: 60000, sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 96000, format: 'mp3' });
    } catch (err) { this.setData({ recording: false }); toast('无法开始录音'); }
  },
  onTalkMove(e) {
    if (!this.data.recording) return;
    const y = (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
    this.setData({ willCancel: (this._talkStartY - y) > 60 });   // 上滑超 60px → 取消
  },
  onTalkEnd() {
    if (!this.data.recording) return;
    this.setData({ recording: false });
    try { recorder.stop(); } catch (err) { this.setData({ willCancel: false }); }
  },
  _onRecordStop(res) {
    const cancel = this.data.willCancel;
    this.setData({ willCancel: false });
    if (cancel) return;                              // 上滑取消：丢弃
    if (!res || !res.tempFilePath) return;
    const dur = res.duration || 0;
    if (dur < 1000) return toast('说话时间太短');     // 不足 1s：丢弃
    this.sendVoice(res.tempFilePath, dur);
  },
  async sendVoice(localPath, duration) {
    const coupleId = (user.getUser() || {}).coupleId || 'common';
    const cloudPath = `chat-msg/${coupleId}/voice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}.mp3`;
    const ts = Store.now();
    const uid = 'p' + ts;
    const entry = { uid, sender: this.data.myRole, type: 'voice', ts, status: 'sending', _local: localPath, duration, progress: 0, _lastP: 0 };
    this._pending.push(entry);
    this._scrollAction = 'bottom';
    this.compose();
    try {
      const up = await new Promise((resolve, reject) => {
        const task = wx.cloud.uploadFile({ cloudPath, filePath: localPath, success: resolve, fail: reject });
        task.onProgressUpdate(({ progress }) => {
          entry.progress = progress;
          if (Math.abs(progress - entry._lastP) >= 10 || progress >= 100) { entry._lastP = progress; this.compose(); }
        });
      });
      await wx.cloud.callFunction({ name: 'sendMsg', data: { coupleId, ts, media: { kind: 'voice', fileID: up.fileID, duration } } });
      entry.status = 'sent'; entry.fileID = up.fileID; entry._local = null; entry.progress = null;
    } catch (e) {
      entry.status = 'failed'; entry.progress = null;
      toast('发送失败');
    }
    this.compose();
  },
  async playVoice(e) {
    const uid = e.currentTarget.dataset.uid;
    const file = e.currentTarget.dataset.voice;
    if (!file) return;
    if (this._voicePlayingUid === uid) {             // 再次点击：停止
      try { audio.stop(); } catch (err) {}
      this._voicePlayingUid = '';
      this.compose();
      return;
    }
    try { audio.stop(); } catch (err) {}
    this._voicePlayingUid = uid;
    this.compose();
    let src = file;
    if (file.indexOf('cloud://') === 0) {            // 云文件需 getTempFileURL（结果缓存）
      if (this._voiceUrlCache[file]) src = this._voiceUrlCache[file];
      else {
        try {
          const r = await wx.cloud.getTempFileURL({ fileList: [file] });
          src = r.fileList[0].tempFileURL;
          this._voiceUrlCache[file] = src;
        } catch (err) { this._voicePlayingUid = ''; this.compose(); return toast('语音加载失败'); }
      }
    }
    audio.src = src;
    audio.play();
  },

  // —— 聊天背景（couple 共享）——
  applyBg(v) {
    if (v && v.type === 'preset') {
      const p = BG_PRESETS.find(b => b.key === v.key);
      this.setData({ bgStyle: (p && p.css) || '', bgSrc: '' });
    } else if (v && v.type === 'image' && v.fileID) {
      this.setData({ bgSrc: v.fileID, bgStyle: '' });
    } else {
      this.setData({ bgSrc: '', bgStyle: '' });
    }
  },
  openBgPanel() { this.setData({ bgPanel: true, plusOpen: false }); if (wx.hideKeyboard) wx.hideKeyboard(); },
  closeBgPanel() { this.setData({ bgPanel: false }); },
  pickBgPreset(e) {
    Store.set('chatBg', { type: 'preset', key: e.currentTarget.dataset.key }); // watch 自动回显
    this.setData({ bgPanel: false });
  },
  clearBg() { Store.set('chatBg', null); this.setData({ bgPanel: false }); },
  chooseBgImage() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'],
      success: res => {
        const f = res.tempFiles && res.tempFiles[0];
        if (!f) return;
        const coupleId = (user.getUser() || {}).coupleId || 'common';
        const cloudPath = `chat-bg/${coupleId}/${Date.now().toString(36)}.jpg`;
        wx.showLoading({ title: '设置中', mask: true });
        wx.cloud.uploadFile({
          cloudPath, filePath: f.tempFilePath,
          success: up => { Store.set('chatBg', { type: 'image', fileID: up.fileID }); this.setData({ bgPanel: false }); },
          fail: () => toast('设置失败'),
          complete: () => wx.hideLoading()
        });
      },
      fail: () => {}
    });
  },

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
    this.setData({ input: text, fullInput: false, longInput: text.length >= 30 });
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
