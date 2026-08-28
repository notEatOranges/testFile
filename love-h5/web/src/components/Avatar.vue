<script setup>
import { computed } from 'vue'
import IconUser from '~icons/lucide/user'

const props = defineProps({
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  size: { type: Number, default: 40 }
})
const initial = computed(() => (props.name || '?').trim().charAt(0).toUpperCase() || '?')
</script>

<template>
  <span class="avatar" :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.42 + 'px' }">
    <img v-if="avatar" :src="avatar" alt="">
    <IconUser v-else-if="!name" :style="{ width: size * 0.5 + 'px', height: size * 0.5 + 'px' }" />
    <template v-else>{{ initial }}</template>
  </span>
</template>
