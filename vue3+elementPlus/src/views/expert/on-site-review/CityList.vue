<template>
  <div class="city-list-page">
    <div class="page-header">
      <h2 class="page-title">实地考察</h2>
      <p class="page-desc">选择要考察的城市和机构</p>
    </div>

    <!-- 城市列表 -->
    <el-row :gutter="16">
      <el-col
        v-for="city in cityList"
        :key="city.id"
        :span="8"
        style="margin-bottom: 16px"
      >
        <el-card shadow="hover" class="city-card" @click="handleSelectCity(city)">
          <div class="city-header">
            <el-icon class="city-icon"><MapLocation /></el-icon>
            <span class="city-name">{{ city.name }}</span>
          </div>
          <div class="city-stats">
            <div class="stat-item">
              <span class="stat-value">{{ city.total }}</span>
              <span class="stat-label">待考察</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ city.done }}</span>
              <span class="stat-label">已完成</span>
            </div>
          </div>
          <el-progress
            :percentage="city.progress"
            :color="getProgressColor(city.progress)"
            :stroke-width="8"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MapLocation } from '@element-plus/icons-vue'

const router = useRouter()

const cityList = ref([
  { id: '1', name: '杭州市', total: 8, done: 5, progress: 62.5 },
  { id: '2', name: '宁波市', total: 6, done: 3, progress: 50 },
  { id: '3', name: '温州市', total: 5, done: 2, progress: 40 },
  { id: '4', name: '嘉兴市', total: 4, done: 4, progress: 100 },
  { id: '5', name: '湖州市', total: 3, done: 1, progress: 33.3 },
  { id: '6', name: '绍兴市', total: 4, done: 0, progress: 0 },
  { id: '7', name: '金华市', total: 5, done: 2, progress: 40 },
  { id: '8', name: '衢州市', total: 2, done: 1, progress: 50 },
  { id: '9', name: '舟山市', total: 2, done: 0, progress: 0 }
])

const getProgressColor = (percentage) => {
  if (percentage === 100) return '#52c41a'
  if (percentage >= 50) return '#1890ff'
  return '#fa8c16'
}

const handleSelectCity = (city) => {
  router.push(`/expert/on-site-review/orgs?city=${city.name}`)
}
</script>

<style scoped lang="scss">
.city-list-page {
  .city-card {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .city-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;

      .city-icon {
        font-size: 24px;
        color: #AD333A;
      }

      .city-name {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }
    }

    .city-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 12px;

      .stat-item {
        text-align: center;

        .stat-value {
          display: block;
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}
</style>
