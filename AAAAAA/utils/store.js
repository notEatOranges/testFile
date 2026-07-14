// store.js —— 实时数据抽象层（云开发适配版）
// 移植自 love-h5/js/core/store.js，保留全部对外契约（业务代码 room.js / 页面 零改动），
// 只把内部 Supabase 分支换成微信云开发：
//   - kv collection（文档 {room,path,value,ts}）替代 Postgres kv 表
//   - collection().watch() 实时推送替代 Supabase Realtime postgres_changes
//   - callFunction('kvWrite') 原子写替代 rpc(merge_kv/push_kv)
// 本地降级模式（BroadcastChannel/storage 事件）整块删除：小程序无此能力，且单实例无需多 tab。
const { uid } = require('./util.js');

const KV = 'kv';
let db = null;
let code = '';                  // 当前房间号

/* —— 全局「读取中」计数：订阅首次读取 +1/-1，用于进入页面显示 loading —— */
let loadingCount = 0;
const loadingCbs = new Set();
function bumpLoading(d) {
  loadingCount = Math.max(0, loadingCount + d);
  const on = loadingCount > 0;
  loadingCbs.forEach(cb => cb(on));
}
function onLoadingChange(cb) { loadingCbs.add(cb); cb(loadingCount > 0); return () => loadingCbs.delete(cb); }

/* —— 订阅表：path → { cbs:Set, watcher }；缓存 path→value 减少重复 get —— */
const subs = new Map();
const cache = new Map();

/* —— 断线回调（小程序无 beforeunload，由 App.onUnload / 页面 onHide 触发 flush）—— */
const disconnects = [];

function getDB() { if (!db) db = wx.cloud.database(); return db; }

async function callWrite(action, payload) {
  const res = await wx.cloud.callFunction({ name: 'kvWrite', data: { action, room: code, ...payload } });
  return res.result;
}

/** 写完后对路径相交的订阅重新拉取并回调，保证「自己写自己立刻可见」（不依赖 watch 回环） */
function emit(writtenPath) {
  for (const [p, s] of subs) {
    if (writtenPath === p || writtenPath.startsWith(p + '/') || p.startsWith(writtenPath + '/')) {
      kvGet(p).then(v => s.cbs.forEach(cb => cb(v))).catch(() => {});
    }
  }
}

async function kvGet(path) {
  const res = await getDB().collection(KV).where({ room: code, path }).limit(1).get();
  const v = res.data.length ? res.data[0].value : null;
  cache.set(path, v);
  return v;
}

/* —— watch 断线自动重连 —— */
const FATAL_TOLERANCE = 12;   // 连续重连上限，超过则放弃（避免无限轮询）

function clearRetry(s) {
  if (s.retryTimer) { clearTimeout(s.retryTimer); s.retryTimer = null; }
}

// 建实时监听（抽出独立函数，便于 onError 后重建）
function buildWatcher(s, path) {
  try {
    s.watcher = getDB().collection(KV).where({ room: code, path }).watch({
      onChange(snap) {
        s.retryCount = 0;                       // 收到快照=链路健康，重置退避计数
        const v = snap.docs.length ? snap.docs[0].value : null;
        cache.set(path, v);
        s.cbs.forEach(fn => fn(v));
      },
      onError(err) {
        console.warn('[store] watch err', path, err);
        scheduleReconnect(s, path);
      }
    });
  } catch (e) {
    console.warn('[store] watch 建立失败', path, e);
    scheduleReconnect(s, path);
  }
}

// 指数退避重连：1s→2s→4s…上限 30s；重建前先 kvGet 回补断线期间漏掉的写入
function scheduleReconnect(s, path) {
  if (s.cbs.size === 0) return;                 // 已无订阅者，不必重连
  if (s.retryCount >= FATAL_TOLERANCE) { console.warn('[store] 重连次数超限，放弃', path); return; }
  if (s.rebuilding) return;                      // 已在排队，去重
  s.rebuilding = true;
  const delay = Math.min(30000, 1000 * Math.pow(2, s.retryCount));
  s.retryCount++;
  clearRetry(s);
  s.retryTimer = setTimeout(() => {
    s.rebuilding = false;
    if (s.cbs.size === 0) return;               // 等待期间被退订
    if (s.watcher && s.watcher.close) { try { s.watcher.close(); } catch (e) {} }
    s.watcher = null;
    kvGet(path).then(v => s.cbs.forEach(fn => fn(v))).catch(() => {}); // 乐观回补
    buildWatcher(s, path);
  }, delay);
}

