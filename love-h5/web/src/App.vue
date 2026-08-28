<script setup>
// App 壳：全局只接线一次 WS 事件 → store / presence / 未读徽标 / 站内通知
import { onMounted } from 'vue'
import { useAuth } from './core/auth'
import { useChatBadge } from './core/chatBadge'
import * as ws from './core/ws'
import * as store from './core/store'
import { getToken } from './core/request'
import { showToast } from 'vant'

const auth = useAuth()
const badge = useChatBadge()

onMounted(async () => {
  ws.on('kv', store.handleKvEvent)
  ws.on('_open', () => store.resyncAll())
  ws.on('presence', (msg) => {
    if (!auth.user) return
    if (msg.role === auth.peerRole) auth.peerOnline = !!msg.online
  })
  ws.on('notify', (m) => {
    navigator.vibrate && navigator.vibrate(20)
    showToast(`${m.title}：${m.body}`)
  })
  if (getToken()) {
    await auth.load()
    ws.connect()
    const peer = auth.peer
    if (peer) auth.peerOnline = !!peer.online
    // 全局订阅聊天列表，随时维护未读角标（聊天页内会 markSeen 清零）
    if (auth.isPaired) {
      store.onList('chat', (l) => badge.sync(l, auth.user.role))
    }
  }
})
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>
