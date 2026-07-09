/* ============================================================
   数据抽象层 Store —— 整个实时能力的核心
   - Supabase 模式（配置后）：Postgres + Realtime，跨手机异地实时（MemFire 兼容）
   - 本地模式（未配置）：内存树 + localStorage + BroadcastChannel，同浏览器多 tab 预览
   对外语义统一：path 都是「相对房间根」的路径（如 'chat'、'games/catfish/g1'）。
   Supabase 用一张通用 kv 表 {room,path,value(jsonb),ts}，每个 path 一行，
   把路径树扁平化成 KV —— 功能代码与本地模式完全一致。

   写操作的并发安全：
   - push / update 走 Postgres 原子函数（push_kv / merge_kv，见 SETUP.md），
     避免两人同时发消息时「读-改-写」覆盖丢数据。
   - set / remove 走 upsert / delete。
   - transaction 为客户端读改写（仅用于低并发场景）。
   ============================================================ */

import { isConfigured, supabaseConfig, SUPABASE_SDK, KV_TABLE } from "../config/supabase-config.js";
import { uid } from "./utils.js";

let mode = "local";        // 'supabase' | 'local'
let code = "";             // 当前房间号
let sb = null;             // { client }

export const Store = {
  get mode() { return mode; },
  get roomCode() { return code; },

  /** 初始化：配置了后端则动态加载 SDK，否则本地预览 */
  async init() {
    if (isConfigured()) {
      try {
        const mod = await import(/* @vite-ignore */ SUPABASE_SDK);
        const client = mod.createClient(supabaseConfig.url, supabaseConfig.anonKey, {
          realtime: { params: { eventsPerSecond: 20 } },
        });
        sb = { client };
        mode = "supabase";
        console.log("[love-h5] 已连接 Supabase 实时数据库");
      } catch (e) {
        console.warn("[love-h5] Supabase 初始化失败，降级到本地预览模式:", e);
        mode = "local";
      }
    } else {
      console.log("[love-h5] 未配置后端，使用本地预览模式（同浏览器多 tab 模拟双人）");
    }
    localTree = loadTree();
    return mode;
  },

  setRoom(c) { code = c; if (mode === "local") localTree = loadTree(); },
  clearRoom() { code = ""; },

  /* —— 订阅 —— */
  onValue(path, cb) { return mode === "supabase" ? sbOnValue(path, cb) : localOnValue(path, cb); },
  onList(path, cb) { return this.onValue(path, snap => cb(toList(snap))); },

  /* —— 写 —— */
  async set(path, val) {
    if (mode === "supabase") return sbSet(path, val ?? null);
    localWrite(path, val ?? null);
  },
  async update(path, partial) {
    if (mode === "supabase") return sb.client.rpc("merge_kv", { p_room: code, p_path: path, p_val: partial });
    localWrite(path, { ...(getPath(path) || {}), ...partial });
  },
  async push(path, val) {
    if (mode === "supabase") {
      const id = uid("k");
      await sb.client.rpc("push_kv", { p_room: code, p_path: path, p_key: id, p_val: val });
      return id;
    }
    const list = getPath(path) || {};
    const id = uid("k");
    list[id] = val;
    localWrite(path, list);
    return id;
  },
  async remove(path) {
    if (mode === "supabase") return sbRemove(path);
    localWrite(path, null);
  },
  async transaction(path, updater) {
    if (mode === "supabase") {
      const cur = await sbGet(path);
      return sbSet(path, updater(cur ?? null));
    }
    localWrite(path, updater(clone(getPath(path) ?? null)));
  },

  /* —— 联机生命周期（移动端 beforeunload 不可靠，主要靠 room.js 心跳兜底）—— */
  onDisconnectSet(path, val) {
    const v = val ?? null;
    if (mode === "supabase") localOnDisconnect(path, () => sbSet(path, v));
    else localOnDisconnect(path, () => localWrite(path, v));
  },
  onDisconnectRemove(path) {
    if (mode === "supabase") localOnDisconnect(path, () => sbRemove(path));
    else localOnDisconnect(path, () => localWrite(path, null));
  },
  goOffline() { flushLocalDisconnects(); },

  now() { return Date.now(); },
};

