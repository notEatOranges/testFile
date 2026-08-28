<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import { uploadFile } from '../core/upload'
import { showToast, showConfirmDialog } from 'vant'
import NavBar from '../components/NavBar.vue'
import Sheet from '../components/Sheet.vue'
import IconPin from '~icons/lucide/map-pin'
import IconZap from '~icons/lucide/zap'
import IconBag from '~icons/lucide/shopping-bag'
import IconTrophy from '~icons/lucide/trophy'
import IconSend from '~icons/lucide/send'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import IconImage from '~icons/lucide/image'

const auth = useAuth()
const items = ref([])
let un

onMounted(() => {
  un = store.onList('wishlist', (v) => { items.value = v })
})
onUnmounted(() => { un && un() })

const CATS = [
  { key: 'go', name: '想去', icon: IconPin },
  { key: 'do', name: '想做', icon: IconZap },
  { key: 'eat', name: '想吃', icon: IconBag },
  { key: 'achieve', name: '想完成', icon: IconTrophy }
]
const catName = Object.fromEntries(CATS.map((c) => [c.key, c.name]))
const catIcon = Object.fromEntries(CATS.map((c) => [c.key, c.icon]))

const filter = ref('all')
const filtered = computed(() => (filter.value === 'all' ? items.value : items.value.filter((x) => x.category === filter.value)))
const doneCount = computed(() => items.value.filter((x) => x.done).length)
const byMe = (x) => (x.createdBy === auth.user.role ? '我' : auth.peerName)
const byPeer = (x) => (x.completedBy === auth.user.role ? '我' : auth.peerName)

const newText = ref('')
const newCat = ref('go')
async function add() {
  const t = newText.value.trim()
  if (!t) return
  newText.value = ''
  await store.push('wishlist', { text: t, category: newCat.value, done: false, createdBy: auth.user.role, ts: Date.now() })
}

// ── 完成打卡 ──
const showCheck = ref(false)
const checkItem = ref(null)
const checkNote = ref('')
const checkPhoto = ref('')
const checkFile = ref(null)
function openCheck(x) {
  checkItem.value = x
  checkNote.value = ''
  checkPhoto.value = ''
  showCheck.value = true
}
function pickPhoto() { checkFile.value && checkFile.value.click() }
function onPhoto(e) {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f) return
  checkPhoto.value = URL.createObjectURL(f)
  checkItem.value._file = f
}
async function doCheck() {
  const x = checkItem.value
  let photo = ''
  if (x._file) {
    try { photo = await uploadFile(x._file) } catch (e) { showToast(e.message); return }
  }
  await store.transaction('wishlist', (v) => {
    v = v || {}
    if (v[x.id]) v[x.id] = { ...v[x.id], done: true, photo, note: checkNote.value.trim(), completedBy: auth.user.role, doneTs: Date.now() }
    return v
  })
  showToast('打卡完成！')
  showCheck.value = false
}
async function reopen(x) {
  try {
    await showConfirmDialog({ title: '重新打开', message: `把「${x.text}」改回未完成？打卡记录会被清掉。` })
  } catch { return }
  await store.transaction('wishlist', (v) => {
    v = v || {}
    if (v[x.id]) v[x.id] = { ...v[x.id], done: false, photo: '', note: '', completedBy: '', doneTs: 0 }
    return v
  })
}
async function del(x) {
  try {
    await showConfirmDialog({ title: '删除心愿', message: `确定删除「${x.text}」吗？` })
  } catch { return }
  await store.transaction('wishlist', (v) => { if (v && v[x.id]) delete v[x.id]; return v })
}
</script>

