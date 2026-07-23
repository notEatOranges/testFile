<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-icon">403</div>
      <h1 class="error-title">访问被拒绝</h1>
      <p class="error-desc">抱歉，您没有访问此页面的权限</p>
      <el-button type="primary" @click="goBack">返回上一页</el-button>
      <el-button @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
}

.error-content {
  text-align: center;
}

.error-icon {
  font-size: 120px;
  font-weight: bold;
  color: #AD333A;
  line-height: 1;
  margin-bottom: 20px;
}

.error-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 12px;
}

.error-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 30px;
}

.el-button {
  margin: 0 8px;
}
</style>