function kvOnValue(path, cb) {
  let s = subs.get(path);
  const isFirst = !s;
  if (!s) { s = { cbs: new Set(), watcher: null, rebuilding: false, retryTimer: null, retryCount: 0 }; subs.set(path, s); }
  s.cbs.add(cb);

  if (isFirst) {
    bumpLoading(1);
    // 立即回读当前值（进入页面即有数据，不等 watch 首次推送）
    kvGet(path).then(v => s.cbs.forEach(fn => fn(v))).finally(() => bumpLoading(-1));
    // 建实时监听，接管后续变化（断线由 buildWatcher→scheduleReconnect 自动重建）
    buildWatcher(s, path);
  } else if (cache.has(path)) {
    cb(cache.get(path));   // 复用已有 watcher，立即用缓存回调一次
  }
  return () => {
    s.cbs.delete(cb);
    if (s.cbs.size === 0) {
      clearRetry(s);
      if (s.watcher && s.watcher.close) { try { s.watcher.close(); } catch (e) {} }
      subs.delete(path);
    }
  };
}

function toList(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj)
    .map(([id, v]) => ({ id, ...(v || {}) }))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

const Store = {
  get mode() { return 'cloud'; },
  get roomCode() { return code; },

  async init() { getDB(); return 'cloud'; },

  /** 切房间：关闭所有旧 watcher（旧 watcher 锁定旧 room 的查询，不关会串数据） */
  setRoom(c) {
    for (const [, s] of subs) {
      clearRetry(s);
      if (s.watcher && s.watcher.close) { try { s.watcher.close(); } catch (e) {} }
    }
    subs.clear();
    cache.clear();
    code = c;
  },
  clearRoom() { code = ''; },

  onValue(path, cb) { return kvOnValue(path, cb); },
  onList(path, cb) { return this.onValue(path, snap => cb(toList(snap))); },
  async getOnce(path) { return kvGet(path); },

  /** 按路径前缀一次性拉取所有文档（非实时），返回 { 后缀: value }。
   *  用于历史类查询（如 getPrefix('mood/') → { '2026-07-15': {...} }）。
   *  分页拉取（每页 100），客户端单次 get 上限兼容。 */
  async getPrefix(prefix) {
    const database = getDB();
    const rx = database.RegExp({ regexp: '^' + String(prefix).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options: 'i' });
    const out = {};
    const STEP = 100;
    let skip = 0;
    for (let guard = 0; guard < 20; guard++) {
      const res = await database.collection(KV).where({ room: code, path: rx }).skip(skip).limit(STEP).get();
      if (!res.data || !res.data.length) break;
      for (const d of res.data) out[d.path.slice(prefix.length)] = d.value;
      if (res.data.length < STEP) break;
      skip += STEP;
    }
    return out;
  },

  async set(path, val) { await callWrite('set', { path, value: val ?? null }); emit(path); },
  async update(path, partial) { await callWrite('update', { path, partial }); emit(path); },
  async push(path, val) {
    const id = uid('k');
    await callWrite('push', { path, key: id, val });
    emit(path);
    return id;
  },
  async remove(path) { await callWrite('remove', { path }); emit(path); },
  async transaction(path, updater) {
    const cur = await kvGet(path);
    const next = updater(cur ?? null);
    await callWrite('set', { path, value: next ?? null });
    emit(path);
    return next;
  },

  onDisconnectSet(path, val) {
    const v = val ?? null;
    disconnects.push(() => callWrite('set', { path, value: v }));
  },
  onDisconnectRemove(path) {
    disconnects.push(() => callWrite('remove', { path }));
  },
  goOffline() { while (disconnects.length) disconnects.pop()(); },

  now() { return Date.now(); }
};

module.exports = { Store, onLoadingChange };
