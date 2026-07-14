// chat —— 微信风格实时聊天
// 乐观回显：发送即上屏（loading），sendMsg 成功转 sent，失败转 failed
// 头像聚合：连续同 sender 只首条带头像；气泡带小箭头指向发送者
// 戳一戳：后缀在「我的」页预设（pokeSuffix/{role}）；双击头像/点按钮直接戳；
//         写入 chat 流居中记录；被戳方头像抖动 + 震动
const user = require('@utils/user.js');
const room = require('@utils/room.js');
const { Store } = require('@utils/store.js');
const { toast, roleFull } = require('@utils/util.js');

const peerRole = r => (r === 'boy' ? 'girl' : 'boy');

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

Page({
  data: {
    theme: 'sakura', messages: [], scrollTo: '',
    input: '', emojiOpen: false, emojis: EMOJIS,
    myRole: 'boy', peer: 'girl', myAvatar: '', peerAvatar: '',
    myNick: '',               // 我的昵称（戳一戳记录显示用）
    mySuffix: '',             // 我预设的戳一戳后缀（pokeSuffix/{myRole}）
    pokeTip: false, pokeText: '',
    pokeShakeTarget: '',      // 当前要抖动的头像 role（被戳方）
    kbHeight: 0               // 键盘高度（弹起时抬高输入栏，防遮挡）
  },

  onLoad() {
    const role = room.getRole() || 'boy';
    const peer = room.getPeer() || 'girl';
    const u = user.getUser() || {};
    this._pending = [];
    this._serverItems = [];
    this._lastPokeTs = null;   // 对方戳我的基线 ts
    this._lastTap = 0;         // 双击头像检测
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
    if (!this._unsub) {
      this._unsub = Store.onList('chat', items => {
        const arr = items || [];
        this._serverItems = arr;
        // 对方戳我（from !== myRole）的新 poke → 我头像抖 + 震动 + 顶部提示
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
    // 读我预设的戳一戳后缀
    if (!this._suffixSub) {
      this._suffixSub = Store.onValue('pokeSuffix/' + this.data.myRole, v => {
        this.setData({ mySuffix: (v && v.suffix) || '' });
      });
    }
    // 全局键盘高度监听（比 input 的 bindkeyboardheightchange 更可靠，作主通道）
    if (!this._kbHandler) {
      this._kbHandler = res => {
        const px = res.height || 0;
        if (!this._sw) this._sw = (wx.getWindowInfo ? wx.getWindowInfo().windowWidth : wx.getSystemInfoSync().windowWidth) || 375;
        this.setData({ kbHeight: px ? px * 750 / this._sw : 0 });
      };
      wx.onKeyboardHeightChange(this._kbHandler);
    }
  },
  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    if (this._suffixSub) { this._suffixSub(); this._suffixSub = null; }
    if (this._kbHandler) { wx.offKeyboardHeightChange(this._kbHandler); this._kbHandler = null; }
    if (this._pokeTimer) clearTimeout(this._pokeTimer);
    if (this._shakeTimer) clearTimeout(this._shakeTimer);
    this._pending = [];
  },

  compose() {
    const serverTs = new Set(this._serverItems.map(m => m.ts));
    const all = this._serverItems.slice();
    for (const p of this._pending) {
      if (!serverTs.has(p.ts)) all.push({ sender: p.sender, text: p.text, ts: p.ts, _status: p.status, _uid: p.uid });
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
          poke: true,
          pokeText: fromNick + ' 拍了拍 ' + (isMe ? 'ta' : '你') + (m.suffix ? ' ' + m.suffix : ''),
          timeText: showTime ? formatChatTime(m.ts) : '',
          showTime
        };
      }
      const mine = m.sender === this.data.myRole;
      const showAvatar = (m.sender !== prevSender) || showTime;
      prevSender = m.sender;
      return {
        uid: m._uid || m.id || ('s' + m.ts),
        mine, showAvatar,
        avatar: mine ? this.data.myAvatar : this.data.peerAvatar,
        text: m.text,
        emojiOnly: isEmojiOnly(m.text),
        timeText: showTime ? formatChatTime(m.ts) : '',
        showTime,
        timeShort: fmtShort(m.ts),
        status: m._status || 'sent'
      };
    });
    const last = messages[messages.length - 1];
    this.setData({ messages }, () => {
      // 等 DOM 渲染完再定位到最后一条，避免 scroll-into-view 找不到元素、进入时停在第一条
      this.setData({ scrollTo: last ? ('m-' + last.uid) : '' });
    });
  },

  onInput(e) { this.setData({ input: e.detail.value }); },
  onInputFocus() { if (this.data.emojiOpen) this.setData({ emojiOpen: false }); },   // 键盘弹起 → 收起表情面板
  onKbHeight(e) {
    const px = e.detail.height || 0;
    if (!this._sw) this._sw = (wx.getWindowInfo ? wx.getWindowInfo().windowWidth : wx.getSystemInfoSync().windowWidth) || 375;
    this.setData({ kbHeight: px ? px * 750 / this._sw : 0 });
  },
  toggleEmoji() {
    const open = !this.data.emojiOpen;
    this.setData({ emojiOpen: open });
    if (open && wx.hideKeyboard) wx.hideKeyboard();                                   // 打开表情 → 收键盘
  },
  pickEmoji(e) {
    this.setData({ input: (this.data.input || '') + e.currentTarget.dataset.e });
  },

  async send() {
    const t = (this.data.input || '').trim();
    if (!t) return;
    this.setData({ input: '', emojiOpen: false });
    const ts = Store.now();
    const uid = 'p' + ts;
    const entry = { uid, sender: this.data.myRole, text: t, ts, status: 'sending' };
    this._pending.push(entry);
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
    this.triggerShake(this.data.peer);   // 我戳对方 → 我屏上对方头像抖
  },
  receivePoke(suffix) {
    this.setData({ pokeTip: true, pokeText: 'ta 拍了拍你' + (suffix ? ' ' + suffix : '') });
    if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
    this.triggerShake(this.data.myRole);  // 被戳 → 我的头像抖
    if (this._pokeTimer) clearTimeout(this._pokeTimer);
    this._pokeTimer = setTimeout(() => this.setData({ pokeTip: false }), 2000);
  },
  triggerShake(target) {
    this.setData({ pokeShakeTarget: '' });   // 先清，确保 class 重新挂上能再次播放
    setTimeout(() => {
      this.setData({ pokeShakeTarget: target });
      if (this._shakeTimer) clearTimeout(this._shakeTimer);
      this._shakeTimer = setTimeout(() => this.setData({ pokeShakeTarget: '' }), 600);
    }, 20);
  }
});
