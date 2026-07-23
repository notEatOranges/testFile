<template>
  <div class="expert-review-list-page">
    <div class="page-header">
      <h2 class="page-title">评审列表</h2>
    </div>
    <el-card shadow="never">
      <el-table :data="reviewList" stripe>
        <el-table-column prop="projectName" label="项目名称" />
        <el-table-column prop="orgName" label="申报机构" />
        <el-table-column prop="deadline" label="截止时间" width="180" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'done' ? 'success' : 'warning'">
              {{ row.status === 'done' ? '已完成' : '待评审' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'done'" link type="primary" @click="handleReview(row)">
              开始评审
            </el-button>
            <el-button v-else link type="info" @click="handleView(row)">查看结果</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const reviewList = ref([
  { id: '1', projectName: '全民健身中心建设项目', orgName: '市体育中心', deadline: '2024-03-15 23:59:59', status: 'pending' },
  { id: '2', projectName: '社区健身器材配备', orgName: '区体育局', deadline: '2024-03-20 23:59:59', status: 'done' }
])

const handleReview = (row) => {
  router.push(`/expert/written-review/form?id=${row.id}`)
}

const handleView = (row) => {
  console.log('查看:', row)
}
</script>

<style scoped lang="scss">
.expert-review-list-page {
  .page-header {
    margin-bottom: 16px;
  }
}
</style>
