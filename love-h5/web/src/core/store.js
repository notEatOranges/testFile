// store.js —— kv 实时数据层（1:1 移植原小程序 utils/store.js 对外契约）
// 契约：onValue / onList / getOnce / getPrefix / set / update / push / remove / transaction / setRoom
// 行为对齐：ts 拒旧防乱序、断线重连回补、路径前缀相交回调、push key 格式 k_*
import { get, post } from './request'
import * as ws from './ws'

const caches = new Map()      // path -> { value, ts }
const subs = new Map()        // path -> Set<cb(value)>
let room = null               // coupleId

export function setRoom(r) {
  if (room === r) return
  // 切房清空全部缓存与订阅（旧房间数据不许串进来）
  caches.clear()
  for (const p of [...subs.keys()]) {
    subs.delete(p)
    ws.unsub(p)
  }
  room = r
}

export function getRoom() { return room }

// ── 订阅 ──

export function onValue(path, cb) {
  const set = subs.get(path) || new Set()
  set.add(cb)
  subs.set(path, set)
  ws.sub(path)
  // 立即回读一次（有缓存用缓存，无缓存拉一次）
  const c = caches.get(path)
  if (c) cb(c.value)
  else refresh(path)
  return () => {
    set.delete(cb)
    if (set.size === 0) {
      subs.delete(path)
      ws.unsub(path)
    }
  }
}

// value 对象转数组 [{id, ...v}] 按 ts 升序（与原 onList 一致）
export function onList(path, cb) {
  return onValue(path, (value) => cb(toList(value)))
}

function toList(value) {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value)
    .map(([id, v]) => ({ id, ...(v && typeof v === 'object' ? v : { value: v }) }))
    .sort((a, b) => (a.ts || 0) - (b.ts || 0))
}

// ── 读 ──

export async function getOnce(path) {
  try {
    const res = await get(`/api/kv?path=${encodeURIComponent(path)}`)
    apply(path, res.value, res.ts || 0)
    return res.value
  } catch (e) {
    console.warn('[kv:getOnce]', path, e.message)
    return caches.get(path)?.value ?? null
  }
}

export async function getPrefix(prefix) {
  try {
    const res = await get(`/api/kv/prefix?path=${encodeURIComponent(prefix)}`)
    const out = {}
    for (const [suffix, value] of Object.entries(res.items || {})) {
      apply(prefix + suffix, value, caches.get(prefix + suffix)?.ts ?? 0)
      out[suffix] = value
    }
    return out
  } catch (e) {
    console.warn('[kv:getPrefix]', prefix, e.message)
    return {}
  }
}

// ── 写 ──

export async function set(path, value) {
  const res = await post('/api/kv', { action: 'set', path, value })
  apply(path, value ?? null, res.ts)
  return res.ts
}

export async function update(path, partial) {
  const res = await post('/api/kv', { action: 'update', path, partial })
  // update 是服务端浅合并，本地刷新拿最终结果（WS 广播也会推一次，ts 相同幂等）
  refresh(path)
  return res.ts
}

let seq = 0
export async function push(path, val) {
  const key = `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const res = await post('/api/kv', { action: 'push', path, key, val })
  refresh(path)
  return { key, ts: res.ts, seq: ++seq }
}

export async function remove(path) {
  const res = await post('/api/kv', { action: 'remove', path })
  apply(path, null, res.ts || Date.now())
  return res
}

// 读-改-写（非原子，与原实现一致；并发极低场景够用）
export async function transaction(path, updater) {
  const cur = await getOnce(path)
  const next = updater(cur === null || cur === undefined ? null : JSON.parse(JSON.stringify(cur)))
  await set(path, next)
  return next
}

// ── 内部 ──

function apply(path, value, ts) {
  const c = caches.get(path)
  // ts 拒旧（与原 store.js 一致）：旧推送直接丢弃
  if (c && c.ts != null && ts != null && ts < c.ts) return
  caches.set(path, { value, ts })
  notify(path, value)
}

async function refresh(path) {
  try {
    const res = await get(`/api/kv?path=${encodeURIComponent(path)}`)
    apply(path, res.value, res.ts || 0)
  } catch { /* 静默 */ }
}

function notify(path, value) {
  const set = subs.get(path)
  if (set) set.forEach((cb) => cb(value))
}

// WS kv 推送入口（App.vue 里接线一次）
export function handleKvEvent(msg) {
  apply(msg.path, msg.value === undefined ? null : msg.value, msg.ts || 0)
}

// 断线重连后的回补：所有有订阅者的路径各拉一次
export function resyncAll() {
  for (const p of subs.keys()) refresh(p)
}
