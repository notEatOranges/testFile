<template>
  <div class="application-detail-page">
    <div class="page-header">
      <h2 class="page-title">申请详情</h2>
      <p class="page-desc">查看申报项目的详细信息和审核进度</p>
    </div>

    <!-- 状态进度 -->
    <el-card shadow="never" class="status-card">
      <el-steps :active="currentStep" align-center finish-status="success">
        <el-step title="已申报" description="2024-03-01" />
        <el-step title="市局审核中" />
        <el-step title="省局初审中" />
        <el-step title="书面评审中" />
        <el-step title="结果公示" />
      </el-steps>
    </el-card>

    <!-- 申请信息 -->
    <el-card shadow="never" class="info-card">
      <template #header>
        <span>申请信息</span>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="申报机构">{{ applicationInfo.orgName }}</el-descriptions-item>
        <el-descriptions-item label="统一社会信用代码">{{ applicationInfo.creditCode }}</el-descriptions-item>
        <el-descriptions-item label="机构性质">{{ applicationInfo.orgType }}</el-descriptions-item>
        <el-descriptions-item label="法定代表人">{{ applicationInfo.legalPerson }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ applicationInfo.legalPhone }}</el-descriptions-item>
        <el-descriptions-item label="申请金额">{{ applicationInfo.applyAmount }}万元</el-descriptions-item>
        <el-descriptions-item label="项目名称" :span="2">{{ applicationInfo.projectName }}</el-descriptions-item>
        <el-descriptions-item label="项目类型" :span="2">
          <el-tag v-for="type in applicationInfo.projectType" :key="type" style="margin-right: 8px">
            {{ type }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="项目内容" :span="2">
          {{ applicationInfo.projectContent }}
        </el-descriptions-item>
        <el-descriptions-item label="计划周期" :span="2">
          {{ applicationInfo.startDate }} 至 {{ applicationInfo.endDate }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 审核记录 -->
    <el-card shadow="never" class="review-card">
      <template #header>
        <span>审核记录</span>
      </template>

      <el-timeline>
        <el-timeline-item timestamp="2024-03-01 10:30" color="#AD333A">
          <p><strong>提交申请</strong></p>
          <p>机构提交了补助申请，等待市体育部门审核</p>
        </el-timeline-item>
        <el-timeline-item timestamp="2024-03-05 14:20" color="#67C23A">
          <p><strong>市局审核通过</strong></p>
          <p>审核人：张主任 | 意见：材料齐全，符合申报条件</p>
        </el-timeline-item>
        <el-timeline-item timestamp="2024-03-10 09:00" color="#409EFF">
          <p><strong>报送省局</strong></p>
          <p>市体育部门已将材料报送到省体育局</p>
        </el-timeline-item>
        <el-timeline-item timestamp="" color="#909399">
          <p><strong>等待省局初审</strong></p>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button @click="$router.back()">返回</el-button>
      <el-button type="primary" :icon="Download">下载申请表</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Download } from '@element-plus/icons-vue'

const currentStep = ref(1)

const applicationInfo = ref({
  orgName: '市体育中心',
  creditCode: '91330100MA2XXXXXXX',
  orgType: '事业单位',
  legalPerson: '张三',
  legalPhone: '13800138000',
  applyAmount: 200,
  projectName: '全民健身中心建设项目',
  projectType: ['场馆建设', '培训指导'],
  projectContent: '建设综合性全民健身中心，包含室内篮球馆、羽毛球馆、健身房等设施，开展群众体育培训和活动。',
  startDate: '2024-04-01',
  endDate: '2024-12-31'
})
</script>

<style scoped lang="scss">
.application-detail-page {
  .status-card {
    margin-bottom: 16px;
  }

  .info-card {
    margin-bottom: 16px;
  }

  .review-card {
    margin-bottom: 16px;

    .el-timeline {
      p {
        margin: 4px 0;
      }
    }
  }

  .action-bar {
    text-align: center;
    padding: 20px 0;
  }
}
</style>
