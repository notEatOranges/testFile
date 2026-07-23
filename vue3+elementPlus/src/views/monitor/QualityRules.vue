<template>
  <div class="quality-rules-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">数据质控规则</h2>
      <p class="page-desc">管理数据质量检查规则，配置规则参数和执行策略</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
      <el-button :icon="Refresh" @click="loadRules">刷新</el-button>
    </el-card>

    <!-- 规则列表 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="rulesList" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="ruleName" label="规则名称" min-width="180" />
        <el-table-column prop="ruleCode" label="规则编码" width="180" />
        <el-table-column prop="ruleType" label="规则类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getRuleTypeColor(row.ruleType)" size="small">
              {{ getRuleTypeName(row.ruleType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetTable" label="目标表" width="150" />
        <el-table-column prop="targetField" label="目标字段" width="120" />
        <el-table-column prop="severity" label="严重级别" width="90">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" size="small">
              {{ getSeverityLabel(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isEnabled" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.isEnabled"
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastExecuteTime" label="最后执行" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleTest(row)">
              测试
            </el-button>
            <el-button type="primary" link size="small" @click="handleHistory(row)">
              历史
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑规则' : '新增规则'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="formData.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则编码" prop="ruleCode">
          <el-input v-model="formData.ruleCode" placeholder="请输入规则编码（英文）" />
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="formData.ruleType" placeholder="请选择规则类型">
            <el-option label="完整性" value="completeness" />
            <el-option label="准确性" value="accuracy" />
            <el-option label="一致性" value="consistency" />
            <el-option label="时效性" value="timeliness" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标表" prop="targetTable">
          <el-input v-model="formData.targetTable" placeholder="请输入目标表名" />
        </el-form-item>
        <el-form-item label="目标字段" prop="targetField">
          <el-input v-model="formData.targetField" placeholder="请输入目标字段名" />
        </el-form-item>
        <el-form-item label="规则表达式" prop="ruleExpression">
          <el-input
            v-model="formData.ruleExpression"
            type="textarea"
            :rows="4"
            placeholder="请输入规则表达式，如：field !== null && field !== ''"
          />
          <div class="form-tip">
            使用 <code>field</code> 代表当前字段，支持 JavaScript 表达式
          </div>
        </el-form-item>
        <el-form-item label="严重级别" prop="severity">
          <el-radio-group v-model="formData.severity">
            <el-radio label="high">高</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 执行历史弹窗 -->
    <el-dialog
      v-model="historyVisible"
      title="规则执行历史"
      width="800px"
    >
      <el-table :data="historyList" stripe>
        <el-table-column prop="executeTime" label="执行时间" width="160" />
        <el-table-column prop="recordCount" label="检查记录数" width="100" />
        <el-table-column prop="errorCount" label="异常记录数" width="100" />
        <el-table-column prop="errorRate" label="异常率" width="80" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button type="primary" link size="small">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import mockData from '@/mock/monitor'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const historyVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const rulesList = ref([])
const historyList = ref([])

// 表单数据
const formData = ref({
  ruleName: '',
  ruleCode: '',
  ruleType: '',
  targetTable: '',
  targetField: '',
  ruleExpression: '',
  severity: 'medium',
  description: ''
})

// 表单校验规则
const formRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleCode: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  targetTable: [{ required: true, message: '请输入目标表', trigger: 'blur' }],
  targetField: [{ required: true, message: '请输入目标字段', trigger: 'blur' }],
  ruleExpression: [{ required: true, message: '请输入规则表达式', trigger: 'blur' }]
}

// 获取规则类型名称
const getRuleTypeName = (type) => {
  const map = {
    completeness: '完整性',
    accuracy: '准确性',
    consistency: '一致性',
    timeliness: '时效性'
  }
  return map[type] || type
}

// 获取规则类型颜色
const getRuleTypeColor = (type) => {
  const map = {
    completeness: 'success',
    accuracy: 'primary',
    consistency: 'warning',
    timeliness: 'info'
  }
  return map[type] || ''
}

// 获取严重级别标签
const getSeverityLabel = (severity) => {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[severity] || severity
}

// 获取严重级别类型
const getSeverityType = (severity) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return map[severity] || ''
}

// 加载规则列表
const loadRules = () => {
  loading.value = true
  setTimeout(() => {
    rulesList.value = [...mockData.qualityRules]
    loading.value = false
  }, 500)
}

// 新增规则
const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    ruleName: '',
    ruleCode: '',
    ruleType: '',
    targetTable: '',
    targetField: '',
    ruleExpression: '',
    severity: 'medium',
    description: ''
  }
  dialogVisible.value = true
}

// 编辑规则
const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除规则
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除规则"${row.ruleName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = rulesList.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      rulesList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 切换规则状态
const handleToggle = (row) => {
  ElMessage.success(`规则"${row.ruleName}"已${row.isEnabled ? '启用' : '禁用'}`)
}

// 测试规则
const handleTest = (row) => {
  ElMessage.info(`测试规则"${row.ruleName}"功能开发中...`)
}

// 查看历史
const handleHistory = (row) => {
  historyList.value = mockData.ruleHistory.filter(item => item.ruleId === row.id)
  historyVisible.value = true
}

// 提交表单
const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = rulesList.value.findIndex(item => item.id === formData.value.id)
        if (index > -1) {
          rulesList.value[index] = { ...formData.value }
          ElMessage.success('更新成功')
        }
      } else {
        rulesList.value.unshift({
          id: String(Date.now()),
          ...formData.value,
          lastExecuteTime: '-',
          executeCount: 0,
          errorCount: 0,
          errorRate: '-'
        })
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
    }
  })
}

// 初始化
onMounted(() => {
  loadRules()
})
</script>

<style scoped lang="scss">
.quality-rules-page {
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

  .action-card,
  .table-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: #999;

    code {
      padding: 2px 4px;
      background: #f5f5f5;
      border-radius: 3px;
      color: #e96900;
    }
  }
}
</style>
