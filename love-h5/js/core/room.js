/* ============================================================
   房间号 + 身份机制
   首次进入：输房间号 → 选男/女身份 → enter()
   之后记忆在 localStorage。在线靠心跳 + onDisconnect + lastSeen 超时判断。
   ============================================================ */

import { Store } from "./store.js";
import { peerRole, uid } from "./utils.js";

const ROOM_KEY = "lh5_room";
const ROLE_KEY = "lh5_role";
const SESSION_KEY = "lh5_session";          // 会话 id（sessionStorage：刷新保留、新标签页不同）
const HISTORY_KEY = "lh5_room_history";     // 历史房间记录（localStorage：长久保存）
const HEARTBEAT_MS = 12000;
const ONLINE_TIMEOUT = 30000;

let heartbeatTimer = null;

export function getRoom() { return localStorage.getItem(ROOM_KEY); }
export function getRole() { return localStorage.getItem(ROLE_KEY); }
export function getPeer() { return peerRole(getRole()); }
export function isSetup() { return !!(getRoom() && getRole()); }
export function clearSetup() { localStorage.removeItem(ROOM_KEY); localStorage.removeItem(ROLE_KEY); }

/** 本标签页的会话 id：刷新不变、换标签页/换设备不同。用于「自己刷新不被自己残留在线挡住」。 */
function sid() {
  let s = sessionStorage.getItem(SESSION_KEY);
  if (!s) { s = uid("s"); sessionStorage.setItem(SESSION_KEY, s); }
  return s;
}

/** 进入房间：先查该身份是否已被【别人】占用（满 2 人限制），再写在线标记 + 心跳。
 *  返回 true=成功，false=该身份已有人（调用方提示）。 */
export async function enter(room, role) {
  Store.setRoom(room);   // 先指向目标房间，members 路径才落对

  // 容量检查：该角色当前是否被「另一个会话」占用
  const me = await Store.getOnce(`members/${role}`);
  if (isOnline(me) && me.sid !== sid()) return false;

  localStorage.setItem(ROOM_KEY, room);
  localStorage.setItem(ROLE_KEY, role);

  const base = `members/${role}`;
  await Store.update(base, { online: true, lastSeen: Store.now(), joinedAt: Store.now(), sid: sid() });
  Store.onDisconnectSet(`${base}/online`, false);
  Store.onDisconnectSet(`${base}/lastSeen`, Store.now());

  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    Store.update(base, { online: true, lastSeen: Store.now(), sid: sid() });
  }, HEARTBEAT_MS);

  addRoomHistory(room, role);
  return true;
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

/* ====================== 历史房间记录（长久保存） ====================== */
/** [{room, role, ts}]，最新在前，按 room 去重，上限 10 */
export function getRoomHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
export function clearRoomHistory() { localStorage.removeItem(HISTORY_KEY); }
export function addRoomHistory(room, role) {
  const h = getRoomHistory().filter(x => x.room !== room);   // 去重
  h.unshift({ room, role, ts: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 10)));
}
/** 删除指定房间的一条历史 */
export function removeRoomHistory(room) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getRoomHistory().filter(x => x.room !== room)));
}
