<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import { uploadFile } from '../core/upload'
import { copyText, inviteLink } from '../core/clip'
import { THEMES } from '../core/theme'
import { showToast, showConfirmDialog } from 'vant'
import TabBar from '../components/TabBar.vue'
import NavBar from '../components/NavBar.vue'
import Sheet from '../components/Sheet.vue'
import ThemeSheet from '../components/ThemeSheet.vue'
import Avatar from '../components/Avatar.vue'
import IconCam from '~icons/lucide/camera'
import IconLink from '~icons/lucide/link'
import IconPalette from '~icons/lucide/palette'
import IconImage from '~icons/lucide/image'
import IconZap from '~icons/lucide/zap'
import IconBell from '~icons/lucide/bell'
import IconTrash from '~icons/lucide/trash'
import IconLogout from '~icons/lucide/log-out'
import IconChev from '~icons/lucide/chevron-right'
import IconHeart from '~icons/lucide/heart'

const router = useRouter()
const auth = useAuth()

const showTheme = ref(false)
const showEdit = ref(false)
const showSuffix = ref(false)
const editNick = ref('')
const editAvatarFile = ref(null)
const editAvatarUrl = ref('')
const suffix = ref('')
const suffixInput = ref('')
const fileInput = ref(null)
let unSuffix

function themeName() {
  const k = localStorage.getItem('love-theme') || 'sakura'
  const t = THEMES.find((x) => x.key === k)
  return t ? t.name : k
}
const currentThemeName = ref(themeName())
function onThemeChanged() { currentThemeName.value = themeName() }

onMounted(() => {
  unSuffix = store.onValue('pokeSuffix/' + auth.user.role, (v) => { suffix.value = (v && v.suffix) || '' })
  window.addEventListener('theme-changed', onThemeChanged)
})
onUnmounted(() => {
  unSuffix && unSuffix()
  window.removeEventListener('theme-changed', onThemeChanged)
})

function openEdit() {
  editNick.value = auth.user.nick || ''
  editAvatarFile.value = null
  editAvatarUrl.value = auth.user.avatar || ''
  showEdit.value = true
}
function pickAvatar() { fileInput.value && fileInput.value.click() }
function onFile(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  editAvatarFile.value = f
  editAvatarUrl.value = URL.createObjectURL(f)
  e.target.value = ''
}
async function saveProfile() {
  try {
    let avatar = auth.user.avatar || ''
    if (editAvatarFile.value) avatar = await uploadFile(editAvatarFile.value)
    await auth.saveProfile({ nick: editNick.value.trim(), avatar })
    showToast('资料已保存，对方实时可见')
    showEdit.value = false
  } catch (e) {
    showToast(e.message)
  }
}

async function copyInvite() {
  if (!auth.couple || !auth.couple.inviteCode) return
  copyText(inviteLink(auth.couple.inviteCode))
}

async function saveSuffix() {
  await store.update('pokeSuffix/' + auth.user.role, { suffix: suffixInput.value.trim().slice(0, 12) })
  showToast('已保存')
  showSuffix.value = false
}

async function leaveSpace() {
  try {
    await showConfirmDialog({
      title: '退出空间',
      message: '退出后你将看不到这个空间的数据，历史数据会保留在空间里。确定退出吗？',
      confirmButtonText: '退出',
      confirmButtonColor: '#ff3b30'
    })
  } catch { return }
  await auth.leaveCouple()
  showToast('已退出空间')
  router.replace('/space')
}

