<template>
  <div class="org-home-page">
    <div class="welcome-banner">
      <div class="banner-content">
        <h1 class="welcome-title">欢迎您，{{ userStore.displayName }}</h1>
        <p class="welcome-desc">运动促进健康专项资金补助申报平台</p>
      </div>
      <div class="banner-actions">
        <el-button type="primary" size="large" @click="$router.push('/organization/application')">
          立即申报
        </el-button>
        <el-button size="large" @click="$router.push('/organization/guide')">
          申报指南
        </el-button>
      </div>
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
              <div class="stat-value">3</div>
              <div class="stat-label">申报次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon><SuccessFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">1</div>
              <div class="stat-label">通过初审</div>
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
              <div class="stat-value">1</div>
              <div class="stat-label">待审核</div>
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
              <div class="stat-value">50万</div>
              <div class="stat-label">申请总额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-card shadow="never" class="quick-access-card">
      <template #header>
        <span>快捷入口</span>
      </template>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="quick-item" @click="$router.push('/organization/application')">
            <el-icon class="quick-icon"><EditPen /></el-icon>
            <span class="quick-label">填写申请</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quick-item" @click="$router.push('/organization/application/detail')">
            <el-icon class="quick-icon"><View /></el-icon>
            <span class="quick-label">查看进度</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quick-item" @click="$router.push('/organization/guide')">
            <el-icon class="quick-icon"><Document /></el-icon>
            <span class="quick-label">申报指南</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quick-item" @click="handleDownloadTemplate">
            <el-icon class="quick-icon"><Download /></el-icon>
            <span class="quick-label">下载模板</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 通知公告 -->
    <el-card shadow="never" class="notice-card">
      <template #header>
        <span>通知公告</span>
      </template>
      <el-timeline>
        <el-timeline-item timestamp="2024-03-01" color="#AD333A">
          <div class="notice-item">
            <span class="notice-title">2024年度运动促进健康专项资金补助申报工作启动</span>
            <el-tag type="danger" size="small">重要</el-tag>
          </div>
        </el-timeline-item>
        <el-timeline-item timestamp="2024-02-20">
          <div class="notice-item">
            <span class="notice-title">申报系统维护通知</span>
            <el-tag type="warning" size="small">通知</el-tag>
          </div>
        </el-timeline-item>
        <el-timeline-item timestamp="2024-02-15">
          <div class="notice-item">
            <span class="notice-title">2023年度专项资金补助名单公示</span>
            <el-tag type="success" size="small">公示</el-tag>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import {
  Document, SuccessFilled, Clock, Money, EditPen, View, Download
} from '@element-plus/icons-vue'

const userStore = useAuthStore()

const handleDownloadTemplate = () => {
  ElMessage.success('模板下载功能开发中')
}
</script>

<style scoped lang="scss">
.org-home-page {
  .welcome-banner {
    background: linear-gradient(135deg, #AD333A 0%, #d45258 100%);
    border-radius: 8px;
    padding: 40px;
    margin-bottom: 24px;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .welcome-title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .welcome-desc {
      font-size: 14px;
      opacity: 0.9;
    }

    .banner-actions {
      display: flex;
      gap: 12px;
    }
  }

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

  .quick-access-card {
    margin-bottom: 16px;

    .quick-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border: 1px dashed #e6e6e6;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #AD333A;
        background: #fff5f5;

        .quick-icon {
          color: #AD333A;
        }
      }

      .quick-icon {
        font-size: 32px;
        color: #666;
        margin-bottom: 8px;
      }

      .quick-label {
        font-size: 14px;
        color: #333;
      }
    }
  }

  .notice-card {
    .notice-item {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .notice-title {
        margin-right: 12px;
      }
    }
  }
}
</style>
