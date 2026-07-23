<template>
  <el-form :model="modelValue" inline :label-width="labelWidth">
    <el-form-item
      v-for="field in fields"
      :key="field.prop"
      :label="field.label"
    >
      <!-- 输入框 -->
      <el-input
        v-if="field.type === 'input'"
        v-model="modelValue[field.prop]"
        :placeholder="field.placeholder || `请输入${field.label}`"
        :clearable="field.clearable !== false"
        style="width: 150px"
      />
      <!-- 下拉选择 -->
      <el-select
        v-else-if="field.type === 'select'"
        v-model="modelValue[field.prop]"
        :placeholder="field.placeholder || `请选择${field.label}`"
        :clearable="field.clearable !== false"
        :multiple="field.multiple"
        style="width: 150px"
      >
        <el-option
          v-for="option in field.options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <!-- 日期选择 -->
      <el-date-picker
        v-else-if="field.type === 'date'"
        v-model="modelValue[field.prop]"
        type="date"
        :placeholder="field.placeholder || `请选择${field.label}`"
        value-format="YYYY-MM-DD"
        style="width: 150px"
      />
      <!-- 日期范围选择 -->
      <el-date-picker
        v-else-if="field.type === 'daterange'"
        v-model="modelValue[field.prop]"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 240px"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :icon="Search" @click="$emit('search')">
        查询
      </el-button>
      <el-button :icon="Refresh" @click="$emit('reset')">
        重置
      </el-button>
      <slot name="actions" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { Search, Refresh } from '@element-plus/icons-vue'

defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  fields: {
    type: Array,
    default: () => []
  },
  labelWidth: {
    type: String,
    default: '80px'
  }
})

defineEmits(['search', 'reset'])
</script>

<script>
export default {
  name: 'SearchForm'
}
</script>
