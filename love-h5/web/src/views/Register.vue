<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../core/auth'
import { uploadFile } from '../core/upload'
import { showToast } from 'vant'
import NavBar from '../components/NavBar.vue'
import Avatar from '../components/Avatar.vue'
import IconCheck from '~icons/lucide/check'
import IconPlus from '~icons/lucide/plus'
import IconCam from '~icons/lucide/camera'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const role = ref('boy')
const nick = ref('')
const username = ref('')
const password = ref('')
const confirm2 = ref('')
const busy = ref(false)
const avatarFile = ref(null)
const avatarUrl = ref('')
const fileInput = ref(null)

const inviteCode = computed(() => (route.query.code || '').toString().toUpperCase())

function pickRole(r) { role.value = r }
function pickAvatar() { fileInput.value && fileInput.value.click() }
function onFile(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  avatarFile.value = f
  avatarUrl.value = URL.createObjectURL(f)
  e.target.value = ''
}

async function submit() {
  if (!nick.value.trim()) return showToast('给自己起个网名吧')
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username.value.trim())) return showToast('账号需为 3~20 位字母/数字/下划线')
  if (password.value.length < 6) return showToast('密码至少 6 位')
  if (password.value !== confirm2.value) return showToast('两次密码不一致')
  busy.value = true
  try {
    await auth.register({
      username: username.value.trim(),
      password: password.value,
      role: role.value,
      nick: nick.value.trim(),
      avatar: ''
    })
    // 注册成功后再传头像（上传接口需要登录态）
    if (avatarFile.value) {
      try {
        const url = await uploadFile(avatarFile.value)
        await auth.saveProfile({ nick: nick.value.trim(), avatar: url })
      } catch { /* 头像失败不阻断 */ }
    }
    // 带邀请码注册 → 直接尝试加入对方空间
    if (inviteCode.value) {
      try {
        await auth.joinCouple(inviteCode.value)
        showToast('已加入空间，欢迎回家')
        router.replace('/home')
        return
      } catch (e) {
        showToast(e.message + '，稍后可在空间页加入')
      }
    }
    router.replace('/space')
  } catch (e) {
    showToast(e.message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page">
    <NavBar title="创建账号" back />
    <div class="body" :style="{ paddingBottom: 'calc(40px + var(--sa-bottom))' }">
      <div class="roles">
        <button class="role" :class="{ on: role === 'boy' }" @click="pickRole('boy')">
          <span class="ck"><IconCheck style="width: 12px; height: 12px" /></span>
          <Avatar :size="56" :name="role === 'boy' ? '他' : ''" />
          <b>男生</b><span>boy</span>
        </button>
        <button class="role girl" :class="{ on: role === 'girl' }" @click="pickRole('girl')">
          <span class="ck"><IconCheck style="width: 12px; height: 12px" /></span>
          <Avatar :size="56" :name="role === 'girl' ? '她' : ''" />
          <b>女生</b><span>girl</span>
        </button>
      </div>

      <div class="form">
        <div class="avrow">
          <button class="avup" @click="pickAvatar">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 999px">
            <IconPlus v-else style="width: 22px; height: 22px" />
            <span class="cam"><IconCam style="width: 10px; height: 10px" /></span>
          </button>
          <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFile">
          <div class="fld" style="flex: 1">
            <input v-model="nick" maxlength="12" placeholder="昵称（对方看到的称呼）">
          </div>
        </div>
        <div class="fld"><input v-model="username" placeholder="账号（用户名，注册后不可改）" @keyup.enter="submit"></div>
        <div class="fld"><input v-model="password" type="password" placeholder="密码（至少 6 位）"></div>
        <div class="fld"><input v-model="confirm2" type="password" placeholder="确认密码" @keyup.enter="submit"></div>
        <button class="btn" :class="{ dis: busy }" @click="submit">{{ busy ? '创建中…' : '创建并登录' }}</button>
      </div>

      <div class="rolenote">
        角色决定你在情侣空间中的位置（男生为 boy、女生为 girl），历史数据按角色继承，<b>注册后不可更改</b>。
        <template v-if="inviteCode"><br>检测到邀请码 <b>{{ inviteCode }}</b>，注册后自动加入 ta 的空间。</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roles { display: flex; gap: 12px; margin-bottom: 18px; }
.role {
  flex: 1; position: relative; border-radius: 18px; border: 2px solid var(--border);
  background: var(--card); padding: 18px 12px 14px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.role.on { border-color: var(--primary); box-shadow: var(--shadow-soft); }
.role b { font-size: 15px; }
.role span { font-size: 11px; color: var(--text-soft); }
.role .ck {
  position: absolute; top: 10px; right: 10px; width: 20px; height: 20px;
  border-radius: 999px; background: var(--primary); color: #fff;
  display: none; align-items: center; justify-content: center;
}
.role.on .ck { display: flex; }
.avrow { display: flex; gap: 12px; align-items: center; }
.avup {
  width: 56px; height: 56px; border-radius: 999px;
  border: 1.5px dashed var(--primary); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  position: relative; background: var(--chip); flex: none; overflow: hidden;
}
.avup .cam {
  position: absolute; right: -1px; bottom: -1px; width: 20px; height: 20px;
  border-radius: 999px; background: var(--primary); color: #fff;
  display: flex; align-items: center; justify-content: center; border: 2px solid #fff;
}
.rolenote { font-size: 11px; color: var(--text-soft); background: var(--chip); border-radius: 10px; padding: 8px 12px; margin-top: 12px; line-height: 1.7; }
.rolenote b { color: var(--primary-deep); }
</style>
