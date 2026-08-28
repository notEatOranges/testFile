<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../core/auth'
import { showToast } from 'vant'
import IconHeart from '~icons/lucide/heart'
import IconUser from '~icons/lucide/user'
import IconShield from '~icons/lucide/shield-check'

const router = useRouter()
const auth = useAuth()
const username = ref('')
const password = ref('')
const busy = ref(false)

async function submit() {
  if (!username.value || !password.value) return showToast('请输入账号和密码')
  busy.value = true
  try {
    await auth.login({ username: username.value.trim(), password: password.value })
    showToast('欢迎回来')
    router.replace(auth.isPaired ? '/home' : '/space')
  } catch (e) {
    showToast(e.message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page">
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 28px calc(40px + var(--sa-bottom)); padding-top: var(--sa-top)">
      <div class="brandwrap">
        <div class="logo"><IconHeart style="width: 42px; height: 42px" /></div>
        <h1>小窝</h1>
        <p>OUR LITTLE NEST · 只属于你俩</p>
      </div>
      <div class="form">
        <div class="fld">
          <IconUser class="fldicon" />
          <input v-model="username" placeholder="账号" autocomplete="username" @keyup.enter="submit">
        </div>
        <div class="fld">
          <IconShield class="fldicon" />
          <input v-model="password" type="password" placeholder="密码" autocomplete="current-password" @keyup.enter="submit">
        </div>
        <button class="btn" :class="{ dis: busy }" @click="submit">{{ busy ? '登录中…' : '登 录' }}</button>
      </div>
      <div class="aux">
        <span>为 ta 而建 · love-h5 v1.0</span>
        <span>没有账号？<router-link class="lnk" to="/register">注册 →</router-link></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.brandwrap { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 40px; }
.logo {
  width: 84px; height: 84px; border-radius: 28px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  color: #fff; box-shadow: var(--shadow-pop);
}
h1 { font-size: 26px; font-weight: 800; }
.brandwrap p { font-size: 12px; color: var(--text-soft); letter-spacing: 2px; }
.fldicon { width: 18px; height: 18px; color: var(--text-soft); flex: none; }
.aux { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-soft); margin-top: 16px; }
.lnk { color: var(--primary-deep); font-weight: 600; text-decoration: none; }
</style>
