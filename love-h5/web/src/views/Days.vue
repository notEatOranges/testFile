<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import { daysBetween, sortEvents, countdownText, ANNIV_TYPES, RECURRENCE } from '../core/anniv'
import { showToast } from 'vant'
import NavBar from '../components/NavBar.vue'
import Sheet from '../components/Sheet.vue'
import IconHeart from '~icons/lucide/heart'
import IconGift from '~icons/lucide/gift'
import IconStar from '~icons/lucide/star'
import IconCal from '~icons/lucide/calendar'
import IconClock from '~icons/lucide/clock'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash'
import { showConfirmDialog } from 'vant'

const auth = useAuth()
const startDate = ref('')
const startInput = ref('')
const events = ref([])
let un1, un2

onMounted(() => {
  un1 = store.onValue('anniversary', (v) => {
    startDate.value = (v && v.startDate) || ''
    startInput.value = startDate.value
  })
  un2 = store.onList('anniversary/events', (v) => { events.value = sortEvents(v) })
})
onUnmounted(() => { un1 && un1(); un2 && un2() })

const days = computed(() => daysBetween(startDate.value))

async function saveStart() {
  if (!startInput.value) return showToast('选个日子吧')
  await store.update('anniversary', { startDate: startInput.value })
  showToast('已保存')
}

// ── 添加/删除事件 ──
const TYPES = ANNIV_TYPES
const RECUR = RECURRENCE
const ADVANCES = [{ d: 0, name: '当天' }, { d: 1, name: '提前1天' }, { d: 3, name: '提前3天' }, { d: 7, name: '提前7天' }]
const typeIcon = { anniversary: IconHeart, birthday: IconGift, first: IconStar, festival: IconCal, countdown: IconClock }

const showAdd = ref(false)
const form = ref({ title: '', date: '', type: 'anniversary', recurrence: 'yearly', advanceDays: [0, 1], note: '' })
function toggleAdvance(d) {
  const arr = form.value.advanceDays
  const i = arr.indexOf(d)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(d)
}
async function saveEvent() {
  const f = form.value
  if (!f.title.trim()) return showToast('写个名字')
  if (!f.date) return showToast('选个日期')
  const id = 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  await store.transaction('anniversary/events', (v) => {
    v = v || {}
    v[id] = { title: f.title.trim(), date: f.date, type: f.type, recurrence: f.recurrence, advanceDays: [...f.advanceDays], note: f.note.trim(), createdBy: auth.user.role, ts: Date.now() }
    return v
  })
  showToast('已添加')
  showAdd.value = false
  form.value = { title: '', date: '', type: 'anniversary', recurrence: 'yearly', advanceDays: [0, 1], note: '' }
}
async function delEvent(ev) {
  try {
    await showConfirmDialog({ title: '删除纪念日', message: `确定删除「${ev.title}」吗？` })
  } catch { return }
  await store.transaction('anniversary/events', (v) => { if (v && v[ev.id]) delete v[ev.id]; return v })
  showToast('已删除')
}
const typeName = Object.fromEntries(TYPES.map((t) => [t.key, t.name]))
const recurName = Object.fromEntries(RECUR.map((t) => [t.key, t.name]))
</script>