function logout() {
  auth.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="page">
    <NavBar title="我的" plain />
    <div class="body has-tab">
      <!-- 资料卡 -->
      <button class="profc" @click="openEdit">
        <span class="avp">
          <Avatar :size="62" :name="auth.displayName" :avatar="auth.user.avatar" />
          <span class="cam"><IconCam style="width: 11px; height: 11px" /></span>
        </span>
        <span class="pinfo">
          <b>{{ auth.displayName }}</b>
          <small>空间码 {{ auth.user.coupleId || '—' }} · 点击编辑资料</small>
        </span>
        <IconChev style="width: 18px; height: 18px; color: var(--text-soft)" />
      </button>

      <div class="sec">空间与个性</div>
      <div class="grp">
        <button class="cellrow" @click="copyInvite">
          <span class="iconwrap"><IconLink /></span>
          <span class="ttl">邀请信息</span>
          <span class="val">{{ (auth.couple && auth.couple.inviteCode) || '—' }}</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
        <button class="cellrow" @click="showTheme = true">
          <span class="iconwrap"><IconPalette /></span>
          <span class="ttl">换主题</span>
          <span class="val">{{ currentThemeName }}</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
        <button class="cellrow" @click="showToast('聊天背景在 M2 交付')">
          <span class="iconwrap"><IconImage /></span>
          <span class="ttl">聊天背景</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
        <button class="cellrow" @click="suffixInput = suffix; showSuffix = true">
          <span class="iconwrap"><IconZap /></span>
          <span class="ttl">戳一戳后缀</span>
          <span class="val">{{ suffix || '未设置' }}</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
      </div>

      <div class="sec">通用</div>
      <div class="grp">
        <button class="cellrow" @click="showToast('通知设置在 M5 交付')">
          <span class="iconwrap"><IconBell /></span>
          <span class="ttl">消息通知</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
        <button class="cellrow" @click="showToast('聊天功能在 M2 交付')">
          <span class="iconwrap"><IconTrash /></span>
          <span class="ttl">清空聊天记录</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
      </div>

      <div class="sec">危险区</div>
      <div class="grp danger">
        <button class="cellrow" @click="leaveSpace">
          <span class="iconwrap"><IconLogout /></span>
          <span class="ttl">退出空间</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
        <button class="cellrow" @click="logout">
          <span class="iconwrap"><IconHeart /></span>
          <span class="ttl">退出登录</span>
          <IconChev style="width: 16px; height: 16px; color: var(--text-soft)" />
        </button>
      </div>

      <div class="meversion">love-h5 v1.0 · 为 ta 而建</div>
    </div>

    <!-- 编辑资料 -->
    <Sheet :show="showEdit" @close="showEdit = false">
      <h3>编辑资料</h3>
      <div class="sub">保存后 ta 那边实时更新</div>
      <div class="form" style="margin-top: 14px">
        <div class="avrow">
          <button class="avup" @click="pickAvatar">
            <img v-if="editAvatarUrl" :src="editAvatarUrl" style="width: 100%; height: 100%; object-fit: cover; border-radius: 999px" alt="">
            <Avatar v-else :size="52" :name="auth.displayName" />
            <span class="cam"><IconCam style="width: 10px; height: 10px" /></span>
          </button>
          <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFile">
          <div class="fld" style="flex: 1">
            <input v-model="editNick" maxlength="12" placeholder="网名（最多 12 字）">
          </div>
        </div>
        <button class="btn" @click="saveProfile">保存</button>
      </div>
    </Sheet>

    <!-- 戳一戳后缀 -->
    <Sheet :show="showSuffix" @close="showSuffix = false">
      <h3>戳一戳后缀</h3>
      <div class="sub">戳 ta 时会带上这句话，如「并说想你」</div>
      <div class="form" style="margin-top: 14px">
        <div class="fld"><input v-model="suffixInput" maxlength="12" placeholder="最多 12 个字" @keyup.enter="saveSuffix"></div>
        <button class="btn" @click="saveSuffix">保存</button>
      </div>
    </Sheet>

    <ThemeSheet :show="showTheme" @close="showTheme = false" />
    <TabBar />
  </div>
</template>

<style scoped>
.profc { display: flex; align-items: center; gap: 14px; background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow-soft); padding: 18px 16px; width: 100%; text-align: left; }
.avp { position: relative; flex: none; }
.cam { position: absolute; right: -1px; bottom: -1px; width: 22px; height: 22px; border-radius: 999px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; border: 2.5px solid #fff; }
.pinfo { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.pinfo b { font-size: 19px; font-weight: 700; }
.pinfo small { font-size: 11px; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.danger .iconwrap { background: color-mix(in srgb, var(--danger) 12%, #fff); color: var(--danger); }
.danger .ttl { color: var(--danger); }
.meversion { text-align: center; font-size: 10px; color: var(--text-soft); margin-top: 26px; letter-spacing: 1px; }
.avrow { display: flex; gap: 12px; align-items: center; }
.avup { width: 52px; height: 52px; border-radius: 999px; border: 1.5px dashed var(--primary); color: var(--primary); display: flex; align-items: center; justify-content: center; position: relative; background: var(--chip); flex: none; overflow: hidden; }
.avup .cam { position: absolute; right: -1px; bottom: -1px; width: 20px; height: 20px; border-radius: 999px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; }
</style>
