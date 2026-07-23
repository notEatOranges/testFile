<template>
  <div class="quality-manage-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">数据质量管理</h2>
      <p class="page-desc">配置数据质量检查规则，执行质量检查并生成报告</p>
    </div>

    <!-- 质量概览卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #ecf5ff">
              <el-icon :size="24" color="#409eff"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalCount }}</div>
              <div class="stat-label">总监测数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f0f9ff">
              <el-icon :size="24" color="#67c23a"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.normalCount }}</div>
              <div class="stat-label">正常数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fef0f0">
              <el-icon :size="24" color="#f56c6c"><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.abnormalCount }}</div>
              <div class="stat-label">异常数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fdf6ec">
              <el-icon :size="24" color="#e6a23c"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.abnormalRate }}%</div>
              <div class="stat-label">异常率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 质量检查 -->
    <el-card class="action-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>质量检查</span>
        </div>
      </template>
      <el-form :model="checkForm" inline>
        <el-form-item label="检查范围">
          <el-select v-model="checkForm.scope" placeholder="请选择检查范围">
            <el-option label="全部数据" value="all" />
            <el-option label="招标管理" value="tender" />
            <el-option label="资质审核" value="audit" />
            <el-option label="评审管理" value="review" />
            <el-option label="资金管理" value="fund" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="checkForm.ruleType" placeholder="请选择规则类型">
            <el-option label="全部" value="" />
            <el-option label="完整性" value="completeness" />
            <el-option label="准确性" value="accuracy" />
            <el-option label="一致性" value="consistency" />
            <el-option label="时效性" value="timeliness" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="checking" @click="handleCheck">
            执行检查
          </el-button>
          <el-button @click="handleExportReport">导出报告</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 检查结果 -->
    <el-card v-if="checkResult" class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>检查结果</span>
          <el-tag :type="checkResult.pass ? 'success' : 'danger'">
            {{ checkResult.pass ? '通过' : '发现问题' }}
          </el-tag>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="检查时间">
          {{ checkResult.checkTime }}
        </el-descriptions-item>
        <el-descriptions-item label="检查记录数">
          {{ checkResult.recordCount }}
        </el-descriptions-item>
        <el-descriptions-item label="发现问题数">
          {{ checkResult.issueCount }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table v-if="checkResult.issues && checkResult.issues.length" :data="checkResult.issues" stripe style="margin-top: 16px">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="ruleType" label="规则类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getRuleTypeName(row.ruleType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="问题描述" min-width="200" />
        <el-table-column prop="recordId" label="记录ID" width="120" />
        <el-table-column prop="severity" label="严重级别" width="90">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" size="small">
              {{ getSeverityLabel(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 规则配置 -->
    <el-card class="rules-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>质量规则配置</span>
          <el-button type="primary" size="small" :icon="Plus" @click="handleAddRule">
            新增规则
          </el-button>
        </div>
      </template>
      <el-table :data="rulesList" stripe>
        <el-table-column prop="ruleName" label="规则名称" min-width="200" />
        <el-table-column prop="ruleType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getRuleTypeColor(row.ruleType)" size="small">
              {{ getRuleTypeName(row.ruleType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetTable" label="目标表" width="150" />
        <el-table-column prop="isEnabled" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">
              {{ row.isEnabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEditRule(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handleTestRule(row)">
              测试
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Document, CircleCheck, CircleClose, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import mockData from '@/mock/monitor'

// 响应式数据
const checking = ref(false)
const checkForm = ref({
  scope: 'all',
  ruleType: ''
})
const checkResult = ref(null)
const rulesList = ref([])

// 统计数据
const statistics = ref({
  totalCount: 1000,
  normalCount: 950,
  abnormalCount: 50,
  abnormalRate: 5
})

// 获取规则类型名称
const getRuleTypeName = (type) => {
  const map = {
    completeness: '完整性',
    accuracy: '准确性',
    consistency: '一致性',
    timeliness: '时效性'
  }
  return map[type] || type
}

// 获取规则类型颜色
const getRuleTypeColor = (type) => {
  const map = {
    completeness: 'success',
    accuracy: 'primary',
    consistency: 'warning',
    timeliness: 'info'
  }
  return map[type] || ''
}

// 获取严重级别标签
const getSeverityLabel = (severity) => {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[severity] || severity
}

// 获取严重级别类型
const getSeverityType = (severity) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return map[severity] || ''
}

// 执行检查
const handleCheck = () => {
  checking.value = true
  setTimeout(() => {
    checkResult.value = {
      pass: false,
      checkTime: new Date().toLocaleString(),
      recordCount: 100,
      issueCount: 5,
      issues: [
        { ruleType: 'completeness', description: '机构名称字段为空', recordId: '000001', severity: 'high' },
        { ruleType: 'accuracy', description: '信用代码格式不正确', recordId: '000002', severity: 'high' },
        { ruleType: 'timeliness', description: '数据更新超时', recordId: '000003', severity: 'medium' }
      ]
    }
    checking.value = false
    ElMessage.success('检查完成')
  }, 1000)
}

// 导出报告
const handleExportReport = () => {
  ElMessage.info('导出质量报告功能开发中...')
}

// 新增规则
const handleAddRule = () => {
  ElMessage.info('跳转到规则管理页面...')
}

// 编辑规则
const handleEditRule = (row) => {
  ElMessage.info('跳转到规则管理页面...')
}

// 测试规则
const handleTestRule = (row) => {
  ElMessage.info(`测试规则"${row.ruleName}"功能开发中...`)
}

// 初始化
onMounted(() => {
  rulesList.value = mockData.qualityRules
})
</script>

<style scoped lang="scss">
.quality-manage-page {
  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .page-desc {
      font-size: 14px;
      color: #999;
      margin: 0;
    }
  }

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-info {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }

  .stat-label {
    font-size: 12px;
    color: #999;
  }

  .action-card,
  .result-card,
  .rules-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
