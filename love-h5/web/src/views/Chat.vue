<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import { uploadFile } from '../core/upload'
import { copyText } from '../core/clip'
import { showToast } from 'vant'
import NavBar from '../components/NavBar.vue'
import Sheet from '../components/Sheet.vue'
import Avatar from '../components/Avatar.vue'
import IconMic from '~icons/lucide/mic'
import IconSmile from '~icons/lucide/smile'
import IconPlus from '~icons/lucide/plus'
import IconImage from '~icons/lucide/image'
import IconFile from '~icons/lucide/paperclip'
import IconZap from '~icons/lucide/zap'
import IconPalette from '~icons/lucide/palette'
import IconCopy from '~icons/lucide/copy'
import IconQuote from '~icons/lucide/reply'
import IconUndo from '~icons/lucide/undo-2'
import IconTrash from '~icons/lucide/trash'
import IconX from '~icons/lucide/x'

const route = useRoute()
const auth = useAuth()

const msgs = ref([])
const input = ref('')
const listRef = ref(null)
const panel = ref('') // '' | 'emoji' | 'plus'
const fileInput = ref(null)
const fileMode = ref('image')

// 聊天背景（共享）
const chatBg = ref(null)
const showBg = ref(false)
const bgBusy = ref(false)
const BG_PRESETS = [
  { key: 'sakura', name: '樱粉', css: 'linear-gradient(180deg,#ffe4ec,#fff5f7)' },
  { key: 'mint', name: '薄荷', css: 'linear-gradient(180deg,#d7f2e3,#f0fbf6)' },
  { key: 'lavender', name: '薰衣', css: 'linear-gradient(180deg,#e6dcf5,#f6f2fc)' },
  { key: 'sky', name: '晴空', css: 'linear-gradient(180deg,#d6ebfa,#eef6fd)' },
  { key: 'peach', name: '蜜桃', css: 'linear-gradient(180deg,#ffe4d4,#fff3ec)' },
  { key: 'night', name: '夜空', css: 'linear-gradient(180deg,#3b3f5c,#6c6f95)' }
]
const bgStyle = computed(() => {
  if (!chatBg.value) return {}
  if (chatBg.value.type === 'preset') {
    const p = BG_PRESETS.find((x) => x.key === chatBg.value.key)
    return p ? { background: p.css } : {}
  }
  if (chatBg.value.type === 'image') {
    return { background: `linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,.55)), url(${chatBg.value.url}) center/cover` }
  }
  return {}
})

// 表情面板
const EMOJIS = ('😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 😐 😑 😶 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🥵 🥶 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 💩 🤡 👻 👽 🤖 💛 💖 💗 💓 💞 💕 💘 💝 ✨ 🌟 🎉 🎁 🌹 🍮 🍓 🍦 🎂 🍜 🍕 🍺 ☕ 🧋 🌙 ☀️ 🌈 ⭐ 🔥 💥 👍 👏 🙏 💪 🤝 ✊ 🎶 🎵').split(' ')

// 长按菜单
const showActions = ref(false)
const actionMsg = ref(null)
let pressTimer = null
function pressStart(m) {
  pressTimer = setTimeout(() => { actionMsg.value = m; showActions.value = true }, 450)
}
function pressEnd() { clearTimeout(pressTimer) }

let un1, un2, unRoute
onMounted(() => {
  un1 = store.onList('chat', (l) => { msgs.value = l; detectPokes(l); scrollBottom() })
  un2 = store.onValue('chatBg', (v) => { chatBg.value = v })
  if (route.query.bg) showBg.value = true
})
onUnmounted(() => { un1 && un1(); un2 && un2() })

watch(msgs, () => {
  import('../core/chatBadge').then(({ useChatBadge }) => {
    useChatBadge().markSeen()
  })
  scrollBottom()
})

let lastPokeTs = Number(localStorage.getItem('love-poke-seen') || 0)
function detectPokes(list) {
  for (const m of list) {
    if (m.type === 'poke' && m.from === auth.peerRole && (m.ts || 0) > lastPokeTs) {
      lastPokeTs = m.ts
      localStorage.setItem('love-poke-seen', String(m.ts))
      navigator.vibrate && navigator.vibrate([60, 40, 60])
      showToast(`${auth.peerName} 拍了拍你${m.suffix ? ' 并' + m.suffix : ''}`)
    }
  }
}

