<template>
  <div class="preliminary-list-page">
    <div class="page-header">
      <h2 class="page-title">资格初审列表</h2>
      <p class="page-desc">查看和处理所有待初审的申报项目</p>
    </div>

    <!-- 搜索条件 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="filters" inline>
        <el-form-item label="机构名称">
          <el-input v-model="filters.orgName" placeholder="请输入机构名称" clearable />
        </el-form-item>
        <el-form-item label="初审状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待初审" value="pending" />
            <el-option label="初审中" value="processing" />
            <el-option label="初审通过" value="passed" />
            <el-option label="初审不通过" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="preliminaryList" stripe style="width: 100%">
        <el-table-column prop="orgName" label="申报机构" min-width="180" />
        <el-table-column prop="projectName" label="项目名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="applyAmount" label="申请金额" width="120" align="center">
          <template #default="{ row }">
            {{ row.applyAmount }}万元
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申报时间" width="180" />
        <el-table-column label="初审状态" width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" :status-map="statusMap" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button link type="success" :icon="Check" @click="handleApprove(row)">通过</el-button>
            <el-button link type="danger" :icon="Close" @click="handleReject(row)">不通过</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Search, Refresh, View, Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'

const filters = reactive({
  orgName: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const statusMap = {
  pending: { label: '待初审', type: 'warning' },
  processing: { label: '初审中', type: 'primary' },
  passed: { label: '初审通过', type: 'success' },
  rejected: { label: '初审不通过', type: 'danger' }
}

const preliminaryList = ref([
  {
    id: '1',
    orgName: '市体育中心',
    projectName: '全民健身中心建设项目',
    applyAmount: 200,
    applyTime: '2024-03-01 10:30:00',
    status: 'pending'
  },
  {
    id: '2',
    orgName: '区体育局',
    projectName: '社区健身器材配备',
    applyAmount: 50,
    applyTime: '2024-03-02 14:20:00',
    status: 'processing'
  },
  {
    id: '3',
    orgName: '青少年体育俱乐部',
    projectName: '青少年体育培训基地',
    applyAmount: 100,
    applyTime: '2024-03-03 09:15:00',
    status: 'passed'
  }
])

const handleSearch = () => {
  console.log('搜索:', filters)
}

const handleReset = () => {
  filters.orgName = ''
  filters.status = ''
}

const handleView = (row) => {
  console.log('查看:', row)
}

const handleApprove = (row) => {
  ElMessage.success(`已通过 ${row.orgName} 的初审`)
}

const handleReject = (row) => {
  ElMessage.warning(`已驳回 ${row.orgName} 的申请`)
}
</script>

<style scoped lang="scss">
.preliminary-list-page {
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
