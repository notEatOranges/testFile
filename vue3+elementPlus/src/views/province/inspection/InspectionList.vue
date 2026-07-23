<template>
  <div class="inspection-list-page">
    <div class="page-header">
      <h2 class="page-title">实地考察列表</h2>
    </div>
    <el-card shadow="never">
      <el-table :data="inspectionList" stripe>
        <el-table-column prop="orgName" label="申报机构" />
        <el-table-column prop="projectName" label="项目名称" />
        <el-table-column prop="inspectionScore" label="考察分" width="100" align="center" />
        <el-table-column prop="expert" label="考察专家" width="120" />
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

const inspectionList = ref([
  { id: '1', orgName: '市体育中心', projectName: '全民健身中心建设项目', inspectionScore: 88, expert: '张教授' },
  { id: '2', orgName: '区体育局', projectName: '社区健身器材配备', inspectionScore: 85, expert: '李专家' }
])

const handleView = (row) => {
  console.log('查看:', row)
}
</script>

<style scoped lang="scss">
.inspection-list-page {
  .page-header {
    margin-bottom: 16px;
  }
}
</style>
