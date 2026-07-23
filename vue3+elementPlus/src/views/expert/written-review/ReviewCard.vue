<template>
  <div class="expert-review-card-page">
    <div class="page-header">
      <h2 class="page-title">书面评审</h2>
      <p class="page-desc">请按时完成待评审项目的打分和评审意见</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="8">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">12</div>
              <div class="stat-label">待评审</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon done">
              <el-icon><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">8</div>
              <div class="stat-label">已评审</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">20</div>
              <div class="stat-label">评审总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待评审列表 -->
    <el-card shadow="never" class="list-card">
      <template #header>
        <div class="card-header">
          <span>待评审项目</span>
          <el-button type="primary" link @click="$router.push('/expert/written-review/list')">
            查看全部
          </el-button>
        </div>
      </template>

      <el-table :data="pendingList" stripe style="width: 100%">
        <el-table-column prop="projectName" label="项目名称" min-width="200" />
        <el-table-column prop="orgName" label="申报机构" width="180" />
        <el-table-column prop="applyAmount" label="申请金额" width="120" align="center">
          <template #default="{ row }">
            {{ row.applyAmount }}万元
          </template>
        </el-table-column>
        <el-table-column label="截止时间" width="180">
          <template #default="{ row }">
            <el-tag :type="getTimeTagType(row.deadline)">
              {{ formatDate(row.deadline) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleReview(row)">
              开始评审
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 评分须知 -->
    <el-card shadow="never" class="notice-card">
      <template #header>
        <span>评审须知</span>
      </template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>
          <div class="notice-content">
            <p>1. 请在截止日期前完成评审，逾期将视为自动放弃</p>
            <p>2. 评审分数范围为 0-100 分，请根据实际情况客观公正打分</p>
            <p>3. 请填写详细的评审意见，说明打分理由</p>
            <p>4. 提交后如需修改，请联系省体育局管理员</p>
          </div>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Select, Document } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'

const router = useRouter()

const pendingList = ref([
  {
    id: '1',
    projectName: '全民健身中心建设项目',
    orgName: '市体育中心',
    applyAmount: 200,
    deadline: '2024-03-15T23:59:59'
  },
  {
    id: '2',
    projectName: '社区健身器材配备',
    orgName: '区体育局',
    applyAmount: 50,
    deadline: '2024-03-20T23:59:59'
  },
  {
    id: '3',
    projectName: '青少年体育培训基地',
    orgName: '青少年体育俱乐部',
    applyAmount: 100,
    deadline: '2024-03-25T23:59:59'
  }
])

const getTimeTagType = (deadline) => {
  const now = new Date().getTime()
  const end = new Date(deadline).getTime()
  const days = Math.floor((end - now) / (24 * 60 * 60 * 1000))

  if (days < 0) return 'danger'
  if (days < 3) return 'warning'
  return 'info'
}

const handleReview = (row) => {
  router.push(`/expert/written-review/form?id=${row.id}`)
}
</script>

<style scoped lang="scss">
.expert-review-card-page {
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

      &.pending {
        background: #fff7e6;
        color: #fa8c16;
      }

      &.done {
        background: #f6ffed;
        color: #52c41a;
      }

      &.total {
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

  .list-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .notice-card {
    .notice-content {
      p {
        margin: 4px 0;
      }
    }
  }
}
</style>
