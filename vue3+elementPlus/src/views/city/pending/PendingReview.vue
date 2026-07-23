<template>
  <div class="pending-review-page">
    <div class="page-header">
      <h2 class="page-title">待审核</h2>
      <p class="page-desc">审核辖区内机构的申报材料</p>
    </div>

    <!-- 搜索条件 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="filters" inline>
        <el-form-item label="机构名称">
          <el-input v-model="filters.orgName" placeholder="请输入机构名称" clearable />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-select v-model="filters.projectType" placeholder="请选择" clearable>
            <el-option label="场馆建设" value="venue" />
            <el-option label="赛事活动" value="event" />
            <el-option label="器材配备" value="equipment" />
            <el-option label="培训指导" value="training" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 待审核列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="pendingList" stripe style="width: 100%">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orgName" label="申报机构" min-width="180" />
        <el-table-column prop="projectName" label="项目名称" min-width="200" />
        <el-table-column prop="projectType" label="项目类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.projectType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyAmount" label="申请金额" width="120" align="center">
          <template #default="{ row }">
            {{ row.applyAmount }}万元
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申报时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button link type="success" :icon="Check" @click="handleApprove(row)">通过</el-button>
            <el-button link type="danger" :icon="Close" @click="handleReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="dialogVisible" title="审核意见" width="500px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.result">
            <el-radio label="approve">通过</el-radio>
            <el-radio label="reject">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="reviewForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReview">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Search, Refresh, View, Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const filters = reactive({
  orgName: '',
  projectType: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const pendingList = ref([
  {
    id: '1',
    orgName: '市体育中心',
    projectName: '全民健身中心建设项目',
    projectType: '场馆建设',
    applyAmount: 200,
    applyTime: '2024-03-01 10:30:00'
  },
  {
    id: '2',
    orgName: '区体育局',
    projectName: '社区健身器材配备',
    projectType: '器材配备',
    applyAmount: 50,
    applyTime: '2024-03-02 14:20:00'
  },
  {
    id: '3',
    orgName: '青少年体育俱乐部',
    projectName: '青少年体育培训基地',
    projectType: '培训指导',
    applyAmount: 100,
    applyTime: '2024-03-03 09:15:00'
  }
])

const dialogVisible = ref(false)
const reviewForm = reactive({
  result: 'approve',
  comment: ''
})

const handleSearch = () => {
  console.log('搜索:', filters)
}

const handleReset = () => {
  filters.orgName = ''
  filters.projectType = ''
  filters.dateRange = []
}

const handleView = (row) => {
  console.log('查看:', row)
}

const handleApprove = (row) => {
  dialogVisible.value = true
  reviewForm.result = 'approve'
  reviewForm.comment = ''
}

const handleReject = (row) => {
  dialogVisible.value = true
  reviewForm.result = 'reject'
  reviewForm.comment = ''
}

const handleSubmitReview = () => {
  dialogVisible.value = false
  ElMessage.success('审核完成')
}
</script>

<style scoped lang="scss">
.pending-review-page {
  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    .el-pagination {
      margin-top: 16px;
      justify-content: flex-end;
    }
  }
}
</style>
