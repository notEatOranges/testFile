<template>
  <div class="submit-list-page">
    <div class="page-header">
      <h2 class="page-title">报送列表</h2>
    </div>
    <el-card shadow="never">
      <el-table :data="submitList" stripe>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orgName" label="申报机构" />
        <el-table-column prop="projectName" label="项目名称" />
        <el-table-column prop="applyAmount" label="申请金额" width="120" align="center" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="success" @click="handleSubmit(row)">报送</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const submitList = ref([
  { id: '1', orgName: '市体育中心', projectName: '全民健身中心建设项目', applyAmount: 200 },
  { id: '2', orgName: '区体育局', projectName: '社区健身器材配备', applyAmount: 50 }
])

const handleSubmit = (row) => {
  ElMessage.success(`已报送 ${row.orgName} 的申请`)
}
</script>

<style scoped lang="scss">
.submit-list-page {
  .page-header {
    margin-bottom: 16px;
  }
}
</style>
