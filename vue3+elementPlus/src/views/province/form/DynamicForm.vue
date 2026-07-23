<template>
  <div class="dynamic-form-page">
    <el-page-header @back="handleBack" class="page-header">
      <template #content>
        <span class="page-title">{{ formConfig.title || '动态表单' }}</span>
      </template>
    </el-page-header>

    <div class="form-container">
      <!-- 表单头部信息 -->
      <div v-if="formConfig.description" class="form-header-card">
        <h3>{{ formConfig.description }}</h3>
        <p v-if="formConfig.tips" class="form-tips">
          <el-icon><Warning /></el-icon>
          {{ formConfig.tips }}
        </p>
      </div>

      <!-- 动态表单 -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        class="dynamic-form"
      >
        <!-- 遍历表单配置 -->
        <template v-for="field in formConfig.fields" :key="field.fieldKey">
          <!-- 分组标题 -->
          <div v-if="field.type === 'group'" class="form-group">
            <div class="group-title">
              <span class="group-index">{{ field.index }}</span>
              <span>{{ field.label }}</span>
            </div>
            <div v-if="field.description" class="group-description">{{ field.description }}</div>

            <!-- 分组内的字段 -->
            <div class="group-fields">
              <template v-for="subField in field.fields" :key="subField.fieldKey">
                <form-field
                  v-model="formData[subField.fieldKey]"
                  :field="subField"
                  :form-data="formData"
                  @change="handleFieldChange(subField.fieldKey, $event)"
                />
              </template>
            </div>
          </div>

          <!-- 独立字段 -->
          <form-field
            v-else
            v-model="formData[field.fieldKey]"
            :field="field"
            :form-data="formData"
            @change="handleFieldChange(field.fieldKey, $event)"
          />
        </template>
      </el-form>

      <!-- 表单操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleBack">取消</el-button>
        <el-button type="info" :icon="Document" @click="handleSaveDraft" :loading="saving">
          保存草稿
        </el-button>
        <el-button type="primary" :icon="Check" @click="handleSubmit" :loading="submitting">
          提交
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, Document, Check } from '@element-plus/icons-vue'
import FormField from './FormField.vue'

const router = useRouter()
const route = useRoute()

const formRef = ref()
const formData = reactive({})
const formRules = reactive({})
const saving = ref(false)
const submitting = ref(false)

// 表单配置（实际应从接口获取）
const formConfig = ref({
  title: '体育场地补助申报表',
  description: '请按照要求填写以下信息，确保真实准确',
  tips: '标 * 的为必填项，请务必填写完整',
  fields: []
})

// 从字段配置生成表单数据和验证规则
const initFormFromConfig = (config) => {
  config.fields.forEach(field => {
    if (field.type === 'group') {
      // 分组类型，处理子字段
      field.fields?.forEach(subField => {
        initField(subField)
      })
    } else {
      initField(field)
    }
  })
}

// 初始化单个字段
const initField = (field) => {
  // 设置默认值
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
      case 'number':
        formData[field.fieldKey] = null
        break
      case 'date':
      case 'dateRange':
        formData[field.fieldKey] = null
        break
      default:
        formData[field.fieldKey] = ''
    }
  }

  // 生成验证规则
  if (field.required) {
    formRules[field.fieldKey] = [
      {
        required: true,
        message: field.placeholder || `请${getInputAction(field.type)}${field.label}`,
        trigger: getTriggerType(field.type)
      }
    ]
  }

  // 自定义验证规则
  if (field.rules && field.rules.length > 0) {
    formRules[field.fieldKey] = [
      ...(formRules[field.fieldKey] || []),
      ...field.rules
    ]
  }
}

// 获取输入动作文案
const getInputAction = (type) => {
  const inputTypes = ['input', 'textarea', 'editor']
  const selectTypes = ['select', 'radio', 'checkbox', 'date', 'dateRange', 'cascader']

  if (inputTypes.includes(type)) return '输入'
  if (selectTypes.includes(type)) return '选择'
  if (type === 'upload' || type === 'image') return '上传'
  return '填写'
}

// 验证触发方式
const getTriggerType = (type) => {
  const changeTypes = ['radio', 'checkbox', 'select', 'switch', 'cascader']
  return changeTypes.includes(type) ? 'change' : 'blur'
}

// 字段值变化处理
const handleFieldChange = (fieldKey, value) => {
  formData[fieldKey] = value

  // 处理联动逻辑
  handleLinkage(fieldKey, value)
}

// 处理字段联动
const handleLinkage = (fieldKey, value) => {
  // 根据字段值变化，显示/隐藏其他字段
  formConfig.value.fields.forEach(field => {
    if (field.type === 'group') {
      field.fields?.forEach(subField => {
        if (subField.linkage && subField.linkage.field === fieldKey) {
          subField.visible = subField.linkage.values.includes(value)
        }
      })
    } else {
      if (field.linkage && field.linkage.field === fieldKey) {
        field.visible = field.linkage.values.includes(value)
      }
    }
  })
}

