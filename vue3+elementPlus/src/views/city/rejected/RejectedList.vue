<template>
  <div class="rejected-list-page">
    <div class="page-header">
      <h2 class="page-title">已驳回列表</h2>
    </div>
    <el-card shadow="never">
      <el-table :data="rejectedList" stripe>
        <el-table-column prop="orgName" label="申报机构" />
        <el-table-column prop="projectName" label="项目名称" />
        <el-table-column prop="rejectReason" label="驳回原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="rejectTime" label="驳回时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="warning" @click="handleResubmit(row)">重新申报</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const rejectedList = ref([
  { id: '1', orgName: '某体育公司', projectName: '体育赛事活动', rejectReason: '材料不齐全，缺少项目计划书', rejectTime: '2024-03-05 10:00:00' }
])

const handleView = (row) => {
  console.log('查看:', row)
}

const handleResubmit = (row) => {
  ElMessage.info('请重新提交申报材料')
}
</script>

<style scoped lang="scss">
.rejected-list-page {
  .page-header {
    margin-bottom: 16px;
  }
}
</style>
