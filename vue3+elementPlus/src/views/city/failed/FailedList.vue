<template>
  <div class="failed-list-page">
    <div class="page-header">
      <h2 class="page-title">不通过列表</h2>
    </div>
    <el-card shadow="never">
      <el-table :data="failedList" stripe>
        <el-table-column prop="orgName" label="申报机构" />
        <el-table-column prop="projectName" label="项目名称" />
        <el-table-column prop="reason" label="不通过原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="finalTime" label="确定时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const failedList = ref([
  { id: '1', orgName: '某体育俱乐部', projectName: '培训基地项目', reason: '不符合申报条件', finalTime: '2024-03-15 16:00:00' }
])

const handleView = (row) => {
  console.log('查看:', row)
}
</script>

<style scoped lang="scss">
.failed-list-page {
  .page-header {
    margin-bottom: 16px;
  }
}
</style>
