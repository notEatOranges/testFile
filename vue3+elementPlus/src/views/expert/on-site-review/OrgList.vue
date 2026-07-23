<template>
  <div class="org-list-page">
    <div class="page-header">
      <h2 class="page-title">{{ cityName }} - 待考察机构</h2>
      <p class="page-desc">共 {{ orgList.length }} 家机构待考察</p>
    </div>

    <!-- 机构列表 -->
    <el-card shadow="never" class="list-card">
      <el-table :data="orgList" stripe style="width: 100%">
        <el-table-column prop="orgName" label="机构名称" min-width="200" />
        <el-table-column prop="projectName" label="项目名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'done' ? 'success' : 'warning'">
              {{ row.status === 'done' ? '已考察' : '待考察' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'done'"
              type="primary"
              link
              @click="handleReview(row)"
            >
              开始考察
            </el-button>
            <el-button v-else type="info" link @click="handleView(row)">查看结果</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const cityName = computed(() => route.query.city || '杭州市')

const orgList = ref([
  {
    id: '1',
    orgName: '市体育中心',
    projectName: '全民健身中心建设项目',
    address: '杭州市西湖区体育路1号',
    contact: '张经理',
    phone: '0571-12345678',
    status: 'pending'
  },
  {
    id: '2',
    orgName: '区体育局',
    projectName: '社区健身器材配备',
    address: '杭州市拱墅区体育场路88号',
    contact: '李主任',
    phone: '0571-87654321',
    status: 'pending'
  },
  {
    id: '3',
    orgName: '青少年体育俱乐部',
    projectName: '青少年体育培训基地',
    address: '杭州市滨江区江南大道100号',
    contact: '王教练',
    phone: '0571-11223344',
    status: 'done'
  }
])

const handleReview = (row) => {
  router.push(`/expert/on-site-review/form?id=${row.id}`)
}

const handleView = (row) => {
  router.push(`/expert/on-site-review/detail?id=${row.id}`)
}
</script>

<style scoped lang="scss">
.org-list-page {
  .list-card {
    .el-pagination {
      margin-top: 16px;
      justify-content: flex-end;
    }
  }
}
</style>
