<template>
  <div class="form-designer-page">
    <el-page-header @back="handleBack" title="动态表单设计器" />

    <div class="designer-container">
      <el-card>
        <h2>动态表单设计器</h2>
        <p>这是一个简单的表单设计器页面</p>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const handleBack = () => {
  router.back()
}

const handleSave = () => {
  ElMessage.success('保存成功')
}
</script>

<style scoped lang="scss">
.form-designer-page {
  padding: 20px;

  .designer-container {
    margin-top: 20px;
  }
}
</style>
