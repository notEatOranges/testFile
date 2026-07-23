<template>
  <el-form-item
    v-if="visible"
    :label="field.label"
    :prop="field.fieldKey"
    :required="field.required"
    class="dynamic-form-item"
  >
    <!-- 输入框 -->
    <el-input
      v-if="field.type === 'input'"
      v-model="localValue"
      :placeholder="field.placeholder || '请输入'"
      :maxlength="field.maxLength"
      :show-word-limit="field.maxLength"
      :disabled="field.disabled"
      clearable
      @change="handleChange"
    />

    <!-- 文本域 -->
    <el-input
      v-else-if="field.type === 'textarea'"
      v-model="localValue"
      type="textarea"
      :rows="field.rows || 4"
      :placeholder="field.placeholder || '请输入'"
      :maxlength="field.maxLength"
      :show-word-limit="field.maxLength"
      :disabled="field.disabled"
      @change="handleChange"
    />

    <!-- 富文本编辑器 -->
    <div v-else-if="field.type === 'editor'" class="rich-editor-wrapper">
      <el-input
        v-model="localValue"
        type="textarea"
        :rows="field.rows || 6"
        :placeholder="field.placeholder || '请输入'"
        :disabled="field.disabled"
        @change="handleChange"
      />
      <div class="editor-toolbar">
        <el-button size="small" text>加粗</el-button>
        <el-button size="small" text>斜体</el-button>
        <el-button size="small" text>下划线</el-button>
        <el-button size="small" text>插入图片</el-button>
      </div>
    </div>

    <!-- 数字输入 -->
    <el-input-number
      v-else-if="field.type === 'number'"
      v-model="localValue"
      :placeholder="field.placeholder || '请输入'"
      :min="field.min"
      :max="field.max"
      :precision="field.precision"
      :step="field.step || 1"
      :disabled="field.disabled"
      :controls-position="field.controlsPosition || 'right'"
      style="width: 200px"
      @change="handleChange"
    />

    <!-- 单选 -->
    <el-radio-group
      v-else-if="field.type === 'radio'"
      v-model="localValue"
      :disabled="field.disabled"
      @change="handleChange"
    >
      <el-radio
        v-for="opt in field.options"
        :key="opt.value"
        :label="opt.value"
      >
        {{ opt.label }}
      </el-radio>
    </el-radio-group>

    <!-- 多选 -->
    <el-checkbox-group
      v-else-if="field.type === 'checkbox'"
      v-model="localValue"
      :disabled="field.disabled"
      @change="handleChange"
    >
      <el-checkbox
        v-for="opt in field.options"
        :key="opt.value"
        :label="opt.value"
      >
        {{ opt.label }}
      </el-checkbox>
    </el-checkbox-group>

    <!-- 下拉选择 -->
    <el-select
      v-else-if="field.type === 'select'"
      v-model="localValue"
      :placeholder="field.placeholder || '请选择'"
      :disabled="field.disabled"
      :multiple="field.multiple"
      :clearable="field.clearable !== false"
      style="width: 100%"
      @change="handleChange"
    >
      <el-option
        v-for="opt in field.options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <!-- 级联选择 -->
    <el-cascader
      v-else-if="field.type === 'cascader'"
      v-model="localValue"
      :options="field.options"
      :placeholder="field.placeholder || '请选择'"
      :disabled="field.disabled"
      :clearable="field.clearable !== false"
      :props="field.props || {}"
      style="width: 100%"
      @change="handleChange"
    />

    <!-- 日期选择 -->
    <el-date-picker
      v-else-if="field.type === 'date'"
      v-model="localValue"
      type="date"
      :placeholder="field.placeholder || '选择日期'"
      :disabled="field.disabled"
      :clearable="field.clearable !== false"
      :value-format="field.valueFormat || 'YYYY-MM-DD'"
      style="width: 100%"
      @change="handleChange"
    />

    <!-- 日期范围选择 -->
    <el-date-picker
      v-else-if="field.type === 'dateRange'"
      v-model="localValue"
      type="daterange"
      :placeholder="field.placeholder || '选择日期范围'"
      :disabled="field.disabled"
      :clearable="field.clearable !== false"
      :value-format="field.valueFormat || 'YYYY-MM-DD'"
      style="width: 100%"
      @change="handleChange"
    />

    <!-- 时间选择 -->
    <el-time-picker
      v-else-if="field.type === 'time'"
      v-model="localValue"
      :placeholder="field.placeholder || '选择时间'"
      :disabled="field.disabled"
      :clearable="field.clearable !== false"
      :value-format="field.valueFormat || 'HH:mm:ss'"
      style="width: 100%"
      @change="handleChange"
    />

    <!-- 时间范围选择 -->
    <el-time-picker
      v-else-if="field.type === 'timeRange'"
      v-model="localValue"
      is-range
      :placeholder="field.placeholder || '选择时间范围'"
      :disabled="field.disabled"
      :clearable="field.clearable !== false"
      :value-format="field.valueFormat || 'HH:mm:ss'"
      style="width: 100%"
      @change="handleChange"
    />

    <!-- 开关 -->
    <el-switch
      v-else-if="field.type === 'switch'"
      v-model="localValue"
      :disabled="field.disabled"
      :active-text="field.activeText"
      :inactive-text="field.inactiveText"
      @change="handleChange"
    />

    <!-- 滑块 -->
    <div v-else-if="field.type === 'slider'" class="slider-wrapper">
      <el-slider
        v-model="localValue"
        :min="field.min || 0"
        :max="field.max || 100"
        :step="field.step || 1"
        :disabled="field.disabled"
        :marks="field.marks"
        @change="handleChange"
      />
      <span v-if="field.showValue" class="slider-value">{{ localValue }}</span>
    </div>

    <!-- 评分 -->
    <div v-else-if="field.type === 'rate'" class="rate-wrapper">
      <el-rate
        v-model="localValue"
        :max="field.max || 5"
        :disabled="field.disabled"
        :allow-half="field.allowHalf"
        :texts="field.texts"
        show-text
        @change="handleChange"
      />
    </div>

    <!-- 颜色选择器 -->
    <el-color-picker
      v-else-if="field.type === 'color'"
      v-model="localValue"
      :disabled="field.disabled"
      @change="handleChange"
    />

    <!-- 文件上传 -->
    <el-upload
      v-else-if="field.type === 'upload'"
      v-model:file-list="fileList"
      :action="uploadAction"
      :headers="uploadHeaders"
      :disabled="field.disabled || fileList.length >= (field.limit || 10)"
      :limit="field.limit || 10"
      :accept="field.accept"
      :on-success="handleUploadSuccess"
      :on-remove="handleUploadRemove"
      :before-upload="handleBeforeUpload"
      :on-exceed="handleExceed"
      :drag="field.drag"
      class="upload-component"
    >
      <el-button v-if="!field.drag" type="primary" :icon="Upload">
        点击上传
      </el-button>
      <div v-else class="upload-drag-area">
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
      </div>
    </el-upload>

    <!-- 图片上传 -->
    <el-upload
      v-else-if="field.type === 'image'"
      v-model:file-list="imageList"
      :action="uploadAction"
      :headers="uploadHeaders"
      :disabled="field.disabled || imageList.length >= (field.limit || 9)"
      :limit="field.limit || 9"
      :accept="field.accept || 'image/*'"
      :on-success="handleImageSuccess"
      :on-remove="handleImageRemove"
      :before-upload="handleBeforeImageUpload"
      :on-exceed="handleExceed"
      list-type="picture-card"
      class="image-upload-component"
    >
      <el-icon><Plus /></el-icon>
    </el-upload>

    <!-- 字段提示 -->
    <div v-if="field.tips" class="field-tips">
      <el-icon><InfoFilled /></el-icon>
      <span>{{ field.tips }}</span>
    </div>
  </el-form-item>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Plus, Upload, UploadFilled, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Array, Object, Date],
    default: undefined
  },
  field: {
    type: Object,
    required: true
  },
  formData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const localValue = ref(props.modelValue)
