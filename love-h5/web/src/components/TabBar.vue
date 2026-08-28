<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useChatBadge } from '../core/chatBadge'
import IconHome from '~icons/lucide/home'
import IconChat from '~icons/lucide/message-circle'
import IconGame from '~icons/lucide/gamepad-2'
import IconUser from '~icons/lucide/user'

const badge = useChatBadge()
const route = useRoute()
const router = useRouter()
const tabs = [
  { path: '/home', name: '小窝', icon: IconHome },
  { path: '/chat', name: '聊天', icon: IconChat },
  { path: '/games', name: '游戏', icon: IconGame },
  { path: '/me', name: '我的', icon: IconUser }
]
const active = () => route.meta.tab ?? -1
</script>

<template>
  <nav class="tabbar">
    <button
      v-for="(t, i) in tabs"
      :key="t.path"
      class="tab"
      :class="{ on: active() === i }"
      @click="router.push(t.path)"
    >
      <span v-if="i === 1 && badge.unread > 0" class="bdg">{{ badge.unread > 99 ? '99+' : badge.unread }}</span>
      <component :is="t.icon" />
      <span>{{ t.name }}</span>
    </button>
  </nav>
</template>
