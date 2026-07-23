<template>
  <div class="submit-card-page">
    <div class="page-header">
      <h2 class="page-title">待报送</h2>
      <p class="page-desc">将通过初审的申报材料报送到省体育局</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="8">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">15</div>
              <div class="stat-label">待报送</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">35</div>
              <div class="stat-label">已报送</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">3</div>
              <div class="stat-label">即将逾期</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card shadow="never" class="action-card">
      <el-button type="primary" :icon="List" @click="$router.push('/city/submit/list')">
        查看报送列表
      </el-button>
      <el-button :icon="Upload" @click="handleBatchSubmit">批量报送</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { List, Upload, Document, Select, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const handleBatchSubmit = () => {
  ElMessage.success('批量报送功能开发中')
}
</script>

<style scoped lang="scss">
.submit-card-page {
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
        background: #e6f7ff;
        color: #1890ff;
      }

      &.success {
        background: #f6ffed;
        color: #52c41a;
      }

      &.warning {
        background: #fff7e6;
        color: #fa8c16;
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
