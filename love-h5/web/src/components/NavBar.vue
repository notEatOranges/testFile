<script setup>
import { useRouter } from 'vue-router'
import IconBack from '~icons/lucide/chevron-left'

defineProps({
  title: { type: String, default: '' },
  back: { type: Boolean, default: false },
  plain: { type: Boolean, default: false }
})
const router = useRouter()
</script>

<template>
  <header class="nav" :class="{ plain }">
    <span class="side">
      <button v-if="back" class="back" @click="router.back()">
        <IconBack style="width: 24px; height: 24px" />
      </button>
    </span>
    <span class="ttl">{{ title }}</span>
    <span class="side rt"><slot name="right" /></span>
  </header>
</template>

<style scoped>
.back { display: flex; color: var(--text); }
</style>