/* ====================== 工具 ====================== */
function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
function toList(obj) {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj)
    .map(([id, v]) => ({ id, ...(v || {}) }))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

/* ====================== Supabase 实现 ====================== */
async function sbGet(path) {
  const { data } = await sb.client.from(KV_TABLE)
    .select("value").eq("room", code).eq("path", path).maybeSingle();
  return data ? data.value : null;
}
async function sbSet(path, value) {
  await sb.client.from(KV_TABLE)
    .upsert({ room: code, path, value, ts: Date.now() }, { onConflict: "room,path" });
}
async function sbRemove(path) {
  await sb.client.from(KV_TABLE).delete().eq("room", code).eq("path", path);
}
function sbOnValue(path, cb) {
  const filter = `room=eq.${code},path=eq.${path}`;
  const ch = sb.client.channel(`kv:${code}:${path}`)
    .on("postgres_changes", { event: "*", schema: "public", table: KV_TABLE, filter }, payload => {
      cb(payload.eventType === "DELETE" ? null : (payload.new?.value ?? null));
    })
    .subscribe();
  sbGet(path).then(v => cb(v));   // 立即回读当前值
  return () => { try { sb.client.removeChannel(ch); } catch {} };
}

/* ====================== 本地实现：内存树（与后端无关，预览用） ====================== */
let localTree = {};
const localCbs = new Map();
const localDisconnects = [];
let persistTimer = null;
const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("love-h5") : null;

function loadTree() {
  try { return JSON.parse(localStorage.getItem("lh5:tree") || "{}"); }
  catch { return {}; }
}
function persist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try { localStorage.setItem("lh5:tree", JSON.stringify(localTree)); } catch {}
  }, 150);
}
function getPath(path) {
  if (!path) return localTree;
  return path.split("/").reduce((o, k) => (o == null ? undefined : o[k]), localTree);
}
function setPath(path, val) {
  if (!path) { localTree = val ?? {}; return; }
  const ks = path.split("/");
  let o = localTree;
  for (let i = 0; i < ks.length - 1; i++) {
    if (typeof o[ks[i]] !== "object" || o[ks[i]] === null) o[ks[i]] = {};
    o = o[ks[i]];
  }
  o[ks[ks.length - 1]] = val ?? null;
}
function localNotify(path) {
  for (const [p, cbs] of localCbs) {
    if (path === p || path.startsWith(p + "/") || p.startsWith(path + "/")) {
      const v = clone(getPath(p));
      cbs.forEach(cb => cb(v));
    }
  }
}
function localWrite(path, newVal) {
  setPath(path, newVal);
  localNotify(path);
  persist();
  if (bc) bc.postMessage({ t: "set", path, val: clone(newVal) });
}
function localOnValue(path, cb) {
  let set = localCbs.get(path);
  if (!set) { set = new Set(); localCbs.set(path, set); }
  set.add(cb);
  cb(clone(getPath(path)));
  return () => set.delete(cb);
}
function localOnDisconnect(path, fn) { localDisconnects.push({ path, fn }); }
function flushLocalDisconnects() { while (localDisconnects.length) localDisconnects.pop().fn(); }

if (bc) {
  bc.onmessage = e => {
    if (e.data && e.data.t === "set") {
      setPath(e.data.path, e.data.val ?? null);
      localNotify(e.data.path);
    }
  };
}
window.addEventListener("storage", e => {   // 跨 tab 兜底
  if (e.key === "lh5:tree" && e.newValue) {
    try { localTree = JSON.parse(e.newValue); } catch {}
    for (const [p, cbs] of localCbs) {
      const v = clone(getPath(p));
      cbs.forEach(cb => cb(v));
    }
  }
});
window.addEventListener("beforeunload", flushLocalDisconnects);
window.addEventListener("pagehide", flushLocalDisconnects);
