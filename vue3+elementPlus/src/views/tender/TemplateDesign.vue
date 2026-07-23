<template>
  <div class="template-design-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">模板设计</h2>
      <p class="page-desc">配置招标申请模板，定义表单字段和校验规则</p>
    </div>

    <!-- 模板列表 -->
    <el-card v-if="!currentTemplate" class="template-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>模板列表</span>
          <el-button type="primary" size="small" :icon="Plus" @click="handleCreateTemplate">
            新建模板
          </el-button>
        </div>
      </template>
      <el-table :data="templateList" stripe>
        <el-table-column prop="templateName" label="模板名称" min-width="200" />
        <el-table-column prop="templateType" label="模板类型" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ getTemplateTypeName(row.templateType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="isEnabled" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
              {{ row.isEnabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEditTemplate(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handleCopyTemplate(row)">
              复制
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleToggleTemplate(row)"
            >
              {{ row.isEnabled ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDeleteTemplate(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 模板编辑器 -->
    <el-card v-else class="template-editor-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button :icon="ArrowLeft" link @click="handleBackToList">
              返回列表
            </el-button>
            <span class="template-title">{{ isEditMode ? '编辑模板' : '新建模板' }}</span>
          </div>
          <div class="header-right">
            <el-button @click="handlePreview">预览</el-button>
            <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
          </div>
        </div>
      </template>

      <!-- 基本信息 -->
      <el-form :model="templateInfo" label-width="100px" class="template-info-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="模板名称">
              <el-input v-model="templateInfo.templateName" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="模板类型">
              <el-select v-model="templateInfo.templateType" placeholder="请选择模板类型">
                <el-option label="资金补助申请" value="fund_application" />
                <el-option label="场地评估" value="facility_evaluation" />
                <el-option label="资质审核" value="qualification_audit" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="版本号">
              <el-input v-model="templateInfo.version" placeholder="v1.0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="生效日期">
              <el-date-picker
                v-model="templateInfo.effectiveDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="失效日期">
              <el-date-picker
                v-model="templateInfo.expiryDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用状态">
              <el-switch v-model="templateInfo.isEnabled" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 表单字段配置 -->
      <div class="fields-section">
        <div class="section-header">
          <span class="section-title">表单字段配置</span>
          <el-button type="primary" size="small" :icon="Plus" @click="handleAddField">
            添加字段
          </el-button>
        </div>

        <el-table :data="formFields" stripe>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="fieldName" label="字段名称" min-width="120" />
          <el-table-column prop="fieldCode" label="字段编码" width="120" />
          <el-table-column prop="fieldType" label="字段类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getFieldTypeName(row.fieldType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="required" label="必填" width="60">
            <template #default="{ row }">
              <el-icon v-if="row.required" color="#67c23a"><Select /></el-icon>
              <el-icon v-else color="#ccc"><Close /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="placeholder" label="提示文字" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEditField(row)">
                编辑
              </el-button>
              <el-button type="primary" link size="small" @click="handleMoveUp(row)">
                上移
              </el-button>
              <el-button type="primary" link size="small" @click="handleMoveDown(row)">
                下移
              </el-button>
              <el-button type="danger" link size="small" @click="handleDeleteField(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 添加/编辑字段弹窗 -->
    <el-dialog
      v-model="fieldDialogVisible"
      :title="isEditField ? '编辑字段' : '添加字段'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="fieldFormRef" :model="fieldForm" :rules="fieldRules" label-width="100px">
        <el-form-item label="字段名称" prop="fieldName">
          <el-input v-model="fieldForm.fieldName" placeholder="请输入字段名称，如：机构名称" />
        </el-form-item>
        <el-form-item label="字段编码" prop="fieldCode">
          <el-input v-model="fieldForm.fieldCode" placeholder="请输入字段编码，如：orgName" />
        </el-form-item>
        <el-form-item label="字段类型" prop="fieldType">
          <el-select v-model="fieldForm.fieldType" placeholder="请选择字段类型">
            <el-option label="文本输入" value="input" />
            <el-option label="数字输入" value="number" />
            <el-option label="下拉选择" value="select" />
            <el-option label="日期选择" value="date" />
            <el-option label="日期时间" value="datetime" />
            <el-option label="多行文本" value="textarea" />
            <el-option label="文件上传" value="upload" />
            <el-option label="开关" value="switch" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="fieldForm.required" />
        </el-form-item>
        <el-form-item v-if="fieldForm.fieldType === 'input' || fieldForm.fieldType === 'textarea'" label="最大长度">
          <el-input-number v-model="fieldForm.maxLength" :min="1" :max="500" />
        </el-form-item>
        <el-form-item v-if="fieldForm.fieldType === 'number'" label="最小值">
          <el-input-number v-model="fieldForm.min" />
        </el-form-item>
        <el-form-item v-if="fieldForm.fieldType === 'number'" label="最大值">
          <el-input-number v-model="fieldForm.max" />
        </el-form-item>
        <el-form-item v-if="fieldForm.fieldType === 'select'" label="选项配置">
          <el-input
            v-model="fieldForm.optionsStr"
            type="textarea"
            :rows="3"
            placeholder="每行一个选项，格式：显示值:实际值&#10;例如：&#10;体育俱乐部:club&#10;训练基地:base"
          />
        </el-form-item>
        <el-form-item v-if="fieldForm.fieldType === 'upload'" label="文件类型">
          <el-checkbox-group v-model="fieldForm.fileTypes">
            <el-checkbox label="image">图片</el-checkbox>
            <el-checkbox label="pdf">PDF</el-checkbox>
            <el-checkbox label="word">Word</el-checkbox>
            <el-checkbox label="excel">Excel</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="fieldForm.fieldType === 'upload'" label="文件数量限制">
          <el-input-number v-model="fieldForm.limit" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="正则校验">
          <el-input v-model="fieldForm.pattern" placeholder="请输入正则表达式，如：^\\d{11}$" />
        </el-form-item>
        <el-form-item label="提示文字">
          <el-input v-model="fieldForm.placeholder" placeholder="请输入提示文字" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fieldDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveField">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="模板预览"
      width="600px"
    >
      <el-form :model="previewForm" label-width="100px">
        <el-form-item
          v-for="field in formFields"
          :key="field.fieldCode"
          :label="field.fieldName"
          :required="field.required"
        >
          <!-- 文本输入 -->
          <el-input
            v-if="field.fieldType === 'input'"
            :placeholder="field.placeholder"
          />
          <!-- 数字输入 -->
          <el-input-number
            v-else-if="field.fieldType === 'number'"
            :placeholder="field.placeholder"
          />
          <!-- 下拉选择 -->
          <el-select
            v-else-if="field.fieldType === 'select'"
            :placeholder="field.placeholder"
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="field.fieldType === 'date'"
            :placeholder="field.placeholder"
          />
          <!-- 多行文本 -->
          <el-input
            v-else-if="field.fieldType === 'textarea'"
            type="textarea"
            :placeholder="field.placeholder"
          />
          <!-- 文件上传 -->
          <el-upload
            v-else-if="field.fieldType === 'upload'"
            action="#"
            :limit="field.limit"
          >
            <el-button type="primary">点击上传</el-button>
          </el-upload>
          <!-- 开关 -->
          <el-switch v-else-if="field.fieldType === 'switch'" />
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  Plus, ArrowLeft, Select, Close
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import tenderMock from '@/mock/tender'

// 响应式数据
const currentTemplate = ref(null)
const isEditMode = ref(false)
const fieldDialogVisible = ref(false)
const previewVisible = ref(false)
const isEditField = ref(false)
const fieldFormRef = ref(null)

// 模板列表
const templateList = ref([...tenderMock.templateList])

// 模板信息
const templateInfo = ref({
  templateName: '',
  templateType: '',
  version: 'v1.0',
  effectiveDate: '',
  expiryDate: '',
  isEnabled: true
})

// 表单字段
const formFields = ref([])

// 字段表单
const fieldForm = ref({
  fieldName: '',
  fieldCode: '',
  fieldType: 'input',
  required: false,
  maxLength: 100,
  min: undefined,
  max: undefined,
  optionsStr: '',
  options: [],
  fileTypes: [],
  limit: 3,
  pattern: '',
  placeholder: ''
})

// 字段校验规则
const fieldRules = {
  fieldName: [{ required: true, message: '请输入字段名称', trigger: 'blur' }],
  fieldCode: [{ required: true, message: '请输入字段编码', trigger: 'blur' }],
  fieldType: [{ required: true, message: '请选择字段类型', trigger: 'change' }]
}

// 预览表单
const previewForm = ref({})

// 获取模板类型名称
const getTemplateTypeName = (type) => {
  const map = {
    fund_application: '资金补助申请',
    facility_evaluation: '场地评估',
    qualification_audit: '资质审核'
  }
  return map[type] || type
}

// 获取字段类型名称
const getFieldTypeName = (type) => {
  const map = {
    input: '文本输入',
    number: '数字输入',
    select: '下拉选择',
    date: '日期选择',
    datetime: '日期时间',
    textarea: '多行文本',
    upload: '文件上传',
    switch: '开关'
  }
  return map[type] || type
}

// 创建模板
const handleCreateTemplate = () => {
  currentTemplate.value = {}
  isEditMode.value = false
  templateInfo.value = {
    templateName: '',
    templateType: '',
    version: 'v1.0',
    effectiveDate: '',
    expiryDate: '',
    isEnabled: true
  }
  formFields.value = []
}

// 编辑模板
const handleEditTemplate = (row) => {
  currentTemplate.value = row
  isEditMode.value = true
  templateInfo.value = { ...row }
  formFields.value = [...(row.formFields || [])]
}

// 复制模板
const handleCopyTemplate = (row) => {
  currentTemplate.value = { ...row, id: undefined }
  isEditMode.value = false
  templateInfo.value = {
    ...row,
    templateName: row.templateName + ' (副本)',
    id: undefined
  }
  formFields.value = [...(row.formFields || [])]
  ElMessage.success('模板已复制')
}

// 切换模板状态
const handleToggleTemplate = (row) => {
  row.isEnabled = !row.isEnabled
  ElMessage.success(`模板"${row.templateName}"已${row.isEnabled ? '启用' : '禁用'}`)
}

// 删除模板
const handleDeleteTemplate = (row) => {
  ElMessageBox.confirm(`确定要删除模板"${row.templateName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = templateList.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      templateList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 返回列表
const handleBackToList = () => {
  currentTemplate.value = null
}

// 保存模板
const handleSaveTemplate = () => {
  if (!templateInfo.value.templateName) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (formFields.value.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }

  const template = {
    ...templateInfo.value,
    formFields: formFields.value,
    updateTime: new Date().toLocaleString()
  }

  if (isEditMode.value) {
    const index = templateList.value.findIndex(item => item.id === currentTemplate.value.id)
    if (index > -1) {
      templateList.value[index] = { ...templateList.value[index], ...template }
      ElMessage.success('保存成功')
    }
  } else {
    template.id = String(Date.now())
    template.createTime = new Date().toLocaleString()
    templateList.value.unshift(template)
    ElMessage.success('创建成功')
  }

  currentTemplate.value = null
}

// 添加字段
const handleAddField = () => {
  isEditField.value = false
  fieldForm.value = {
    fieldName: '',
    fieldCode: '',
    fieldType: 'input',
    required: false,
    maxLength: 100,
    optionsStr: '',
    options: [],
    fileTypes: [],
    limit: 3,
    pattern: '',
    placeholder: ''
  }
  fieldDialogVisible.value = true
}

// 编辑字段
const handleEditField = (row) => {
  isEditField.value = true
  const index = formFields.value.findIndex(f => f === row)
  fieldForm.value = {
    ...row,
    optionsStr: row.options ? row.options.map(o => `${o.label}:${o.value}`).join('\n') : ''
  }
  fieldForm.value._index = index
  fieldDialogVisible.value = true
}

// 保存字段
const handleSaveField = () => {
  fieldFormRef.value.validate((valid) => {
    if (valid) {
      const field = {
        fieldName: fieldForm.value.fieldName,
        fieldCode: fieldForm.value.fieldCode,
        fieldType: fieldForm.value.fieldType,
        required: fieldForm.value.required,
        placeholder: fieldForm.value.placeholder
      }

      // 根据字段类型添加额外属性
      if (field.fieldType === 'input' || field.fieldType === 'textarea') {
        field.maxLength = fieldForm.value.maxLength
      }
      if (field.fieldType === 'number') {
        field.min = fieldForm.value.min
        field.max = fieldForm.value.max
      }
      if (field.fieldType === 'select') {
        field.options = fieldForm.value.optionsStr
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [label, value] = line.split(':')
            return { label: label.trim(), value: (value || label).trim() }
          })
      }
      if (field.fieldType === 'upload') {
        field.fileType = fieldForm.value.fileTypes
        field.limit = fieldForm.value.limit
      }
      if (fieldForm.value.pattern) {
        field.pattern = fieldForm.value.pattern
      }

      if (isEditField.value) {
        formFields.value[fieldForm.value._index] = field
      } else {
        formFields.value.push(field)
      }

      fieldDialogVisible.value = false
      ElMessage.success(isEditField.value ? '字段已更新' : '字段已添加')
    }
  })
}

// 上移字段
const handleMoveUp = (row) => {
  const index = formFields.value.findIndex(f => f === row)
  if (index > 0) {
    const temp = formFields.value[index]
    formFields.value[index] = formFields.value[index - 1]
    formFields.value[index - 1] = temp
  }
}

// 下移字段
const handleMoveDown = (row) => {
  const index = formFields.value.findIndex(f => f === row)
  if (index < formFields.value.length - 1) {
    const temp = formFields.value[index]
    formFields.value[index] = formFields.value[index + 1]
    formFields.value[index + 1] = temp
  }
}

// 删除字段
const handleDeleteField = (row) => {
  ElMessageBox.confirm('确定要删除该字段吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = formFields.value.findIndex(f => f === row)
    if (index > -1) {
      formFields.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 预览
const handlePreview = () => {
  previewVisible.value = true
}
</script>

<style scoped lang="scss">
.template-design-page {
  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .page-desc {
      font-size: 14px;
      color: #999;
      margin: 0;
    }
  }

  .template-list-card,
  .template-editor-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .template-title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
  }

  .template-info-form {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
  }

  .fields-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .section-title {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }
    }
  }
}
</style>
