<template>
  <el-tag :type="tagType" :size="size">
    {{ tagLabel }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  statusMap: {
    type: Object,
    default: () => ({})
  },
  size: {
    type: String,
    default: 'default'
  }
})

// 默认状态映射
const defaultStatusMap = {
  normal: { label: '正常', type: 'success' },
  abnormal: { label: '异常', type: 'danger' },
  pending: { label: '待处理', type: 'warning' },
  enabled: { label: '启用', type: 'success' },
  disabled: { label: '禁用', type: 'info' }
}

const tagLabel = computed(() => {
  const map = { ...defaultStatusMap, ...props.statusMap }
  return map[props.status]?.label || props.status
})

const tagType = computed(() => {
  const map = { ...defaultStatusMap, ...props.statusMap }
  return map[props.status]?.type || ''
})
</script>

<script>
export default {
  name: 'StatusTag'
}
</script>
