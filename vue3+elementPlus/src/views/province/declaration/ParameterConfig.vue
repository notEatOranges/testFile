<template>
  <div class="parameter-config-page">
    <div class="page-header">
      <h2 class="page-title">申报参数配置</h2>
      <p class="page-desc">配置年度申报的参数和评审时间</p>
    </div>

    <!-- 操作栏 -->
    <el-card shadow="never" class="action-card">
      <el-button type="primary" :icon="Plus" @click="handleCreate">新增参数配置</el-button>
    </el-card>

    <!-- 参数列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="declarationList" stripe style="width: 100%">
        <el-table-column prop="name" label="配置名称" min-width="200" />
        <el-table-column prop="year" label="年度" width="100" />
        <el-table-column label="申报时间" width="300">
          <template #default="{ row }">
            {{ formatDate(row.declarationStart) }} 至 {{ formatDate(row.declarationEnd) }}
          </template>
        </el-table-column>
        <el-table-column label="评审时间" width="300">
          <template #default="{ row }">
            {{ formatDate(row.reviewStartTime) }} 至 {{ formatDate(row.reviewEndTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalQuota" label="总配额" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="handleWithdraw(row)">撤回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑参数配置' : '新增参数配置'"
      width="600px"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="年度" prop="year">
          <el-date-picker
            v-model="formData.year"
            type="year"
            placeholder="请选择年度"
            value-format="YYYY"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="申报开始时间" prop="declarationStart">
          <el-date-picker
            v-model="formData.declarationStart"
            type="datetime"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="申报结束时间" prop="declarationEnd">
          <el-date-picker
            v-model="formData.declarationEnd"
            type="datetime"
            placeholder="请选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="评审开始时间" prop="reviewStartTime">
          <el-date-picker
            v-model="formData.reviewStartTime"
            type="datetime"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="评审结束时间" prop="reviewEndTime">
          <el-date-picker
            v-model="formData.reviewEndTime"
            type="datetime"
            placeholder="请选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="总配额" prop="totalQuota">
          <el-input-number v-model="formData.totalQuota" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="active" />
            <el-option label="已结束" value="closed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, View, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDate } from '@/utils/format'

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const declarationList = ref([
  {
    id: '1',
    name: '2024年度申报配置',
    year: '2024',
    declarationStart: '2024-01-01T00:00:00',
    declarationEnd: '2024-06-30T23:59:59',
    reviewStartTime: '2024-07-01T00:00:00',
    reviewEndTime: '2024-09-30T23:59:59',
    totalQuota: 100,
    status: 'active'
  },
  {
    id: '2',
    name: '2023年度申报配置',
    year: '2023',
    declarationStart: '2023-01-01T00:00:00',
    declarationEnd: '2023-06-30T23:59:59',
    reviewStartTime: '2023-07-01T00:00:00',
    reviewEndTime: '2023-09-30T23:59:59',
    totalQuota: 80,
    status: 'closed'
  }
])

const formData = reactive({
  id: '',
  name: '',
  year: '',
  declarationStart: '',
  declarationEnd: '',
  reviewStartTime: '',
  reviewEndTime: '',
  totalQuota: 100,
  status: 'draft'
})

const formRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  year: [{ required: true, message: '请选择年度', trigger: 'change' }],
  declarationStart: [{ required: true, message: '请选择申报开始时间', trigger: 'change' }],
  declarationEnd: [{ required: true, message: '请选择申报结束时间', trigger: 'change' }],
  reviewStartTime: [{ required: true, message: '请选择评审开始时间', trigger: 'change' }],
  reviewEndTime: [{ required: true, message: '请选择评审结束时间', trigger: 'change' }],
  totalQuota: [{ required: true, message: '请输入总配额', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const map = {
    draft: 'info',
    active: 'success',
    closed: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    draft: '草稿',
    active: '进行中',
    closed: '已结束'
  }
  return map[status] || status
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: '',
    name: '',
    year: '',
    declarationStart: '',
    declarationEnd: '',
    reviewStartTime: '',
    reviewEndTime: '',
    totalQuota: 100,
    status: 'draft'
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleView = (row) => {
  console.log('查看:', row)
}

const handleWithdraw = (row) => {
  console.log('撤回:', row)
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    dialogVisible.value = false
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
  } catch {
    // 验证失败
  }
}

onMounted(() => {
  // 加载数据
})
</script>

<style scoped lang="scss">
.parameter-config-page {
  .action-card {
    margin-bottom: 16px;
  }
}
</style>
