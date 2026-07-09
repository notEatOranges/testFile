/* ============================================================
   联机协议层 —— sync.js
   职责：把游戏状态映射到 store 路径，屏蔽 store 细节。
   路径根：games/catfish/{gameId}

   - 自己每帧更新本地位置；节流（~12fps）广播到 players/{role}
   - 对方位置 onValue 订阅，引擎本地 lerp 插值平滑（不直接用远端值）
   - 鱼：共享态。抢鱼用 transaction(fish/{id}/claimedBy, cur=>cur===null?role:cur)，
     事务后若 claimedBy===myRole 才加分 —— 杜绝双端同吃。
   - 游戏生命周期：status(waiting/playing/ended)、config、turn 由房主（boy）推进，
     双方都订阅 status 以同步状态机。
   ============================================================ */

import { Store } from "../../core/store.js";
import { getRole, getPeer } from "../../core/room.js";
import { throttle, uid } from "../../core/utils.js";

const GROOT = "games/catfish";

let gameId = null;       // 当前局 id
let myRole = null;
let peer = null;
let unsubs = [];        // 所有 onValue 订阅，离开时统一 off

export function gamePath(sub = "") { return sub ? `${GROOT}/${gameId}/${sub}` : `${GROOT}/${gameId}`; }

/** 开局：拿一个 gameId。latest 指针存当前 gameId，谁进入都读它。
   如果没有（没人开过），自己建一个。 */
export async function ensureGame() {
  myRole = getRole();
  peer = getPeer();
  const cur = await readLatest();
  if (cur && cur.id) {
    gameId = cur.id;
  } else {
    gameId = uid("g");
    await Store.set(`${GROOT}/latest`, { id: gameId, ts: Store.now() });
  }
  return gameId;
}

function readLatest() {
  return new Promise(resolve => {
    const off = Store.onValue(`${GROOT}/latest`, v => { off(); resolve(v); });
  });
}

/** 写自己初始玩家状态 + 注册断线清理 */
export async function joinGame(mode) {
  const base = `players/${myRole}`;
  await Store.update(gamePath(), { status: "waiting", mode, ts: Store.now() });
  await Store.update(gamePath(base), {
    x: 0.5, y: 0.5,         // 归一化坐标 0~1
    ready: true,
    role: myRole,
    ts: Store.now(),
  });
  Store.onDisconnectSet(gamePath(base), null);
}

/** 订阅对方玩家 + 游戏 meta + 鱼群 */
export function subscribeRemote(handlers) {
  // 对方位置
  unsubs.push(Store.onValue(gamePath(`players/${peer}`), p => handlers.onPeer?.(p)));
  // 游戏 meta（status/mode/config/turn/scores.shared）
  unsubs.push(Store.onValue(gamePath(), g => handlers.onGame?.(g)));
  // 鱼群（每条鱼一行的对象，key=fishId）
  unsubs.push(Store.onValue(gamePath("fish"), f => handlers.onFish?.(f)));
}

/** 节流广播自己位置（~12fps，按 ADR-? 防 Supabase QPS 限制） */
const sendPos = throttle((x, y) => {
  Store.update(gamePath(`players/${myRole}`), { x, y, ts: Store.now() });
}, 80);   // 80ms ≈ 12.5fps
export function broadcastPos(x, y) { sendPos(x, y); }

/** 立即发一次（状态切换时用） */
export async function sendPosNow(x, y) {
  await Store.update(gamePath(`players/${myRole}`), { x, y, ts: Store.now() });
}

/** 设置游戏状态（房主 boy 推进，但任何写入都 upsert，无依赖） */
export async function setStatus(status) {
  await Store.update(gamePath(), { status, ts: Store.now() });
}
export async function setConfig(config) {
  await Store.update(gamePath("config"), { ...config, ts: Store.now() });
}
export async function setTurn(turn) {
  await Store.update(gamePath("turn"), { ...turn, ts: Store.now() });
}
export async function bumpTurnSwitches() {
  await Store.transaction(gamePath(), cur => ({
    ...cur,
    turnSwitches: (cur?.turnSwitches || 0) + 1,
  }));
}

/** 生成一条鱼 */
export async function spawnFish(fish) {
  const id = uid("f");
  await Store.update(gamePath("fish"), { [id]: { ...fish, claimedBy: null, ts: Store.now() } });
  return id;
}

/**
 * 原子抢鱼：transaction(fish/{id}/claimedBy, cur=>cur===null?role:cur)
 * 返回 claimedBy 最终值；若 === myRole 才算抢到 → 调用方加分。
 * 注意：store.js 的 transaction 在云端是客户端读改写
 * （低并发场景：鱼被两人同时抢的概率小且短时窗口窄），功能层先走通。
 * 真正原子保证依赖 store 后端实现（见 SETUP.md push_kv/merge_kv）。
 */
export async function claimFish(fishId) {
  let result = null;
  await Store.transaction(gamePath(`fish/${fishId}`), cur => {
    const claimed = (cur && cur.claimedBy) || null;
    if (claimed === null) {
      result = myRole;
      return { ...(cur || {}), claimedBy: myRole, claimedTs: Store.now() };
    }
    result = claimed;     // 已被对方抢了
    return cur;
  });
  return result;
}

/** 移除被吃的鱼（加分后） */
export async function removeFish(fishId) {
  await Store.transaction(gamePath("fish"), cur => {
    if (!cur) return cur;
    if (cur[fishId]) delete cur[fishId];
    return cur;
  });
}

/** 加分：各模式写不同 scorePath */
export async function addScore(scorePath) {
  await Store.transaction(gamePath("scores"), cur => ({
    ...(cur || {}),
    [scorePath]: ((cur && cur[scorePath]) || 0) + 1,
  }));
}

/** 离开：清理本端玩家 + 若都没人了归零 game */
export async function leaveGame() {
  unsubs.forEach(off => { try { off(); } catch {} });
  unsubs = [];
  Store.goOffline();   // 触发 onDisconnectSet 的清理（置空本端 player）
  // 直接触发本地清理兜底（云端 goOffline 在 store 里已 wired）
  try { await Store.update(gamePath(`players/${myRole}`), null); } catch {}
}
