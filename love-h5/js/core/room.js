/* ============================================================
   房间号 + 身份机制
   首次进入：输房间号 → 选男/女身份 → enter()
   之后记忆在 localStorage。在线靠心跳 + onDisconnect + lastSeen 超时判断。
   ============================================================ */

import { Store } from "./store.js";
import { peerRole } from "./utils.js";

const ROOM_KEY = "lh5_room";
const ROLE_KEY = "lh5_role";
const HEARTBEAT_MS = 12000;
const ONLINE_TIMEOUT = 30000;

let heartbeatTimer = null;

export function getRoom() { return localStorage.getItem(ROOM_KEY); }
export function getRole() { return localStorage.getItem(ROLE_KEY); }
export function getPeer() { return peerRole(getRole()); }
export function isSetup() { return !!(getRoom() && getRole()); }
export function clearSetup() { localStorage.removeItem(ROOM_KEY); localStorage.removeItem(ROLE_KEY); }

/** 进入房间：写在线标记 + 注册断线清理 + 启动心跳 */
export async function enter(room, role) {
  localStorage.setItem(ROOM_KEY, room);
  localStorage.setItem(ROLE_KEY, role);
  Store.setRoom(room);

  const base = `members/${role}`;
  await Store.update(base, { online: true, lastSeen: Store.now(), joinedAt: Store.now() });
  Store.onDisconnectSet(`${base}/online`, false);
  Store.onDisconnectSet(`${base}/lastSeen`, Store.now());

  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    Store.update(base, { online: true, lastSeen: Store.now() });
  }, HEARTBEAT_MS);
}

/** 主动离开（切换房间/退出） */
export function leave() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  const role = getRole();
  if (role) Store.update(`members/${role}`, { online: false, lastSeen: Store.now() });
  Store.clearRoom();
}

/** 订阅对方在线状态，cb(presence | null) */
export function onPeerPresence(cb) {
  return Store.onValue(`members/${getPeer()}`, cb);
}

/** 根据 presence 判断是否在线（兼容心跳超时） */
export function isOnline(p) {
  if (!p || p.online === false) return false;
  return (Store.now() - (p.lastSeen || 0)) < ONLINE_TIMEOUT;
}