<template>
  <div class="page">
    <NavBar title="纪念日" back />
    <div class="body" :style="{ paddingBottom: 'calc(110px + var(--sa-bottom))' }">
      <div class="hero-days">
        <span class="deco"><IconCal style="width: 34px; height: 34px" /></span>
        <div class="lab">在 一 起</div>
        <div class="num"><b>{{ days }}</b><span>天</span></div>
        <div class="since">
          <template v-if="startDate">从 {{ startDate.replaceAll('-', '.') }} 起，每一天都有你</template>
          <template v-else>设置你们在一起的日子</template>
        </div>
        <div class="startrow">
          <input v-model="startInput" type="date" class="datein">
          <button class="btn sm2" @click="saveStart">保存</button>
        </div>
      </div>

      <div class="sec">重要的日子 <span style="font-size: 11px; font-weight: 400">{{ events.length }} 个</span></div>
      <div v-if="!events.length" class="emptybox">
        <IconHeart />
        <span>点右下角 + 添加第一个纪念日</span>
      </div>
      <div v-for="ev in events" :key="ev.id" class="dcard" :class="{ past: countdownText(ev.date, ev.recurrence).includes('天前') }">
        <span class="iconwrap"><component :is="typeIcon[ev.type] || IconCal" /></span>
        <div class="mid">
          <b>{{ ev.title }} <span class="rbd">{{ recurName[ev.recurrence] }}</span></b>
          <small>{{ typeName[ev.type] }} · {{ ev.date.replaceAll('-', '.') }}{{ ev.note ? ' · ' + ev.note : '' }}</small>
        </div>
        <div class="numr"><b>{{ countdownText(ev.date, ev.recurrence) }}</b></div>
        <button class="del" @click="delEvent(ev)"><IconTrash style="width: 15px; height: 15px" /></button>
      </div>
    </div>

    <button class="fab" @click="showAdd = true"><IconPlus style="width: 24px; height: 24px" /></button>

    <Sheet :show="showAdd" @close="showAdd = false">
      <h3>添加纪念日</h3>
      <div class="form" style="margin-top: 14px">
        <div class="fld"><input v-model="form.title" maxlength="20" placeholder="名称，如：恋爱纪念日 / ta 的生日"></div>
        <div class="fld"><input v-model="form.date" type="date"></div>
        <div class="chipsrow">
          <button v-for="t in TYPES" :key="t.key" class="chip" :class="{ on: form.type === t.key }" @click="form.type = t.key">{{ t.name }}</button>
        </div>
        <div class="chipsrow">
          <button v-for="r in RECUR" :key="r.key" class="chip" :class="{ on: form.recurrence === r.key }" @click="form.recurrence = r.key">{{ r.name }}</button>
        </div>
        <div class="lab2">提醒我</div>
        <div class="chipsrow">
          <button v-for="a in ADVANCES" :key="a.d" class="chip" :class="{ on: form.advanceDays.includes(a.d) }" @click="toggleAdvance(a.d)">{{ a.name }}</button>
        </div>
        <div class="fld"><input v-model="form.note" maxlength="40" placeholder="备注（可不填）"></div>
        <button class="btn" @click="saveEvent">添加</button>
      </div>
    </Sheet>
  </div>
</template>

<style scoped>
.hero-days { position: relative; background: var(--card); border-radius: 24px; box-shadow: var(--shadow-soft); padding: 20px 22px; overflow: hidden; }
.hero-days .lab { font-size: 12px; color: var(--text-soft); letter-spacing: 2px; }
.hero-days .num { display: flex; align-items: baseline; gap: 6px; margin-top: 4px; }
.hero-days .num b { font-size: 54px; line-height: 1.05; font-weight: 800; font-variant-numeric: tabular-nums; background: linear-gradient(135deg, var(--primary), var(--primary-deep)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero-days .num span { font-size: 15px; font-weight: 600; }
.hero-days .since { font-size: 11px; color: var(--text-soft); margin-top: 4px; }
.hero-days .deco { position: absolute; right: 18px; top: 18px; color: var(--accent); }
.startrow { display: flex; gap: 8px; margin-top: 14px; align-items: center; }
.datein { flex: 1; height: 40px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--bg-1); padding: 0 12px; font-size: 14px; color: var(--text); }

.dcard { display: flex; gap: 12px; align-items: center; background: var(--card); border-radius: 18px; padding: 14px; box-shadow: var(--shadow-soft); margin-bottom: 10px; }
.dcard .iconwrap { width: 44px; height: 44px; border-radius: 14px; }
.dcard .mid { flex: 1; min-width: 0; }
.dcard .mid b { font-size: 15px; display: flex; align-items: center; gap: 6px; }
.dcard .mid small { font-size: 11px; color: var(--text-soft); display: block; margin-top: 3px; }
.dcard .numr { font-size: 15px; font-weight: 800; color: var(--primary-deep); text-align: right; flex: none; }
.rbd { font-size: 9.5px; padding: 2px 7px; border-radius: 999px; background: var(--chip); color: var(--primary-deep); font-weight: 500; }
.dcard.past { opacity: .55; }
.del { color: var(--text-soft); opacity: .5; display: flex; padding: 4px; }
.chipsrow { display: flex; gap: 8px; flex-wrap: wrap; }
.lab2 { font-size: 11px; color: var(--text-soft); margin-top: 2px; }
</style>