const fileList = ref([])
const imageList = ref([])

// 上传配置
const uploadAction = '/api/upload'
const uploadHeaders = {}

// 是否显示字段（联动控制）
const visible = computed(() => {
  return props.field.visible !== false
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// 值变化处理
const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

// 文件上传成功
const handleUploadSuccess = (response, file) => {
  fileList.value.push({
    name: file.name,
    url: response.url || file.url,
    raw: file
  })
  handleChange(fileList.value.map(f => f.url))
}

// 文件移除
const handleUploadRemove = (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
    handleChange(fileList.value.map(f => f.url))
  }
}

// 上传前校验
const handleBeforeUpload = (file) => {
  const sizeLimit = props.field.sizeLimit || 10 * 1024 * 1024 // 默认10MB
  if (file.size > sizeLimit) {
    ElMessage.error(`文件大小不能超过 ${(sizeLimit / 1024 / 1024).toFixed(1)}MB`)
    return false
  }
  return true
}

// 图片上传成功
const handleImageSuccess = (response, file) => {
  imageList.value.push({
    name: file.name,
    url: response.url || file.url,
    raw: file
  })
  handleChange(imageList.value.map(f => f.url))
}

// 图片移除
const handleImageRemove = (file) => {
  const index = imageList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    imageList.value.splice(index, 1)
    handleChange(imageList.value.map(f => f.url))
  }
}

// 图片上传前校验
const handleBeforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const sizeLimit = props.field.sizeLimit || 5 * 1024 * 1024 // 默认5MB
  if (file.size > sizeLimit) {
    ElMessage.error(`图片大小不能超过 ${(sizeLimit / 1024 / 1024).toFixed(1)}MB`)
    return false
  }
  return true
}

// 超出限制
const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${props.field.limit || 10} 个文件`)
}
</script>

<style scoped lang="scss">
.dynamic-form-item {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #303133;
  }
}

.rich-editor-wrapper {
  .el-textarea {
    margin-bottom: 8px;
  }

  .editor-toolbar {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    border-top: none;
    border-radius: 0 0 4px 4px;
  }
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;

  .el-slider {
    flex: 1;
  }

  .slider-value {
    min-width: 60px;
    text-align: center;
    font-weight: 600;
    color: var(--el-color-primary);
  }
}

.rate-wrapper {
  padding: 8px 0;
}

.field-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f7ff;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;

  .el-icon {
    color: var(--el-color-primary);
    font-size: 14px;
  }
}

.upload-component {
  width: 100%;

  .upload-drag-area {
    padding: 40px 0;
    text-align: center;

    .upload-icon {
      font-size: 48px;
      color: #c0c4cc;
      margin-bottom: 16px;
    }

    .upload-text {
      font-size: 14px;
      color: #606266;

      em {
        color: var(--el-color-primary);
        font-style: normal;
      }
    }
  }
}

.image-upload-component {
  :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
  }

  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 100px;
    height: 100px;
  }
}
</style>
