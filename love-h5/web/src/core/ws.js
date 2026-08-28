// WebSocket 通道：连接即在线，断线指数退避重连（1s→30s），重连后回调 resync 钩子
import { getToken } from './request'

const listeners = {} // event -> Set<cb>
let sock = null
let opened = false
let backoff = 1000
let timer = null
let wantClose = false
const pendingSubs = new Set()

function emit(event, payload) {
  const set = listeners[event]
  if (set) set.forEach((cb) => cb(payload))
}

export function on(event, cb) {
  (listeners[event] ||= new Set()).add(cb)
  return () => listeners[event].delete(cb)
}

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws?token=${encodeURIComponent(getToken())}`
}

export function connect() {
  if (!getToken()) return
  wantClose = false
  clearTimeout(timer)
  try { sock && sock.close() } catch { /* ignore */ }
  sock = new WebSocket(wsUrl())

  sock.onopen = () => {
    opened = true
    backoff = 1000
    // 重连后恢复所有订阅（回补由 store.resyncAll 完成）
    pendingSubs.forEach((p) => rawSend({ op: 'sub', path: p }))
    emit('_open')
  }

  sock.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      if (msg.event) emit(msg.event, msg)
    } catch { /* ignore */ }
  }

  sock.onclose = () => {
    opened = false
    if (wantClose || !getToken()) return
    emit('_close')
    timer = setTimeout(connect, backoff)
    backoff = Math.min(backoff * 2, 30000)
  }

  sock.onerror = () => { try { sock.close() } catch { /* ignore */ } }
}

export function disconnect() {
  wantClose = true
  clearTimeout(timer)
  try { sock && sock.close() } catch { /* ignore */ }
  sock = null
  opened = false
}

export function isOpen() { return opened }

function rawSend(obj) {
  if (opened && sock && sock.readyState === 1) sock.send(JSON.stringify(obj))
}

export function sub(path) {
  pendingSubs.add(path)
  rawSend({ op: 'sub', path })
}

export function unsub(path) {
  pendingSubs.delete(path)
  rawSend({ op: 'unsub', path })
}
