<template>
  <div class="statistics-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">数据统计</h2>
      <p class="page-desc">数据监测统计分析和趋势展示</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon :size="28" color="#fff"><DataAnalysis /></el-icon>
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
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <el-icon :size="28" color="#fff"><CircleClose /></el-icon>
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
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <el-icon :size="28" color="#fff"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pendingCount }}</div>
              <div class="stat-label">待处理数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <el-icon :size="28" color="#fff"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayCount }}</div>
              <div class="stat-label">今日监测</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 趋势图 -->
      <el-col :span="16">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>监测趋势</span>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button label="7">近7天</el-radio-button>
                <el-radio-button label="30">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" ref="trendChartRef"></div>
        </el-card>
      </el-col>

      <!-- 状态分布 -->
      <el-col :span="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>状态分布</span>
          </template>
          <div class="chart-container" ref="statusChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <!-- 来源分布 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>来源分布</span>
          </template>
          <div class="chart-container" ref="sourceChartRef"></div>
        </el-card>
      </el-col>

      <!-- 类型分布 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>数据类型分布</span>
          </template>
          <div class="chart-container" ref="typeChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { DataAnalysis, CircleClose, Warning, Calendar } from '@element-plus/icons-vue'
import mockData from '@/mock/monitor'

// 响应式数据
const trendPeriod = ref('7')
const trendChartRef = ref(null)
const statusChartRef = ref(null)
const sourceChartRef = ref(null)
const typeChartRef = ref(null)

// 统计数据
const statistics = ref({
  totalCount: 1000,
  normalCount: 950,
  abnormalCount: 30,
  pendingCount: 20,
  abnormalRate: 0.03,
  todayCount: 50
})

// 初始化图表（使用简单的 HTML+CSS 实现，实际项目中可使用 ECharts）
const initTrendChart = () => {
  const container = trendChartRef.value
  if (!container) return

  const data = statistics.value.trendData || mockData.statistics.trendData || []

  container.innerHTML = `
    <div class="simple-chart">
      <div class="chart-bars">
        ${data.map(item => `
          <div class="chart-bar-group">
            <div class="chart-bar" style="height: ${(item.count / 200) * 100}%">
              <div class="bar-tooltip">${item.date}<br>总数: ${item.count}<br>异常: ${item.abnormal}</div>
            </div>
            <div class="bar-label">${item.date.slice(5)}</div>
          </div>
        `).join('')}
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-color" style="background: var(--el-color-primary)"></span>监测数量</span>
      </div>
    </div>
  `
}

const initStatusChart = () => {
  const container = statusChartRef.value
  if (!container) return

  container.innerHTML = `
    <div class="pie-chart">
      <div class="pie-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background: #67c23a"></span>
          <span>正常: ${statistics.value.normalCount}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #f56c6c"></span>
          <span>异常: ${statistics.value.abnormalCount}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #e6a23c"></span>
          <span>待处理: ${statistics.value.pendingCount}</span>
        </div>
      </div>
    </div>
  `
}

const initSourceChart = () => {
  const container = sourceChartRef.value
  if (!container) return

  const data = mockData.statistics.sourceDistribution || []

  const maxValue = Math.max(...data.map(d => d.value))

  container.innerHTML = `
    <div class="bar-chart-horizontal">
      ${data.map(item => `
        <div class="bar-row">
          <div class="bar-label">${item.name}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(item.value / maxValue) * 100}%; background: var(--el-color-primary)"></div>
          </div>
          <div class="bar-value">${item.value}</div>
        </div>
      `).join('')}
    </div>
  `
}

const initTypeChart = () => {
  const container = typeChartRef.value
  if (!container) return

  const data = mockData.statistics.typeDistribution || []

  const maxValue = Math.max(...data.map(d => d.value))

  container.innerHTML = `
    <div class="bar-chart-horizontal">
      ${data.map(item => `
        <div class="bar-row">
          <div class="bar-label">${item.name}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(item.value / maxValue) * 100}%; background: var(--el-color-success)"></div>
          </div>
          <div class="bar-value">${item.value}</div>
        </div>
      `).join('')}
    </div>
  `
}

// 初始化所有图表
const initCharts = () => {
  nextTick(() => {
    initTrendChart()
    initStatusChart()
    initSourceChart()
    initTypeChart()
  })
}

// 初始化
onMounted(() => {
  initCharts()
})
</script>

<style scoped lang="scss">
.statistics-page {
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

  .stats-row,
  .chart-row {
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
    gap: 16px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-info {
    flex: 1;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #333;
  }

  .stat-label {
    font-size: 14px;
    color: #999;
  }

  .chart-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chart-container {
    height: 280px;
  }

  // 简单柱状图样式
  .simple-chart {
    height: 100%;
    display: flex;
    flex-direction: column;

    .chart-bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      padding: 20px 0;
    }

    .chart-bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 10%;
    }

    .chart-bar {
      width: 100%;
      background: linear-gradient(180deg, var(--el-color-primary) 0%, var(--el-color-primary-light-5) 100%);
      border-radius: 4px 4px 0 0;
      position: relative;
      cursor: pointer;
      transition: opacity 0.3s;

      &:hover {
        opacity: 0.8;
      }
    }

    .bar-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      display: none;
      z-index: 10;
    }

    .chart-bar:hover .bar-tooltip {
      display: block;
    }

    .bar-label {
      margin-top: 8px;
      font-size: 12px;
      color: #999;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #666;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }
  }

  // 饼图图例
  .pie-chart {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .pie-legend {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
  }

  // 水平柱状图
  .bar-chart-horizontal {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    padding: 20px 0;

    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bar-label {
      width: 80px;
      text-align: right;
      font-size: 14px;
      color: #333;
    }

    .bar-track {
      flex: 1;
      height: 24px;
      background: #f5f5f5;
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .bar-value {
      width: 50px;
      font-size: 14px;
      color: #666;
    }
  }
}
</style>
