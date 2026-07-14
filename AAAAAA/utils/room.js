// room.js —— 在线状态/心跳（升级为 openid + coupleId 版）
// 用户体系升级后：身份用 openid（跨设备不变），隔离键用 coupleId（不再手输房间号+PIN）。
// 配对由云函数 createCouple/joinCouple 完成，这里只管"进空间后的在线心跳 + 对方在线感知"。
const { Store } = require('./store.js');
const { peerRole } = require('./util.js');

const ONLINE_TIMEOUT = 30000;
const HEARTBEAT_MS = 12000;

let heartbeatTimer = null;
let ctx = { openid: '', coupleId: '', role: '' };   // 由 setUserContext 注入

function setUserContext({ openid, coupleId, role }) {
  ctx = { openid: openid || '', coupleId: coupleId || '', role: role || '' };
  Store.setRoom(coupleId);   // kv 隔离键切换为 coupleId，并清旧 watcher
}
function clearUserContext() {
  ctx = { openid: '', coupleId: '', role: '' };
  Store.clearRoom();
}

function getRoom() { return ctx.coupleId; }      // 业务里"房间"= coupleId
function getRole() { return ctx.role; }
function getPeer() { return peerRole(ctx.role); }
function getOpenid() { return ctx.openid; }
function isSetup() { return !!(ctx.openid && ctx.coupleId && ctx.role); }

/** 进入空间后开始心跳（写自己的 presence，12s 一次） */
function join() {
  if (!isSetup()) return;
  const base = `members/${ctx.role}`;
  Store.update(base, { online: true, lastSeen: Store.now(), openid: ctx.openid });
  Store.onDisconnectSet(base, { online: false, lastSeen: Store.now() });
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    Store.update(base, { online: true, lastSeen: Store.now(), openid: ctx.openid });
  }, HEARTBEAT_MS);
}

/** 离开（停心跳 + 置 offline） */
function leave() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  if (ctx.role) Store.update(`members/${ctx.role}`, { online: false, lastSeen: Store.now() });
  Store.clearRoom();
}

/** 订阅对方在线状态，cb(presence|null) */
function onPeerPresence(cb) {
  if (!isSetup()) return () => {};
  return Store.onValue(`members/${getPeer()}`, cb);
}

function isOnline(p) {
  if (!p || p.online === false) return false;
  return (Store.now() - (p.lastSeen || 0)) < ONLINE_TIMEOUT;
}

module.exports = {
  setUserContext, clearUserContext,
  getRoom, getRole, getPeer, getOpenid, isSetup,
  join, leave, onPeerPresence, isOnline
};