// 保存草稿
const handleSaveDraft = async () => {
  saving.value = true
  try {
    // TODO: 调用保存草稿接口
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    // 验证表单
    await formRef.value.validate()

    await ElMessageBox.confirm(
      '确认提交表单？提交后将无法修改。',
      '提示',
      {
        confirmButtonText: '确认提交',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    submitting.value = true
    // TODO: 调用提交接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('提交成功')
    router.back()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

// 返回
const handleBack = () => {
  router.back()
}

// 加载表单配置
onMounted(async () => {
  try {
    // 实际应从接口获取表单配置
    // const config = await getFormConfig(route.query.id)
    // formConfig.value = config

    // 临时使用模拟数据
    formConfig.value = getMockFormConfig()
    initFormFromConfig(formConfig.value)
  } catch (error) {
    ElMessage.error('加载表单配置失败')
  }
})

// 模拟数据
const getMockFormConfig = () => ({
  title: '体育场馆补助申报表',
  description: '请按照要求填写以下信息，确保真实准确',
  tips: '标 * 的为必填项，请务必填写完整',
  fields: [
    {
      type: 'group',
      label: '基本信息',
      index: 1,
      description: '请填写场馆的基本信息',
      fields: [
        {
          fieldKey: 'venueName',
          type: 'input',
          label: '场馆名称',
          placeholder: '请输入场馆名称',
          required: true,
          maxLength: 100
        },
        {
          fieldKey: 'venueType',
          type: 'select',
          label: '场馆类型',
          placeholder: '请选择场馆类型',
          required: true,
          options: [
            { label: '体育场', value: 'stadium' },
            { label: '体育馆', value: 'gymnasium' },
            { label: '游泳馆', value: 'natatorium' },
            { label: '综合馆', value: 'complex' }
          ]
        },
        {
          fieldKey: 'address',
          type: 'input',
          label: '场馆地址',
          placeholder: '请输入详细地址',
          required: true,
          maxLength: 200
        },
        {
          fieldKey: 'area',
          type: 'number',
          label: '建筑面积（平方米）',
          placeholder: '请输入建筑面积',
          required: true,
          min: 0,
          precision: 2
        }
      ]
    },
    {
      type: 'group',
      label: '设施情况',
      index: 2,
      description: '请填写场馆设施相关情况',
      fields: [
        {
          fieldKey: 'hasParking',
          type: 'radio',
          label: '是否有停车场',
          required: true,
          options: [
            { label: '有', value: true },
            { label: '无', value: false }
          ]
        },
        {
          fieldKey: 'parkingSpaces',
          type: 'number',
          label: '停车位数',
          placeholder: '请输入停车位数',
          required: true,
          min: 0,
          linkage: {
            field: 'hasParking',
            values: [true]
          }
        },
        {
          fieldKey: 'facilities',
          type: 'checkbox',
          label: '配套设施',
          options: [
            { label: '更衣室', value: 'changing' },
            { label: '淋浴间', value: 'shower' },
            { label: '休息区', value: 'rest' },
            { label: '医疗室', value: 'medical' },
            { label: '商店', value: 'shop' }
          ]
        },
        {
          fieldKey: 'openTime',
          type: 'dateRange',
          label: '开放时间范围',
          placeholder: '选择开放时间范围',
          required: true
        }
      ]
    },
    {
      type: 'group',
      label: '附件上传',
      index: 3,
      fields: [
        {
          fieldKey: 'photos',
          type: 'image',
          label: '场馆照片',
          placeholder: '请上传场馆照片',
          required: true,
          limit: 9,
          tips: '支持jpg、png格式，单张图片不超过5MB，最多上传9张'
        },
        {
          fieldKey: 'license',
          type: 'upload',
          label: '营业执照',
          placeholder: '请上传营业执照',
          required: true,
          limit: 1,
          accept: '.pdf,.jpg,.png',
          tips: '支持pdf、jpg、png格式，文件不超过10MB'
        },
        {
          fieldKey: 'otherFiles',
          type: 'upload',
          label: '其他证明材料',
          placeholder: '请上传相关证明材料',
          limit: 5,
          accept: '.pdf,.doc,.docx,.jpg,.png',
          tips: '支持pdf、doc、docx、jpg、png格式，文件不超过20MB'
        }
      ]
    }
  ]
})
</script>

<style scoped lang="scss">
.dynamic-form-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;

  .page-header {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .form-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .form-header-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

    h3 {
      margin: 0 0 12px;
      font-size: 20px;
      font-weight: 600;
    }

    .form-tips {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 14px;
      opacity: 0.95;

      .el-icon {
        font-size: 16px;
      }
    }
  }

  .dynamic-form {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;

    .form-group {
      margin-bottom: 32px;

      &:last-child {
        margin-bottom: 0;
      }

      .group-title {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 20px;

        .group-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          font-size: 14px;
        }
      }

      .group-description {
        padding: 12px 16px;
        background: #f0f7ff;
        border-left: 3px solid var(--el-color-primary);
        border-radius: 4px;
        color: #606266;
        font-size: 14px;
        margin-bottom: 20px;
      }

      .group-fields {
        padding: 0 8px;
      }
    }
  }

  .form-actions {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    .el-button {
      min-width: 120px;
    }
  }
}
</style>
