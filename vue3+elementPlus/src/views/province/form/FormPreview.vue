<template>
  <div class="form-preview">
    <!-- 表单头部 -->
    <div class="preview-header">
      <h3>{{ config.title }}</h3>
      <p v-if="config.description">{{ config.description }}</p>
      <p v-if="config.tips" class="preview-tips">
        <el-icon><Warning /></el-icon>
        {{ config.tips }}
      </p>
    </div>

    <!-- 表单内容 -->
    <el-form :model="formData" label-position="top" class="preview-form">
      <template v-for="field in (config.fields || [])" :key="field.id">
        <FormField
          v-model="formData[field.fieldKey]"
          :field="field"
          :form-data="formData"
        />
      </template>
    </el-form>

    <!-- 表单操作 -->
    <div class="preview-actions">
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import FormField from './FormField.vue'

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const formData = reactive({})

// 初始化表单数据
const initFormData = () => {
  if (!props.config.fields || !Array.isArray(props.config.fields)) return

  props.config.fields.forEach(field => {
    if (field.defaultValue !== undefined) {
      formData[field.fieldKey] = field.defaultValue
    } else {
      switch (field.type) {
        case 'checkbox':
          formData[field.fieldKey] = []
          break
        case 'switch':
          formData[field.fieldKey] = false
          break
        default:
          formData[field.fieldKey] = ''
      }
    }
  })
}

// 监听config变化，重新初始化
watch(() => props.config, () => {
  initFormData()
}, { immediate: true, deep: true })

const handleReset = () => {
  if (!props.config.fields) return

  Object.keys(formData).forEach(key => {
    const field = props.config.fields.find(f => f.fieldKey === key)
    if (field && field.defaultValue !== undefined) {
      formData[key] = field.defaultValue
    } else {
      formData[key] = ''
    }
  })
  ElMessage.info('表单已重置')
}

const handleSubmit = () => {
  console.log('表单数据:', formData)
  ElMessage.success('提交成功（预览模式）')
}
</script>

<style scoped lang="scss">
.form-preview {
  .preview-header {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-bottom: 24px;
    color: #fff;

    h3 {
      margin: 0 0 12px;
      font-size: 20px;
      font-weight: 600;
    }

    p {
      margin: 0 0 8px;
      font-size: 14px;
      opacity: 0.95;
    }

    .preview-tips {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      font-size: 13px;
    }
  }

  .preview-form {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .preview-actions {
    text-align: center;
  }
}
</style>
