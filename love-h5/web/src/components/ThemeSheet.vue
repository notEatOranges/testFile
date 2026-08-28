<script setup>
import { ref, watch } from 'vue'
import Sheet from './Sheet.vue'
import IconCheck from '~icons/lucide/check'
import { THEMES, applyTheme } from '../core/theme'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['close'])
const current = ref(localStorage.getItem('love-theme') || 'sakura')
watch(() => props.show, (v) => { if (v) current.value = localStorage.getItem('love-theme') || 'sakura' })

const SW = {
  sakura: ['#ff7aa2', '#e85a86'], mint: ['#5bb89e', '#3fa286'],
  lavender: ['#9b7fd4', '#7d61c0'], peach: ['#ff9a6c', '#f17844'],
  babyblue: ['#6db4e8', '#4f93cf'], lemon: ['#e8b94d', '#c99a2f'],
  berry: ['#e87090', '#cf4f73'], cocoa: ['#b08968', '#8c6a4f']
}
function pick(t) {
  current.value = t.key
  applyTheme(t.key)
}
</script>

<template>
  <Sheet :show="show" @close="emit('close')">
    <h3>选择主题</h3>
    <div class="sub">8 套马卡龙配色 · 点击即时全站切换</div>
    <div class="tg">
      <button v-for="t in THEMES" :key="t.key" class="th" :class="{ on: current === t.key }" @click="pick(t)">
        <span class="sw" :style="{ background: `linear-gradient(135deg, ${SW[t.key][0]}, ${SW[t.key][1]})` }" />
        <b>{{ t.name }}</b>
        <span class="ck2"><IconCheck style="width: 16px; height: 16px" /></span>
      </button>
    </div>
  </Sheet>
</template>

<style scoped>
.tg { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
.th {
  display: flex; align-items: center; gap: 10px; border-radius: 16px;
  padding: 10px; background: var(--bg-1); border: 2px solid transparent;
}
.th.on { border-color: var(--primary); }
.sw { width: 46px; height: 34px; border-radius: 10px; flex: none; }
.th b { font-size: 13px; }
.ck2 { margin-left: auto; color: var(--primary); display: flex; }
.th:not(.on) .ck2 { visibility: hidden; }
</style>
