<script setup>
import { useRoute } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import IconHammer from '~icons/lucide/hammer'

const route = useRoute()
</script>

<template>
  <div class="page">
    <NavBar :title="route.meta.title || '建设中'" back />
    <div class="body" style="padding-top: 60px">
      <div class="emptybox">
        <IconHammer />
        <span>「{{ route.meta.title }}」将在下一个里程碑交付</span>
        <span style="font-size: 10px; opacity: .7">M2 核心功能 / M3+ 游戏</span>
      </div>
    </div>
  </div>
</template>
