// chat —— 微信风格实时聊天
// 乐观回显：发送即上屏（loading），push 成功转 sent，失败转 failed（t-icon error）
// 时间分隔：首条 + 与上一条间隔>5min 插时间胶囊；纯 emoji 大字无气泡
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const { Store } = require('../../utils/store.js');
const { toast } = require('../../utils/util.js');

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
    myRole: 'boy', myAvatar: '', peerAvatar: ''
  },

  onLoad() {
    const role = room.getRole() || 'boy';
    const peer = room.getPeer() || 'girl';
    const u = user.getUser() || {};
    this._pending = [];
    this._serverItems = [];
    this.setData({
      theme: getApp().globalData.theme || 'sakura',
      myRole: role,
      myAvatar: u.avatar || ('/assets/images/' + role + '.jpg'),
      peerAvatar: '/assets/images/' + peer + '.jpg'
    });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/index/index' });
    user.applyToRoom();
    room.join();
  },

  onShow() {
    if (this._unsub) return;
    this._unsub = Store.onList('chat', items => { this._serverItems = items || []; this.compose(); });
  },
  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    this._pending = [];
  },

  compose() {
    const serverTs = new Set(this._serverItems.map(m => m.ts));
    const all = this._serverItems.slice();
    for (const p of this._pending) {
      if (!serverTs.has(p.ts)) all.push({ sender: p.sender, text: p.text, ts: p.ts, _status: p.status, _uid: p.uid });
    }
    all.sort((a, b) => (a.ts || 0) - (b.ts || 0));

    let prevTs = 0;
    const messages = all.map(m => {
      const showTime = !prevTs || (m.ts - prevTs) > 5 * 60 * 1000;
      prevTs = m.ts;
      const mine = m.sender === this.data.myRole;
      return {
        uid: m._uid || m.id || ('s' + m.ts),
        mine,
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
    this.setData({ messages, scrollTo: last ? ('m-' + last.uid) : '' });
  },

  onInput(e) { this.setData({ input: e.detail.value }); },
  toggleEmoji() { this.setData({ emojiOpen: !this.data.emojiOpen }); },
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
      await wx.cloud.callFunction({ name: 'sendMsg', data: { coupleId, text: entry.text, ts: entry.ts } });
      entry.status = 'sent';
    } catch (e) {
      entry.status = 'failed';
      toast('发送失败');
    }
    this.compose();
  }
});
