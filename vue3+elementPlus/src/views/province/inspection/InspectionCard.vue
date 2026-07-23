<template>
  <div class="inspection-card-page">
    <div class="page-header">
      <h2 class="page-title">实地考察</h2>
      <p class="page-desc">管理实地考察任务和专家考察评分</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><MapLocation /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">20</div>
              <div class="stat-label">待考察</div>
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
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">5</div>
              <div class="stat-label">考察中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon info">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">8</div>
              <div class="stat-label">考察专家</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card shadow="never" class="action-card">
      <el-button type="primary" :icon="List" @click="$router.push('/province/inspection/list')">
        查看考察列表
      </el-button>
      <el-button :icon="Download" @click="handleExport">导出报表</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { List, Download, MapLocation, Select, Clock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const handleExport = () => {
  ElMessage.success('报表导出中...')
}
</script>

<style scoped lang="scss">
.inspection-card-page {
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
}
</style>