function scrollBottom() {
  nextTick(() => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

const isEmojiOnly = (t) => {
  if (!t) return false
  const stripped = t.replace(/[\p{Extended_Pictographic}\u200d\ufe0f\s]/gu, '')
  return stripped.length === 0 && t.trim().length > 0 && t.trim().length <= 8
}

function timeDivider(list, i) {
  if (i === 0) return true
  return (list[i].ts || 0) - (list[i - 1].ts || 0) > 5 * 60 * 1000
}
const fmtTime = (ts) => {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fmtSize = (n) => {
  if (!n) return ''
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

// ── 发送 ──
async function send() {
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  await store.push('chat', { sender: auth.user.role, text, ts: Date.now() })
}
async function sendPoke() {
  const row = await store.getOnce('pokeSuffix/' + auth.user.role)
  const suffix = (row && row.suffix) || ''
  await store.push('chat', { type: 'poke', from: auth.user.role, to: auth.peerRole, fromNick: auth.displayName, suffix, ts: Date.now() })
  panel.value = ''
  navigator.vibrate && navigator.vibrate(30)
}
function pickFile(mode) {
  fileMode.value = mode
  fileInput.value && fileInput.value.click()
}
async function onFile(e) {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f) return
  try {
    const url = await uploadFile(f)
    if (fileMode.value === 'image') {
      await store.push('chat', { sender: auth.user.role, type: 'image', url, ts: Date.now() })
    } else {
      await store.push('chat', { sender: auth.user.role, type: 'file', url, name: f.name, size: f.size, ts: Date.now() })
    }
  } catch (err) { showToast(err.message) }
  panel.value = ''
}

// ── 长按操作 ──
const canRecall = computed(() => {
  const m = actionMsg.value
  return !!(m && m.sender === auth.user.role && !m.recalled && Date.now() - (m.ts || 0) < 2 * 60 * 1000)
})
async function doRecall() {
  const m = actionMsg.value
  showActions.value = false
  if (!canRecall.value) return
  await store.transaction('chat', (v) => { if (v && v[m.id]) v[m.id].recalled = true; return v })
}
async function doDelete() {
  const m = actionMsg.value
  showActions.value = false
  await store.transaction('chat', (v) => { if (v && v[m.id]) delete v[m.id]; return v })
  showToast('已删除')
}
function doQuote() {
  const m = actionMsg.value
  showActions.value = false
  if (m.text) input.value = `「${m.text.slice(0, 30)}」 `
}
function doCopy() {
  const m = actionMsg.value
  showActions.value = false
  if (m.text) copyText(m.text)
}

// ── 背景设置 ──
async function setBgPreset(key) {
  await store.set('chatBg', { type: 'preset', key })
}
async function setBgImage(e) {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f) return
  bgBusy.value = true
  try {
    const url = await uploadFile(f)
    await store.set('chatBg', { type: 'image', url })
    showBg.value = false
  } catch (err) { showToast(err.message) } finally { bgBusy.value = false }
}
async function clearBg() {
  await store.set('chatBg', null)
  showBg.value = false
}
</script>

<template>
  <div class="page chatpage">
    <NavBar :title="auth.peerName" back>
      <template #right>
        <span class="navpres"><span class="dot" v-if="auth.peerOnline" /><span v-else class="offdot" />在线</span>
      </template>
    </NavBar>

    <div class="chatbg" :style="bgStyle" />
    <div ref="listRef" class="chatlist">
      <template v-for="(m, i) in msgs" :key="m.id">
        <div class="tdiv" v-if="timeDivider(msgs, i)">{{ fmtTime(m.ts) }}</div>

        <div v-if="m.type === 'poke'" class="pokepill">
          <IconZap style="width: 12px; height: 12px" />
          {{ m.fromNick || (m.from === auth.user.role ? '我' : auth.peerName) }} 拍了拍 {{ m.to === auth.user.role ? '你' : 'ta' }}{{ m.suffix ? ' 并' + m.suffix : '' }}
        </div>
        <div v-else-if="m.recalled" class="sysline">{{ m.sender === auth.user.role ? '你' : auth.peerName }}撤回了一条消息</div>

        <div v-else class="msg" :class="m.sender === auth.user.role ? 'me' : 'peer'">
          <Avatar :size="32" :name="m.sender === auth.user.role ? auth.displayName : auth.peerName"
                  :avatar="m.sender === auth.user.role ? auth.user.avatar : auth.peer?.avatar" />
          <!-- 图片 -->
          <img v-if="m.type === 'image'" :src="m.url" class="imgbubble" @pointerdown="pressStart(m)" @pointerup="pressEnd" @pointerleave="pressEnd" @contextmenu.prevent="actionMsg = m; showActions = true" @click.prevent>
          <!-- 文件 -->
          <a v-else-if="m.type === 'file'" :href="m.url" target="_blank" class="b filecard" @pointerdown="pressStart(m)" @pointerup="pressEnd" @pointerleave="pressEnd">
            <IconFile style="width: 20px; height: 20px; flex: none" />
            <span class="fmeta"><b>{{ m.name || '文件' }}</b><small>{{ fmtSize(m.size) }}</small></span>
          </a>
          <!-- 文本 -->
          <div v-else class="b" :class="{ big: isEmojiOnly(m.text) }"
               @pointerdown="pressStart(m)" @pointerup="pressEnd" @pointerleave="pressEnd"
               @contextmenu.prevent="actionMsg = m; showActions = true" @dblclick="m.text && copyText(m.text)">{{ m.text }}</div>
        </div>
      </template>
      <div style="height: 8px" />
    </div>

    <!-- 输入栏 -->
    <div class="chatbar">
      <button class="ric" @click="pickFile('image'); fileMode = 'image'"><IconImage /></button>
      <div class="cin">
        <input v-model="input" placeholder="说点什么…" @keyup.enter="send">
      </div>
      <button class="ric" @click="panel = panel === 'emoji' ? '' : 'emoji'"><IconSmile /></button>
      <button class="ric" @click="panel = panel === 'plus' ? '' : 'plus'"><IconPlus /></button>
    </div>

    <!-- 表情面板 -->
    <div v-if="panel === 'emoji'" class="panel">
      <div class="emgrid">
        <button v-for="e in EMOJIS" :key="e" class="pem" @click="input += e">{{ e }}</button>
      </div>
    </div>
    <!-- 加号面板 -->
    <div v-else-if="panel === 'plus'" class="panel">
      <div class="plusgrid">
        <button class="pitem" @click="pickFile('image')"><IconImage /><span>图片</span></button>
        <button class="pitem" @click="pickFile('file')"><IconFile /><span>文件</span></button>
        <button class="pitem" @click="sendPoke"><IconZap /><span>戳一戳</span></button>
        <button class="pitem" @click="showBg = true; panel = ''"><IconPalette /><span>聊天背景</span></button>
      </div>
    </div>

    <!-- 聊天背景设置 -->
    <Sheet :show="showBg" @close="showBg = false">
      <h3>聊天背景</h3>
      <div class="sub">两个人共享这个背景 · 对方实时同步</div>
      <div class="bggrid">
        <button v-for="p in BG_PRESETS" :key="p.key" class="bgcell" :style="{ background: p.css }" @click="setBgPreset(p.key)">
          <span>{{ p.name }}</span>
        </button>
        <label class="bgcell upload"><span>{{ bgBusy ? '上传中…' : '自定义图' }}</span><input type="file" accept="image/*" style="display: none" @change="setBgImage"></label>
      </div>
      <button class="btn ghost" style="margin-top: 14px" @click="clearBg"><IconX style="width: 15px; height: 15px" />恢复默认</button>
    </Sheet>

    <!-- 长按操作 -->
    <Sheet :show="showActions" @close="showActions = false">
      <div class="actlist">
        <button v-if="actionMsg && actionMsg.text" class="act" @click="doCopy"><IconCopy />复制</button>
        <button v-if="actionMsg && actionMsg.text" class="act" @click="doQuote"><IconQuote />引用</button>
        <button v-if="canRecall" class="act" @click="doRecall"><IconUndo />撤回（2 分钟内）</button>
        <button class="act warn" @click="doDelete"><IconTrash />删除</button>
      </div>
    </Sheet>
  </div>
</template>

<style scoped>
.chatpage { position: relative; overflow: hidden; }
.chatbg { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg, var(--bg-2), var(--bg-1)); }
.chatpage :deep(.nav) { position: relative; z-index: 2; background: transparent; border-bottom: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
.navpres { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--success); font-weight: 600; }
.navpres .offdot { width: 8px; height: 8px; border-radius: 999px; background: var(--bg-3); display: inline-block; }

.chatlist { position: relative; z-index: 1; flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 12px 14px 130px; }
.tdiv { text-align: center; font-size: 10px; color: var(--text-soft); margin: 14px 0; }
.sysline { text-align: center; font-size: 10.5px; color: var(--text-soft); margin: 10px 0; }
.pokepill { display: flex; align-items: center; gap: 6px; margin: 12px auto 0; width: fit-content; padding: 6px 12px; border-radius: 999px; background: var(--chip); color: var(--primary-deep); font-size: 11px; }

.msg { display: flex; gap: 8px; margin-top: 12px; align-items: flex-start; }
.msg.me { flex-direction: row-reverse; }
.b { max-width: 70%; padding: 10px 13px; font-size: 15px; line-height: 1.45; border-radius: 16px; word-break: break-word; user-select: none; }
.msg.peer .b { background: var(--card); box-shadow: var(--shadow-soft); border-bottom-left-radius: 4px; }
.msg.me .b { background: linear-gradient(135deg, var(--primary), var(--primary-deep)); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 6px 16px color-mix(in srgb, var(--primary) 32%, transparent); }
.b.big { font-size: 34px; background: transparent !important; box-shadow: none !important; padding: 2px 4px; }
.imgbubble { max-width: 62%; max-height: 260px; border-radius: 14px; box-shadow: var(--shadow-soft); }
.filecard { display: flex; align-items: center; gap: 10px; min-width: 150px; text-decoration: none; color: var(--text); }
.fmeta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.fmeta b { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fmeta small { font-size: 10px; color: var(--text-soft); }

.chatbar { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; display: flex; align-items: center; gap: 8px;
  padding: 8px 12px calc(8px + var(--sa-bottom));
  background: var(--glass); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-top: 1px solid var(--border); }
.ric { color: var(--text-soft); display: flex; padding: 4px; }
.ric svg { width: 22px; height: 22px; }
.cin { flex: 1; height: 40px; border-radius: 20px; background: color-mix(in srgb, var(--bg-2) 60%, #fff); display: flex; align-items: center; padding: 0 16px; }
.cin input { flex: 1; border: none; outline: none; background: transparent; font-size: 14px; color: var(--text); min-width: 0; }

.panel { position: absolute; left: 0; right: 0; bottom: calc(56px + var(--sa-bottom)); z-index: 3; background: var(--glass); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-top: 1px solid var(--border); padding: 12px; padding-bottom: calc(12px + var(--sa-bottom)); }
.emgrid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; max-height: 200px; overflow-y: auto; }
.pem { font-size: 21px; padding: 4px 0; }
.plusgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.pitem { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 0; background: var(--card); border-radius: 14px; font-size: 11px; color: var(--text); }
.pitem svg { width: 22px; height: 22px; color: var(--primary-deep); }

.bggrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
.bgcell { height: 76px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--text); border: 1.5px solid var(--border); }
.actlist { display: flex; flex-direction: column; }
.act { display: flex; align-items: center; gap: 10px; padding: 14px 8px; font-size: 15px; border-bottom: .5px solid var(--border); text-align: left; }
.act:last-child { border-bottom: none; }
.act svg { width: 18px; height: 18px; color: var(--text-soft); }
.act.warn { color: var(--danger); }
.act.warn svg { color: var(--danger); }
</style>
