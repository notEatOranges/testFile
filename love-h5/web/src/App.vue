<script setup>
// App 壳：全局只接线一次 WS 事件 → store / presence
import { onMounted } from 'vue'
import { useAuth } from './core/auth'
import * as ws from './core/ws'
import * as store from './core/store'
import { getToken } from './core/request'

const auth = useAuth()

onMounted(async () => {
  ws.on('kv', store.handleKvEvent)
  ws.on('_open', () => store.resyncAll())
  ws.on('presence', (msg) => {
    if (!auth.user) return
    if (msg.role === auth.peerRole) auth.peerOnline = !!msg.online
  })
  if (getToken()) {
    await auth.load()
    ws.connect()
    // 初始在线状态以 REST 快照为准，之后由 WS presence 事件驱动
    const peer = auth.peer
    if (peer) auth.peerOnline = !!peer.online
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
