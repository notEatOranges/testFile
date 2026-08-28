<script setup>
defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="mask" @click="emit('close')" />
  </transition>
  <transition name="fade">
    <div v-if="show" class="sheet">
      <div class="handle" />
      <slot />
    </div>
  </transition>
</template>