<template>
  <div class="page">
    <NavBar title="心愿清单" back />
    <div class="body" :style="{ paddingBottom: 'calc(140px + var(--sa-bottom))' }">
      <div class="card prog">
        <div class="row"><b>心愿进度</b><span>{{ doneCount }} / {{ items.length }}</span></div>
        <div class="bar"><i :style="{ width: (items.length ? (doneCount / items.length) * 100 : 0) + '%' }" /></div>
      </div>

      <div class="chiprow" style="margin: 14px 0">
        <button class="chip" :class="{ on: filter === 'all' }" @click="filter = 'all'">全部</button>
        <button v-for="c in CATS" :key="c.key" class="chip" :class="{ on: filter === c.key }" @click="filter = c.key">{{ c.name }}</button>
      </div>

      <div v-if="!filtered.length" class="emptybox">
        <IconTrophy />
        <span>许个愿吧，下方输入框回车即加</span>
      </div>

      <div v-for="x in filtered" :key="x.id" class="wcard">
        <button class="wx" @click="del(x)"><IconX style="width: 14px; height: 14px" /></button>
        <span class="iconwrap"><component :is="catIcon[x.category] || IconPin" /></span>
        <div class="mid">
          <b :class="{ donetext: x.done }">{{ x.text }}</b>
          <small>{{ catName[x.category] || '想去' }} · 由 {{ byMe(x) }} 提出</small>
          <img v-if="x.done && x.photo" :src="x.photo" class="wphoto">
          <div v-if="x.done && x.note" class="wnote">{{ x.note }}</div>
          <div v-if="x.done" class="wmeta">
            <span class="ok">{{ byPeer(x) }} 已完成{{ x.doneTs ? ' · ' + new Date(x.doneTs).getMonth() + 1 + '月' + new Date(x.doneTs).getDate() + '日' : '' }}</span>
            <button class="re" @click="reopen(x)">重新打开</button>
          </div>
        </div>
        <button v-if="!x.done" class="ckc" @click="openCheck(x)" />
        <span v-else class="ckc done"><IconCheck style="width: 13px; height: 13px" /></span>
      </div>
    </div>

    <div class="addbar">
      <div class="fld">
        <input v-model="newText" maxlength="40" placeholder="许个愿，回车即加" @keyup.enter="add">
        <div class="minichips">
          <button v-for="c in CATS" :key="c.key" class="mchip" :class="{ on: newCat === c.key }" @click="newCat = c.key">{{ c.name }}</button>
        </div>
      </div>
      <button class="snd" @click="add"><IconSend style="width: 16px; height: 16px" /></button>
    </div>

    <Sheet :show="showCheck" @close="showCheck = false">
      <h3>完成打卡</h3>
      <div class="sub">{{ checkItem?.text }}</div>
      <div class="form" style="margin-top: 14px">
        <button class="photoslot" @click="pickPhoto">
          <img v-if="checkPhoto" :src="checkPhoto">
          <span v-else><IconImage style="width: 22px; height: 22px" />留张照片纪念一下</span>
        </button>
        <input ref="checkFile" type="file" accept="image/*" style="display: none" @change="onPhoto">
        <div class="fld" style="height: auto; padding: 12px 14px">
          <input v-model="checkNote" maxlength="60" style="height: 24px" placeholder="一句话感受（可不填）">
        </div>
        <button class="btn" @click="doCheck">完成！</button>
      </div>
    </Sheet>
  </div>
</template>

<style scoped>
.prog { display: flex; flex-direction: column; gap: 9px; }
.prog .row { display: flex; justify-content: space-between; align-items: baseline; }
.prog .row b { font-size: 15px; }
.prog .row span { font-size: 13px; font-weight: 700; color: var(--primary-deep); }
.bar { height: 8px; border-radius: 99px; background: var(--bg-3); overflow: hidden; }
.bar i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--primary), var(--primary-deep)); transition: width .4s; }

.wcard { display: flex; gap: 12px; align-items: flex-start; background: var(--card); border-radius: 18px; padding: 14px; box-shadow: var(--shadow-soft); margin-bottom: 10px; position: relative; }
.wcard .iconwrap { width: 36px; height: 36px; }
.wcard .mid { flex: 1; min-width: 0; }
.wcard .mid b { font-size: 15px; word-break: break-word; }
.donetext { text-decoration: line-through; color: var(--text-soft); }
.wcard .mid small { display: block; font-size: 11px; color: var(--text-soft); margin-top: 3px; }
.wx { position: absolute; top: 10px; right: 44px; color: var(--text-soft); opacity: .5; display: flex; padding: 2px; }
.ckc { width: 24px; height: 24px; border-radius: 999px; border: 2px solid var(--border); flex: none; margin-top: 2px; display: flex; align-items: center; justify-content: center; }
.ckc:active { transform: scale(.9); }
.ckc.done { background: var(--primary); border-color: var(--primary); color: #fff; }
.wphoto { width: 104px; height: 70px; object-fit: cover; border-radius: 12px; margin-top: 8px; }
.wnote { font-size: 12px; color: var(--text); background: var(--bg-1); border-radius: 9px; padding: 6px 9px; margin-top: 8px; }
.wmeta { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 11px; }
.wmeta .ok { color: var(--success); font-weight: 600; }
.wmeta .re { color: var(--primary-deep); font-weight: 600; margin-left: auto; }

.addbar { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: 100%; max-width: 480px; z-index: 34;
  display: flex; gap: 8px; align-items: center; padding: 8px 14px calc(10px + var(--sa-bottom));
  background: var(--glass); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-top: 1px solid var(--border); }
.addbar .fld { flex: 1; height: 44px; border-radius: 22px; gap: 8px; }
.minichips { display: flex; gap: 4px; }
.mchip { font-size: 10px; padding: 3px 8px; border-radius: 999px; background: var(--bg-1); color: var(--text-soft); }
.mchip.on { background: var(--primary); color: #fff; }
.snd { width: 44px; height: 44px; border-radius: 999px; background: linear-gradient(135deg, var(--primary), var(--primary-deep)); color: #fff; display: flex; align-items: center; justify-content: center; flex: none; box-shadow: var(--shadow-pop); }
.photoslot { width: 100%; height: 120px; border-radius: 14px; border: 1.5px dashed var(--border); background: var(--bg-1); display: flex; align-items: center; justify-content: center; color: var(--text-soft); font-size: 12px; overflow: hidden; }
.photoslot img { width: 100%; height: 100%; object-fit: cover; }
.photoslot span { display: flex; flex-direction: column; align-items: center; gap: 6px; }
</style>
