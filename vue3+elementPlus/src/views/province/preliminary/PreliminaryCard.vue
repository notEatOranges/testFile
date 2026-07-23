<template>
  <div class="preliminary-card-page">
    <div class="page-header">
      <h2 class="page-title">资格初审</h2>
      <p class="page-desc">对机构提交的申报材料进行资格初审</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">25</div>
              <div class="stat-label">待初审</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon processing">
              <el-icon><Loading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">8</div>
              <div class="stat-label">初审中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon passed">
              <el-icon><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">45</div>
              <div class="stat-label">初审通过</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon rejected">
              <el-icon><CloseBold /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">5</div>
              <div class="stat-label">初审不通过</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card shadow="never" class="action-card">
      <el-button type="primary" :icon="List" @click="$router.push('/province/preliminary/list')">
        查看列表
      </el-button>
    </el-card>
  </div>
</template>

<script setup>
import { Clock, Loading, Select, CloseBold, List } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.preliminary-card-page {
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

      &.processing {
        background: #e6f7ff;
        color: #1890ff;
      }

      &.passed {
        background: #f6ffed;
        color: #52c41a;
      }

      &.rejected {
        background: #fff1f0;
        color: #ff4d4f;
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
