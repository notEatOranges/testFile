<script setup>
import { ref, watch } from 'vue'
import { useAuth } from '../core/auth'
import * as store from '../core/store'
import { uploadFile } from '../core/upload'
import { todayStr } from '../core/anniv'
import { MOODS } from '../core/moods'
import { showToast } from 'vant'
import Sheet from './Sheet.vue'
import IconImage from '~icons/lucide/image'
import IconX from '~icons/lucide/x'

const props = defineProps({ show: Boolean, mood: { type: Object, default: null } })
const emit = defineEmits(['close'])
const auth = useAuth()

const sel = ref(0)
const custom = ref('')
const whisper = ref('')
const bg = ref('')
const busy = ref(false)
const fileInput = ref(null)

watch(() => props.show, (v) => {
  if (!v) return
  const mine = props.mood && props.mood[auth.user.role]
  const idx = mine ? MOODS.findIndex((m) => m.emoji === mine.emoji && m.label === mine.label) : 0
  if (idx >= 0) { sel.value = idx; custom.value = '' } else { sel.value = -1; custom.value = (mine && mine.emoji) || '' }
  whisper.value = (mine && mine.whisper) || ''
  bg.value = (mine && mine.bg) || ''
})

function pickBg() { fileInput.value && fileInput.value.click() }
async function onFile(e) {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f) return
  try { bg.value = await uploadFile(f) } catch (err) { showToast(err.message) }
}

async function save() {
  if (sel.value < 0 && !custom.value.trim()) return showToast('选一个心情，或写个自定义的')
  busy.value = true
  try {
    const value = sel.value >= 0
      ? { emoji: MOODS[sel.value].emoji, label: MOODS[sel.value].label, whisper: whisper.value.trim(), bg: bg.value, ts: Date.now() }
      : { emoji: custom.value.trim().slice(0, 4), label: '', whisper: whisper.value.trim(), bg: bg.value, ts: Date.now() }
    await store.update('mood/' + todayStr(), { [auth.user.role]: value })
    showToast('已保存，ta 实时可见')
    emit('close')
  } catch (e) {
    showToast(e.message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Sheet :show="show" @close="emit('close')">
    <h3>记录今日心情</h3>
    <div class="sub">{{ todayStr() }} · 保存后 ta 实时可见</div>

    <div class="eg">
      <button v-for="(m, i) in MOODS" :key="m.emoji" class="em" :class="{ on: sel === i }" @click="sel = i; custom = ''">
        <b>{{ m.emoji }}</b><span>{{ m.label }}</span>
      </button>
      <button class="em" :class="{ on: sel < 0 && !!custom.trim() }" @click="sel = -1">
        <b style="font-size: 15px">{{ custom.trim() || '自定义' }}</b>
        <span>≤4 个字</span>
      </button>
    </div>
    <div class="fld" style="height: 42px; margin-top: 10px" v-if="sel < 0">
      <input v-model="custom" maxlength="4" placeholder="emoji 或 4 个字，如：想吃火锅">
    </div>

    <div class="ta">
      <textarea v-model="whisper" maxlength="80" rows="2" style="width: 100%; border: none; outline: none; background: transparent; resize: none; font-size: 14px; color: var(--text)" placeholder="一句悄悄话（可不写）" />
      <span class="cnt">{{ whisper.length }} / 80</span>
    </div>

    <div class="bgrow">
      <button class="chip" @click="pickBg"><IconImage style="width: 14px; height: 14px" />{{ bg ? '换背景图' : '设置背景图' }}</button>
      <button v-if="bg" class="chip" @click="bg = ''"><IconX style="width: 14px; height: 14px" />清除背景</button>
      <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFile">
      <span v-if="bg" class="bgprev" :style="{ backgroundImage: `url(${bg})` }" />
    </div>

    <button class="btn" :class="{ dis: busy }" @click="save">{{ busy ? '保存中…' : '保存今日心情' }}</button>
  </Sheet>
</template>

<style scoped>
.eg { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 14px; }
.em { aspect-ratio: 1; border-radius: 16px; background: var(--bg-1); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; }
.em b { font-size: 24px; font-weight: 400; }
.em span { font-size: 9.5px; color: var(--text-soft); }
.em.on { outline: 2.5px solid var(--primary); background: color-mix(in srgb, var(--primary) 10%, #fff); }
.ta { margin-top: 12px; background: var(--bg-1); border-radius: 14px; padding: 12px 12px 20px; position: relative; }
.ta .cnt { position: absolute; right: 10px; bottom: 6px; font-size: 10px; color: var(--text-soft); }
.bgrow { display: flex; gap: 8px; margin-top: 12px; align-items: center; }
.bgprev { width: 44px; height: 32px; border-radius: 8px; background-size: cover; background-position: center; border: 1px solid var(--border); }
</style>
