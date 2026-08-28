<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../core/auth'
import { getToken } from '../core/request'
import { showToast } from 'vant'
import IconHeart from '~icons/lucide/heart'
import IconLink from '~icons/lucide/link'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const code = (route.query.code || '').toString().toUpperCase()
const busy = ref(false)
const state = ref('') // '' | 'joined' | 'full'

onMounted(() => {
  if (getToken()) auth.load().then(() => {
    if (auth.isPaired) state.value = 'joined'
  })
})

async function joinNow() {
  busy.value = true
  try {
    await auth.joinCouple(code)
    showToast('已加入空间，欢迎回家')
    router.replace('/home')
  } catch (e) {
    showToast(e.message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page">
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 28px calc(60px + var(--sa-bottom)); padding-top: var(--sa-top)">
      <div class="hero2">
        <div class="duoicon">
          <span class="lg l1"><IconHeart style="width: 28px; height: 28px" /></span>
          <span class="lg l2"><IconLink style="width: 26px; height: 26px" /></span>
        </div>
        <h2>ta 邀请你来到小窝</h2>
        <p v-if="code">邀请码 <b class="code">{{ code }}</b></p>
        <p v-else class="err">邀请链接不完整，请让 ta 重新发一次</p>
      </div>

      <template v-if="!getToken()">
        <button class="btn" @click="router.push({ path: '/register', query: { code } })">注册并加入</button>
        <button class="btn ghost" style="margin-top: 10px" @click="router.push('/login')">已有账号，去登录</button>
      </template>
      <template v-else-if="state === 'joined'">
        <div class="card" style="text-align: center">你已经在空间里啦</div>
        <button class="btn" style="margin-top: 14px" @click="router.replace('/home')">回小窝</button>
      </template>
      <template v-else>
        <button class="btn" :class="{ dis: busy || !code }" @click="joinNow">{{ busy ? '加入中…' : '立即加入' }}</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.hero2 { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 26px; text-align: center; }
.duoicon { position: relative; width: 96px; height: 72px; }
.lg { position: absolute; width: 60px; height: 60px; border-radius: 22px; display: flex; align-items: center; justify-content: center; color: #fff; }
.l1 { left: 0; top: 0; background: linear-gradient(135deg, var(--primary), var(--primary-deep)); transform: rotate(-8deg); }
.l2 { right: 0; bottom: 0; background: linear-gradient(135deg, var(--accent), var(--primary)); transform: rotate(8deg); }
.hero2 h2 { font-size: 20px; font-weight: 800; }
.hero2 p { font-size: 13px; color: var(--text-soft); }
.code { font-size: 20px; font-weight: 800; letter-spacing: 6px; color: var(--primary-deep); }
.err { color: var(--danger); }
</style>
