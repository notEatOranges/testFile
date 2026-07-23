<template>
  <div class="summary-list-page">
    <div class="page-header">
      <h2 class="page-title">评分汇总</h2>
      <p class="page-desc">汇总书面评审和实地考察分数，确定补助对象</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">50</div>
              <div class="stat-label">申报总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">30</div>
              <div class="stat-label">符合考察</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">20</div>
              <div class="stat-label">补助对象</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon info">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">1000万</div>
              <div class="stat-label">补助总额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索条件 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="filters" inline>
        <el-form-item label="机构名称">
          <el-input v-model="filters.orgName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="待汇总" value="pending" />
            <el-option label="补助对象" value="subsidy" />
            <el-option label="未入选" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button :icon="Download" @click="handleExport">导出排名表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 汇总列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="summaryList" stripe style="width: 100%">
        <el-table-column type="index" label="排名" width="60" align="center" />
        <el-table-column prop="orgName" label="申报机构" min-width="180" />
        <el-table-column prop="projectName" label="项目名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="writtenScore" label="书面评审分" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.writtenScore }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspectionScore" label="实地考察分" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.inspectionScore }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="总分" width="100" align="center">
          <template #default="{ row }">
            <span class="total-score">{{ row.totalScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="applyAmount" label="申请金额(万)" width="120" align="center" />
        <el-table-column prop="subsidyAmount" label="补助金额(万)" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.subsidyAmount" class="subsidy-amount">{{ row.subsidyAmount }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 'qualified'"
              link
              type="success"
              @click="handleAddSubsidy(row)"
            >
              列入补助
            </el-button>
            <el-button
              v-if="row.status === 'subsidy'"
              link
              type="warning"
              @click="handleRemoveSubsidy(row)"
            >
              移除补助
            </el-button>
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
import { Search, Refresh, Download, View, Document, Select, Medal, Money } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const filters = reactive({
  orgName: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 50
})

const summaryList = ref([
  {
    id: '1',
    orgName: '市体育中心',
    projectName: '全民健身中心建设项目',
    writtenScore: 92,
    inspectionScore: 88,
    totalScore: 90,
    applyAmount: 200,
    subsidyAmount: 150,
    status: 'subsidy'
  },
  {
    id: '2',
    orgName: '区体育局',
    projectName: '社区健身器材配备',
    writtenScore: 88,
    inspectionScore: 85,
    totalScore: 86.5,
    applyAmount: 50,
    subsidyAmount: 40,
    status: 'subsidy'
  },
  {
    id: '3',
    orgName: '青少年体育俱乐部',
    projectName: '青少年体育培训基地',
    writtenScore: 85,
    inspectionScore: 0,
    totalScore: 85,
    applyAmount: 100,
    subsidyAmount: null,
    status: 'qualified'
  },
  {
    id: '4',
    orgName: '体育文化公司',
    projectName: '体育文化推广活动',
    writtenScore: 75,
    inspectionScore: 0,
    totalScore: 75,
    applyAmount: 80,
    subsidyAmount: null,
    status: 'qualified'
  }
])

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    qualified: 'warning',
    subsidy: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    pending: '待汇总',
    qualified: '符合考察',
    subsidy: '补助对象',
    rejected: '未入选'
  }
  return map[status] || status
}

const handleSearch = () => {
  console.log('搜索:', filters)
}

const handleReset = () => {
  filters.orgName = ''
  filters.status = ''
}

const handleExport = () => {
  ElMessage.success('报表导出中...')
}

const handleView = (row) => {
  console.log('查看详情:', row)
}

const handleAddSubsidy = async (row) => {
  try {
    await ElMessageBox.prompt('请输入补助金额（万元）', '列入补助对象', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^\d+(\.\d{1,2})?$/,
      inputErrorMessage: '请输入有效的金额'
    })

    row.status = 'subsidy'
    ElMessage.success('已列入补助对象')
  } catch {
    // 用户取消
  }
}

const handleRemoveSubsidy = async (row) => {
  try {
    await ElMessageBox.confirm('确定要移除补助对象资格吗？', '提示', {
      type: 'warning'
    })

    row.status = 'qualified'
    row.subsidyAmount = null
    ElMessage.success('已移除补助资格')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.summary-list-page {
  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: #f0f2f5;
      color: #333;

      &.success {
        background: #f6ffed;
        color: #52c41a;
      }

      &.warning {
        background: #fff7e6;
        color: #fa8c16;
      }

      &.info {
        background: #e6f7ff;
        color: #1890ff;
      }
    }

    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }

      .stat-label {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }
    }
  }

  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    .total-score {
      font-weight: bold;
      color: #AD333A;
    }

    .subsidy-amount {
      color: #52c41a;
      font-weight: bold;
    }

    .el-pagination {
      margin-top: 16px;
      justify-content: flex-end;
    }
  }
}
</style>
