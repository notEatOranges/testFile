<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import NavBar from '../components/NavBar.vue'
import Avatar from '../components/Avatar.vue'
import IconHeart from '~icons/lucide/heart'

const auth = useAuth()
const days = ref([]) // [[date, {boy:{...}, girl:{...}}], ...] 日期倒序

onMounted(async () => {
  const m = await store.getPrefix('mood/')
  days.value = Object.entries(m).filter(([, v]) => v && typeof v === 'object').sort((a, b) => b[0].localeCompare(a[0]))
})
</script>

<template>
  <div class="page">
    <NavBar title="历史心情" back />
    <div class="body" :style="{ paddingBottom: 'calc(40px + var(--sa-bottom))' }">
      <div v-if="!days.length" class="emptybox">
        <IconHeart />
        <span>还没有心情记录，回首页记下第一条吧</span>
      </div>
      <div v-for="[date, v] in days" :key="date" class="dayblock">
        <div class="daytitle">{{ date.replaceAll('-', '.') }}</div>
        <div class="duo">
          <div class="mcard" :class="{ withbg: v[auth.user.role]?.bg }" :style="v[auth.user.role]?.bg ? { background: `linear-gradient(160deg, rgba(0,0,0,.2), rgba(0,0,0,.45)), url(${v[auth.user.role].bg}) center/cover` } : {}">
            <div class="who"><Avatar :size="18" :name="auth.displayName" :avatar="auth.user.avatar" />{{ auth.displayName }}</div>
            <template v-if="v[auth.user.role]">
              <div class="emo">{{ v[auth.user.role].emoji || '—' }}</div>
              <div class="tag" v-if="v[auth.user.role].label">{{ v[auth.user.role].label }}</div>
              <div class="whi" v-if="v[auth.user.role].whisper">{{ v[auth.user.role].whisper }}</div>
            </template>
            <div v-else class="miss">没记</div>
          </div>
          <div class="mcard peer" :class="{ withbg: v[auth.peerRole]?.bg }" :style="v[auth.peerRole]?.bg ? { background: `linear-gradient(160deg, rgba(0,0,0,.2), rgba(0,0,0,.45)), url(${v[auth.peerRole].bg}) center/cover` } : {}">
            <div class="who"><Avatar :size="18" :name="auth.peerName" :avatar="auth.peer?.avatar" />{{ auth.peerName }}</div>
            <template v-if="v[auth.peerRole]">
              <div class="emo">{{ v[auth.peerRole].emoji || '—' }}</div>
              <div class="tag" v-if="v[auth.peerRole].label">{{ v[auth.peerRole].label }}</div>
              <div class="whi" v-if="v[auth.peerRole].whisper">{{ v[auth.peerRole].whisper }}</div>
            </template>
            <div v-else class="miss">没记</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dayblock { margin-bottom: 18px; }
.daytitle { font-size: 12px; font-weight: 600; color: var(--text-soft); margin: 0 2px 8px; }
.duo { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mcard { border-radius: var(--r-card); padding: 13px; min-height: 120px; background: linear-gradient(160deg, var(--primary), var(--primary-deep)); color: #fff; box-shadow: var(--shadow-soft); display: flex; flex-direction: column; }
.mcard.peer { background: var(--card); color: var(--text); }
.mcard .who { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; }
.mcard .emo { font-size: 28px; margin: auto 0 2px; }
.mcard .tag { font-size: 12px; font-weight: 700; }
.mcard .whi { font-size: 11px; opacity: .85; margin-top: 3px; }
.miss { margin: auto 0; font-size: 11px; opacity: .6; }
</style>
