<template>
  <el-card class="monitor-card" shadow="hover" @click="$emit('click')">
    <div class="card-header">
      <div class="card-icon" :class="`icon-${status}`">
        <el-icon :size="20">
          <component :is="statusIcon" />
        </el-icon>
      </div>
      <div class="card-status">
        <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
      </div>
    </div>
    <div class="card-body">
      <div class="card-title">{{ data.title || '监测记录' }}</div>
      <div class="card-info">
        <span class="info-label">来源:</span>
        <span class="info-value">{{ data.source }}</span>
      </div>
      <div class="card-info">
        <span class="info-label">类型:</span>
        <span class="info-value">{{ data.dataType }}</span>
      </div>
      <div class="card-info">
        <span class="info-label">时间:</span>
        <span class="info-value">{{ data.monitorTime }}</span>
      </div>
    </div>
    <div v-if="showActions" class="card-actions">
      <el-button type="primary" link size="small" @click.stop="$emit('detail')">
        详情
      </el-button>
      <el-button type="primary" link size="small" @click.stop="$emit('process')">
        处理
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { CircleCheck, CircleClose, Warning } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    default: 'normal'
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click', 'detail', 'process'])

const statusIcon = computed(() => {
  const iconMap = {
    normal: CircleCheck,
    abnormal: CircleClose,
    pending: Warning
  }
  return iconMap[props.status] || CircleCheck
})

const statusLabel = computed(() => {
  const labelMap = {
    normal: '正常',
    abnormal: '异常',
    pending: '待处理'
  }
  return labelMap[props.status] || '未知'
})

const statusTagType = computed(() => {
  const typeMap = {
    normal: 'success',
    abnormal: 'danger',
    pending: 'warning'
  }
  return typeMap[props.status] || ''
})
</script>

<script>
export default {
  name: 'MonitorCard'
}
</script>

<style scoped lang="scss">
.monitor-card {
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .card-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.icon-normal {
      background: #f0f9ff;
      color: #67c23a;
    }

    &.icon-abnormal {
      background: #fef0f0;
      color: #f56c6c;
    }

    &.icon-pending {
      background: #fdf6ec;
      color: #e6a23c;
    }
  }

  .card-body {
    .card-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }

    .card-info {
      display: flex;
      font-size: 12px;
      margin-bottom: 4px;

      .info-label {
        color: #999;
        margin-right: 4px;
      }

      .info-value {
        color: #666;
      }
    }
  }

  .card-actions {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #eee;
    display: flex;
    gap: 8px;
  }
}
</style>
