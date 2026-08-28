<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import { copyText, inviteLink } from '../core/clip'
import { showToast } from 'vant'
import NavBar from '../components/NavBar.vue'
import Avatar from '../components/Avatar.vue'
import IconHeart from '~icons/lucide/heart'
import IconLink from '~icons/lucide/link'
import IconCopy from '~icons/lucide/copy'

const router = useRouter()
const auth = useAuth()

const mode = ref('menu') // menu | created | join
const inviteCode = ref('')
const joinCode = ref('')
const busy = ref(false)
let unwatch = null

async function doCreate() {
  busy.value = true
  try {
    const res = await auth.createCouple()
    inviteCode.value = res.inviteCode
    mode.value = 'created'
    waitPeer()
  } catch (e) {
    showToast(e.message)
  } finally {
    busy.value = false
  }
}

// 创建后等待对方加入：订阅 members/{peerRole}，出现即跳首页
function waitPeer() {
  const peerRole = auth.peerRole
  unwatch = store.onValue('members/' + peerRole, (v) => {
    if (v && v.joinedAt) {
      showToast(auth.peerName + ' 来啦')
      setTimeout(async () => {
        await auth.refresh()
        router.replace('/home')
      }, 800)
    }
  })
}

async function doJoin() {
  const code = joinCode.value.trim().toUpperCase()
  if (code.length < 4) return showToast('邀请码至少 4 位')
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

onUnmounted(() => { if (unwatch) unwatch() })
</script>

<template>
  <div class="page">
    <NavBar title="情侣空间" :back="mode !== 'created'" />
    <div class="body">
      <!-- 菜单：创建 / 加入 -->
      <template v-if="mode === 'menu'">
        <div class="hero2">
          <div class="duoicon">
            <span class="lg l1"><IconHeart style="width: 28px; height: 28px" /></span>
            <span class="lg l2"><IconLink style="width: 26px; height: 26px" /></span>
          </div>
          <h2>和 ta 建立一个二人世界</h2>
          <p>绑定后所有数据只属于你们两个人</p>
        </div>
        <button class="opt" @click="doCreate">
          <span class="iconwrap big"><IconHeart style="width: 20px; height: 20px" /></span>
          <span class="opttext"><b>创建我们的空间</b><span>你是第一人，拿到邀请链接去发给 ta</span></span>
        </button>
        <div class="orline">或者</div>
        <button class="opt" @click="mode = 'join'">
          <span class="iconwrap big"><IconLink style="width: 20px; height: 20px" /></span>
          <span class="opttext"><b>加入 ta 的空间</b><span>输入 6 位邀请码，或直接点 ta 发的链接</span></span>
        </button>
      </template>

      <!-- 创建成功：等对方 -->
      <template v-else-if="mode === 'created'">
        <div class="waitcard card">
          <div class="waithead"><Avatar :size="52" :name="auth.displayName" :avatar="auth.user && auth.user.avatar" /></div>
          <b class="waitt">把邀请码发给 ta</b>
          <div class="bigcode">{{ inviteCode }}</div>
          <div class="codeline">
            <button class="btn sm2 ghost" style="flex: 1" @click="copyText(inviteCode)">
              <IconCopy style="width: 15px; height: 15px" />复制邀请码
            </button>
            <button class="btn sm2 ghost" style="flex: 2" @click="copyText(inviteLink(inviteCode))">
              <IconLink style="width: 15px; height: 15px" />复制邀请链接
            </button>
          </div>
          <div class="waiting"><span class="spinner" />静静等 ta 加入…（对方加入后自动进入小窝）</div>
        </div>
        <button class="btn ghost" style="margin-top: 14px" @click="mode = 'menu'">返回</button>
      </template>

      <!-- 输码加入 -->
      <template v-else>
        <div class="card">
          <b style="font-size: 15px">输入邀请码</b>
          <div class="fld" style="margin-top: 12px">
            <input
              v-model="joinCode"
              class="codeinput"
              maxlength="6"
              placeholder="6 位字母数字"
              @keyup.enter="doJoin"
            >
          </div>
          <button class="btn sm2" style="margin-top: 14px; width: 100%" :class="{ dis: busy }" @click="doJoin">加入空间</button>
        </div>
        <button class="btn ghost" style="margin-top: 14px" @click="mode = 'menu'">返回</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.hero2 { display: flex; flex-direction: column; align-items: center; gap: 10px; margin: 26px 0 22px; text-align: center; }
.duoicon { position: relative; width: 96px; height: 72px; }
.lg { position: absolute; width: 60px; height: 60px; border-radius: 22px; display: flex; align-items: center; justify-content: center; color: #fff; }
.l1 { left: 0; top: 0; background: linear-gradient(135deg, var(--primary), var(--primary-deep)); transform: rotate(-8deg); }
.l2 { right: 0; bottom: 0; background: linear-gradient(135deg, var(--accent), var(--primary)); transform: rotate(8deg); }
.hero2 h2 { font-size: 20px; font-weight: 800; }
.hero2 p { font-size: 12px; color: var(--text-soft); }
.opt {
  display: flex; gap: 14px; align-items: center; width: 100%;
  background: var(--card); border-radius: 18px; padding: 16px;
  box-shadow: var(--shadow-soft); text-align: left;
}
.opt:active { transform: scale(.98); }
.iconwrap.big { width: 44px; height: 44px; border-radius: 14px; }
.iconwrap.big svg { width: 20px; height: 20px; }
.opttext { display: flex; flex-direction: column; gap: 2px; }
.opttext b { font-size: 15px; }
.opttext span { font-size: 12px; color: var(--text-soft); }
.orline { display: flex; align-items: center; gap: 12px; color: var(--text-soft); font-size: 11px; margin: 16px 0; }
.orline::before, .orline::after { content: ""; flex: 1; height: .5px; background: var(--border); }
.waitcard { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 26px 18px; text-align: center; }
.waitt { font-size: 15px; }
.bigcode { font-size: 44px; font-weight: 800; letter-spacing: 8px; color: var(--primary-deep); font-variant-numeric: tabular-nums; }
.codeline { display: flex; gap: 8px; width: 100%; }
.waiting { font-size: 11px; color: var(--text-soft); display: flex; align-items: center; gap: 8px; }
.spinner {
  width: 14px; height: 14px; border-radius: 999px; flex: none;
  border: 2px solid var(--border); border-top-color: var(--primary);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.codeinput { flex: 1; border: none; outline: none; background: transparent; font-size: 22px; letter-spacing: 8px; text-transform: uppercase; color: var(--primary-deep); font-weight: 700; }
</style>
