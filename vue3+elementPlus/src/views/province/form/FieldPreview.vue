<template>
  <div class="field-preview-component">
    <!-- 防护性检查：如果field不是对象或没有type，显示默认预览 -->
    <span v-if="!field || typeof field !== 'object' || !field.type" class="default-preview">
      {{ field?.label || '未知字段' }}
    </span>

    <!-- 输入框预览 -->
    <el-input v-else-if="field.type === 'input'" placeholder="请输入" disabled />

    <!-- 文本域预览 -->
    <el-input v-else-if="field.type === 'textarea'" type="textarea" :rows="field.rows || 4" placeholder="请输入" disabled />

    <!-- 数字输入预览 -->
    <el-input-number v-else-if="field.type === 'number'" placeholder="请输入" disabled :controls-position="'right'" style="width: 200px" />

    <!-- 单选预览 -->
    <el-radio-group v-else-if="field.type === 'radio'" disabled>
      <el-radio v-for="opt in field.options?.slice(0, 2)" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
    </el-radio-group>

    <!-- 多选预览 -->
    <el-checkbox-group v-else-if="field.type === 'checkbox'" disabled>
      <el-checkbox v-for="opt in field.options?.slice(0, 2)" :key="opt.value" :label="opt.value">{{ opt.label }}</el-checkbox>
    </el-checkbox-group>

    <!-- 下拉选择预览 -->
    <el-select v-else-if="field.type === 'select'" placeholder="请选择" disabled style="width: 200px">
      <el-option v-for="opt in field.options?.slice(0, 2)" :key="opt.value" :label="opt.label" :value="opt.value" />
    </el-select>

    <!-- 日期选择预览 -->
    <el-date-picker v-else-if="field.type === 'date'" placeholder="选择日期" disabled style="width: 200px" />

    <!-- 日期范围预览 -->
    <el-date-picker v-else-if="field.type === 'dateRange'" type="daterange" placeholder="选择日期范围" disabled style="width: 280px" />

    <!-- 开关预览 -->
    <el-switch v-else-if="field.type === 'switch'" disabled />

    <!-- 滑块预览 -->
    <el-slider v-else-if="field.type === 'slider'" disabled style="width: 200px" />

    <!-- 评分预览 -->
    <el-rate v-else-if="field.type === 'rate'" disabled />

    <!-- 上传预览 -->
    <el-button v-else-if="field.type === 'upload'" disabled icon="Upload">点击上传</el-button>

    <!-- 图片上传预览 -->
    <el-upload v-else-if="field.type === 'image'" disabled list-type="picture-card">
      <el-icon><Plus /></el-icon>
    </el-upload>

    <!-- 富文本预览 -->
    <div v-else-if="field.type === 'editor'" class="editor-preview">
      <el-input type="textarea" :rows="3" placeholder="富文本内容..." disabled />
    </div>

    <!-- 级联选择预览 -->
    <el-cascader v-else-if="field.type === 'cascader'" placeholder="请选择" disabled style="width: 200px" />

    <!-- 时间选择预览 -->
    <el-time-picker v-else-if="field.type === 'time'" placeholder="选择时间" disabled style="width: 200px" />

    <!-- 时间范围预览 -->
    <el-time-picker v-else-if="field.type === 'timeRange'" is-range placeholder="选择时间范围" disabled style="width: 280px" />

    <!-- 颜色选择预览 -->
    <el-color-picker v-else-if="field.type === 'color'" disabled />

    <!-- 默认预览 -->
    <span v-else class="default-preview">{{ field.label }}</span>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'

defineProps({
  field: {
    type: [Object, null],
    default: null
  }
})
</script>

<style scoped lang="scss">
.field-preview-component {
  .editor-preview {
    :deep(.el-textarea) {
      .el-textarea__inner {
        background: #f5f7fa;
      }
    }
  }

  .default-preview {
    color: #909399;
    font-size: 14px;
  }
}
</style>
