// chat —— 微信风格实时聊天
// 乐观回显：发送即上屏（loading），sendMsg 成功转 sent，失败转 failed
// 头像聚合：连续同 sender 只首条带头像；气泡带小箭头指向发送者
// 戳一戳：双击头像 / 点按钮 → 自定义戳语 → 写入 chat 流（居中记录）+ 对方震动
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
    myRole: 'boy', myAvatar: '', peerAvatar: '',
    pokeTip: false, pokeText: '',
    pokeOpen: false, pokeSuffix: ''
  },

  onLoad() {
    const role = room.getRole() || 'boy';
    const peer = room.getPeer() || 'girl';
    const u = user.getUser() || {};
    this._pending = [];
    this._serverItems = [];
    this._lastPokeTs = null;     // 对方戳我的基线 ts
    this._lastTap = 0;           // 双击头像检测
    this.setData({
      theme: getApp().globalData.theme || 'sakura',
      myRole: role,
      myAvatar: u.avatar || ('/assets/images/' + role + '.jpg'),
      peerAvatar: '/assets/images/' + peer + '.jpg'
    });
    if (!user.isPaired()) return wx.redirectTo({ url: '/pages/main/main' });
    user.applyToRoom();
    room.join();
  },

  onShow() {
    if (this._unsub) return;
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    this._unsub = Store.onList('chat', items => {
      const arr = items || [];
      this._serverItems = arr;
      // 检测对方新戳一戳 → 震动 + 顶部提示（首次只建基线）
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
  },
  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    if (this._pokeTimer) clearTimeout(this._pokeTimer);
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
      // 戳一戳记录：居中灰条
      if (m.type === 'poke') {
        const sender = m.from;
        prevSender = sender;
        return {
          uid: m._uid || m.id || ('p' + m.ts),
          poke: true,
          pokeText: roleFull(sender) + ' 戳了 ' + roleFull(peerRole(sender)) + (m.suffix ? ' 「' + m.suffix + '」' : ''),
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
  },

  // —— 戳一戳 ——
  onAvatarTap() {
    const now = Date.now();
    if (this._lastTap && now - this._lastTap < 300) { this._lastTap = 0; this.openPoke(); }
    else this._lastTap = now;
  },
  openPoke() { this.setData({ pokeOpen: true, pokeSuffix: '' }); },
  closePoke() { this.setData({ pokeOpen: false }); },
  noop() {},
  onPokeInput(e) { this.setData({ pokeSuffix: e.detail.value }); },
  confirmPoke() {
    const suffix = (this.data.pokeSuffix || '').trim();
    this.setData({ pokeOpen: false });
    Store.push('chat', { type: 'poke', from: this.data.myRole, ts: Store.now(), suffix });
  },
  receivePoke(suffix) {
    this.setData({ pokeTip: true, pokeText: 'ta 戳了你' + (suffix ? ' 「' + suffix + '」' : '') });
    if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
    if (this._pokeTimer) clearTimeout(this._pokeTimer);
    this._pokeTimer = setTimeout(() => this.setData({ pokeTip: false }), 2000);
  }
});
