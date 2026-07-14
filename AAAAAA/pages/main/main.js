// main —— 首页 tab：欢迎栏 + 对方在线 + 导航 + 订阅通知入口
const user = require('../../utils/user.js');
const room = require('../../utils/room.js');
const ident = require('../../utils/ident.js');
const { toast } = require('../../utils/util.js');
const notify = require('../../utils/notify.js');
const { Store } = require('../../utils/store.js');

const CARDS = [
  { page: 'chat',     icon: 'chat',      nt: '悄悄对话', nd: '只属于你俩',  ready: true },
  { page: 'mood',     icon: 'heart',     nt: '今日心情', nd: '心情+悄悄话', ready: true },
  { page: 'days',     icon: 'calendar',  nt: '在一起',   nd: '天数·纪念日', ready: true },
  { page: 'wishlist', icon: 'check',     nt: '心愿清单', nd: '一起打卡',    ready: true },
  { page: 'truthbox', icon: 'edit-1',    nt: '真心话',   nd: '默契问答',    ready: true },
  { page: 'lobby',    icon: 'app',       nt: '游戏大厅', nd: '2048·方块·画猜', ready: true }
];

Page({
  data: {
    theme: 'sakura', cards: CARDS, booting: true,
    role: 'boy', peer: 'girl',
    myNick: '', myAvatar: '', peerName: 'ta', peerAvatar: '',
    roomCode: '', peerOnline: false, quota: { chat: 0, anniv: 0 }
  },

  onLoad() {
    this.setData({ theme: getApp().globalData.theme || 'sakura' });
    this.boot();
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme || 'sakura', quota: notify.getQuota() });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
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
      wx.reLaunch({ url: '/pages/setup/setup' });
      return;
    }
    user.applyToRoom();
    room.join();
    ident.bind(this);                 // 注入 myNick/myAvatar/peerName/peerAvatar，并订阅对方 profile
    this.setData({ roomCode: room.getRoom() || '', booting: false });
    if (!this._unsub) {
      this._unsub = room.onPeerPresence(p => this.evalPresence(p));
    }
    // 周期重算在线状态：对方崩溃/退到后台不再写 presence 时，靠 30s 超时把"在线"纠正为"离线"
    // （watch 只在文档变化时回调，否则 peerOnline 会一直卡在 true）
    if (!this._presenceTimer) {
      this._presenceTimer = setInterval(() => this.evalPresence(this._peerPresence), 5000);
    }
  },

  onUnload() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    ident.teardown(this);
    if (this._presenceTimer) { clearInterval(this._presenceTimer); this._presenceTimer = null; }
    if (this._bubbleTimer) { clearTimeout(this._bubbleTimer); this._bubbleTimer = null; }
  },

  // 评估对方在线状态；离线→上线时弹气泡通知
  evalPresence(p) {
    this._peerPresence = p || null;
    const online = room.isOnline(p);
    if (online && !this.data.peerOnline) this.showOnlineBubble();
    if (this.data.peerOnline !== online) this.setData({ peerOnline: online });
  },
  showOnlineBubble() {
    // 用 TDesign message 组件提示；显示对方网名（无网名时退回 'ta'，不再出现男生/女生）
    const text = (this.data.peerName || '对方') + ' 上线啦';
    const msg = this.selectComponent('#t-message');
    if (msg && msg.setMessage) msg.setMessage({ content: text, duration: 3000, single: true }, 'success');
  },
  // 下拉刷新：强制重取对方在线状态，保证实时
  async onPullDownRefresh() {
    try {
      const p = await Store.getOnce('members/' + (room.getPeer() || 'girl'));
      this.evalPresence(p);
    } catch (e) {}
    wx.stopPullDownRefresh();
  },

  goCard(e) {
    const c = CARDS[e.currentTarget.dataset.idx];
    if (!c.ready) return toast(c.nt + ' 敬请期待');
    wx.navigateTo({ url: '/packageFunc/' + c.page + '/' + c.page });
  },

  onNotifyTap() {
    notify.requestSubscribeMessage().then(res => {
      const ok = Object.keys(res).some(k => res[k] === 'accept');
      this.setData({ quota: notify.getQuota() });
      toast(ok ? '又攒了一条额度，ta 回复/纪念日能提醒你' : '可稍后再开启');
    });
  }
});
