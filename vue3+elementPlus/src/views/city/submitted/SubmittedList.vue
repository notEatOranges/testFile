<template>
  <div class="submitted-list-page">
    <div class="page-header">
      <h2 class="page-title">已报送列表</h2>
    </div>
    <el-card shadow="never">
      <el-table :data="submittedList" stripe>
        <el-table-column prop="orgName" label="申报机构" />
        <el-table-column prop="projectName" label="项目名称" />
        <el-table-column prop="submitTime" label="报送时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const submittedList = ref([
  { id: '1', orgName: '市体育中心', projectName: '全民健身中心建设项目', submitTime: '2024-03-10 14:30:00' },
  { id: '2', orgName: '区体育局', projectName: '社区健身器材配备', submitTime: '2024-03-11 09:20:00' }
])

const handleView = (row) => {
  console.log('查看:', row)
}
</script>

<style scoped lang="scss">
.submitted-list-page {
  .page-header {
    margin-bottom: 16px;
  }
}
</style>
