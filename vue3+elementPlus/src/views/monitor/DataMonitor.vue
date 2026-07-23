<template>
  <div class="data-monitor-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">数据监测</h2>
      <p class="page-desc">实时监测各环节数据质量，及时发现和处理数据异常</p>
    </div>

    <!-- 筛选表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="来源">
          <el-select
            v-model="filters.source"
            placeholder="请选择来源"
            clearable
            style="width: 150px"
          >
            <el-option label="招标管理" value="招标管理" />
            <el-option label="资质审核" value="资质审核" />
            <el-option label="评审管理" value="评审管理" />
            <el-option label="资金管理" value="资金管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select
            v-model="filters.dataType"
            placeholder="请选择数据类型"
            clearable
            style="width: 150px"
          >
            <el-option label="申请数据" value="申请数据" />
            <el-option label="审核数据" value="审核数据" />
            <el-option label="评审数据" value="评审数据" />
            <el-option label="支付数据" value="支付数据" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" value="normal" />
            <el-option label="异常" value="abnormal" />
            <el-option label="待处理" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="监测时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="monitorList"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column prop="dataType" label="数据类型" width="120" />
        <el-table-column prop="monitorTime" label="监测时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'normal'" type="success">正常</el-tag>
            <el-tag v-else-if="row.status === 'abnormal'" type="danger">异常</el-tag>
            <el-tag v-else type="warning">待处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="监测内容" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="监测详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="监测ID">
          {{ currentDetail.id }}
        </el-descriptions-item>
        <el-descriptions-item label="来源">
          {{ currentDetail.source }}
        </el-descriptions-item>
        <el-descriptions-item label="数据类型">
          {{ currentDetail.dataType }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="currentDetail.status === 'normal'" type="success" size="small">
            正常
          </el-tag>
          <el-tag v-else-if="currentDetail.status === 'abnormal'" type="danger" size="small">
            异常
          </el-tag>
          <el-tag v-else type="warning" size="small">
            待处理
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="监测时间" :span="2">
          {{ currentDetail.monitorTime }}
        </el-descriptions-item>
        <el-descriptions-item label="监测内容" :span="2">
          {{ currentDetail.content }}
        </el-descriptions-item>

        <!-- 质量检查结果 -->
        <el-descriptions-item v-if="currentDetail.qualityCheck" label="完整性" :span="2">
          <el-tag
            :type="currentDetail.qualityCheck.completeness === 'pass' ? 'success' : 'danger'"
            size="small"
          >
            {{ currentDetail.qualityCheck.completeness === 'pass' ? '通过' : '不通过' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.qualityCheck" label="准确性" :span="2">
          <el-tag
            :type="getQualityCheckType(currentDetail.qualityCheck.accuracy)"
            size="small"
          >
            {{ getQualityCheckLabel(currentDetail.qualityCheck.accuracy) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.qualityCheck" label="一致性" :span="2">
          <el-tag
            :type="getQualityCheckType(currentDetail.qualityCheck.consistency)"
            size="small"
          >
            {{ getQualityCheckLabel(currentDetail.qualityCheck.consistency) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentDetail.qualityCheck" label="时效性" :span="2">
          <el-tag
            :type="currentDetail.qualityCheck.timeliness === 'pass' ? 'success' : 'danger'"
            size="small"
          >
            {{ currentDetail.qualityCheck.timeliness === 'pass' ? '通过' : '不通过' }}
          </el-tag>
        </el-descriptions-item>

        <!-- 问题列表 -->
        <el-descriptions-item v-if="currentDetail.issues && currentDetail.issues.length" label="问题列表" :span="2">
          <el-table :data="currentDetail.issues" size="small" max-height="200">
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="severity" label="级别" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-descriptions-item>

        <!-- 处理历史 -->
        <el-descriptions-item v-if="currentDetail.processHistory && currentDetail.processHistory.length" label="处理历史" :span="2">
          <el-timeline size="small">
            <el-timeline-item
              v-for="(item, index) in currentDetail.processHistory"
              :key="index"
              :timestamp="item.time"
              placement="top"
            >
              <p>{{ item.action }} - {{ item.operator }}</p>
              <p>{{ item.result }}</p>
            </el-timeline-item>
          </el-timeline>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMonitorStore } from '@/stores/monitor'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const monitorStore = useMonitorStore()

// 响应式数据
const loading = ref(false)
const detailVisible = ref(false)
const currentDetail = ref(null)
const dateRange = ref([])

// 筛选条件
const filters = computed({
  get: () => monitorStore.filters,
  set: (val) => monitorStore.setFilters(val)
})

// 分页
const pagination = computed({
  get: () => monitorStore.pagination,
  set: (val) => monitorStore.setPagination(val)
})

// 监测列表
const monitorList = computed(() => monitorStore.monitorList)
const total = computed(() => monitorStore.total)

// 获取质量检查标签类型
const getQualityCheckType = (value) => {
  if (value === 'pass') return 'success'
  if (value === 'fail') return 'danger'
  return 'warning'
}

// 获取质量检查标签文字
const getQualityCheckLabel = (value) => {
  if (value === 'pass') return '通过'
  if (value === 'fail') return '不通过'
  return '警告'
}

// 查询
const handleSearch = async () => {
  loading.value = true
  try {
    // 更新筛选条件
    const newFilters = {
      source: filters.value.source,
      dataType: filters.value.dataType,
      status: filters.value.status
    }
    if (dateRange.value && dateRange.value.length === 2) {
      newFilters.startTime = dateRange.value[0]
      newFilters.endTime = dateRange.value[1]
    }

    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 这里应该调用 API，现在使用 mock 数据
    const mockApi = await import('@/mock/index').then(m => m.default)
    const result = await mockApi['/api/monitor/list']({
      ...newFilters,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })

    if (result.code === 200) {
      monitorStore.setMonitorList(result.data)
    }
  } finally {
    loading.value = false
  }
}

// 重置
const handleReset = () => {
  dateRange.value = []
  monitorStore.resetFilters()
  pagination.value.page = 1
  handleSearch()
}

// 导出
const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

// 详情
const handleDetail = (row) => {
  currentDetail.value = row
  detailVisible.value = true
}

// 分页大小改变
const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  pagination.value.page = 1
  handleSearch()
}

// 页码改变
const handlePageChange = (val) => {
  pagination.value.page = val
  handleSearch()
}

// 初始化
onMounted(() => {
  handleSearch()
})
</script>

<style scoped lang="scss">
.data-monitor-page {
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

  .search-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .table-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
