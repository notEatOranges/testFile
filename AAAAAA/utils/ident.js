// ident.js —— 身份展示层（功能5：全站用网名，不再出现「男生/女生」）
// 角色键 boy/girl 只作 kv 数据隔离用；展示层一律用网名 + 头像。
// 各功能页 onLoad 调 ident.bind(this) 即可在 data 注入：
//   { role, peer, myNick, myAvatar, myName, peerNick, peerAvatar, peerName }
// 并自动订阅 profile/{peer}，对方改网名/头像后实时刷新。
// onUnload 调 ident.teardown(this) 退订。
const user = require('./user.js');
const room = require('./room.js');
const { Store } = require('./store.js');

const SELF_FALLBACK = '我';
const PEER_FALLBACK = 'ta';

/** 绑定到页面：注入网名头像 + 订阅对方 profile。返回退订函数。 */
function bind(page) {
  const role = room.getRole() || 'boy';
  const peer = room.getPeer() || 'girl';
  const u = user.getUser() || {};
  const myNick = u.nick || '';
  const myAvatar = u.avatar || '';
  page.setData({
    role, peer,
    myNick, myAvatar,
    myName: myNick || SELF_FALLBACK,
    peerNick: '', peerAvatar: '',
    peerName: PEER_FALLBACK
  });
  // 把自己的网名头像写进 kv（对方读取来源；与 main 旧行为一致）
  Store.update('profile/' + role, { nick: myNick, avatar: myAvatar });
  // 订阅对方 profile，实时刷新对方网名头像
  page._identUnsub = Store.onValue('profile/' + peer, v => {
    const nick = (v && v.nick) || '';
    page.setData({
      peerNick: nick,
      peerAvatar: (v && v.avatar) || '',
      peerName: nick || PEER_FALLBACK
    });
  });
  return () => teardown(page);
}

function teardown(page) {
  if (page._identUnsub) { page._identUnsub(); page._identUnsub = null; }
}

module.exports = { bind, teardown, SELF_FALLBACK, PEER_FALLBACK };
