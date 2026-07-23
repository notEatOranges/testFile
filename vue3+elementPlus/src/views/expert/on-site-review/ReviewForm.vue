<template>
  <div class="onsite-review-form-page">
    <div class="page-header">
      <h2 class="page-title">实地考察评分</h2>
      <p class="page-desc">{{ projectInfo.orgName }} - {{ projectInfo.projectName }}</p>
    </div>

    <!-- 项目信息 -->
    <el-card shadow="never" class="info-card">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="申报机构">{{ projectInfo.orgName }}</el-descriptions-item>
        <el-descriptions-item label="项目类型">{{ projectInfo.projectType }}</el-descriptions-item>
        <el-descriptions-item label="申请金额">{{ projectInfo.applyAmount }}万元</el-descriptions-item>
        <el-descriptions-item label="考察地址" :span="3">{{ projectInfo.address }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ projectInfo.contact }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ projectInfo.phone }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 评分表 -->
    <el-card shadow="never" class="score-card">
      <template #header>
        <span>考察评分</span>
      </template>

      <el-form label-width="140px">
        <el-form-item label="项目完成情况 (30分)">
          <el-slider v-model="scoreForm.completion" :max="30" show-input />
        </el-form-item>
        <el-form-item label="设施质量 (25分)">
          <el-slider v-model="scoreForm.quality" :max="25" show-input />
        </el-form-item>
        <el-form-item label="管理规范性 (20分)">
          <el-slider v-model="scoreForm.management" :max="20" show-input />
        </el-form-item>
        <el-form-item label="社会效益 (15分)">
          <el-slider v-model="scoreForm.benefit" :max="15" show-input />
        </el-form-item>
        <el-form-item label="可持续发展 (10分)">
          <el-slider v-model="scoreForm.sustainability" :max="10" show-input />
        </el-form-item>

        <el-form-item label="总分">
          <el-input :value="totalScore" readonly style="width: 200px">
            <template #append>分</template>
          </el-input>
        </el-form-item>

        <el-form-item label="考察意见">
          <el-input
            v-model="scoreForm.comment"
            type="textarea"
            :rows="6"
            placeholder="请填写考察意见"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="scoreForm.agreed">确认以上评分和意见</el-checkbox>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button size="large" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" size="large" @click="handleSubmit">提交评分</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const projectInfo = ref({
  orgName: '市体育中心',
  projectName: '全民健身中心建设项目',
  projectType: '场馆建设',
  applyAmount: 200,
  address: '杭州市西湖区体育路1号',
  contact: '张经理',
  phone: '0571-12345678'
})

const scoreForm = reactive({
  completion: 25,
  quality: 22,
  management: 18,
  benefit: 13,
  sustainability: 8,
  comment: '',
  agreed: false
})

const totalScore = computed(() => {
  return scoreForm.completion + scoreForm.quality + scoreForm.management +
         scoreForm.benefit + scoreForm.sustainability
})

const handleSaveDraft = () => {
  ElMessage.success('草稿已保存')
}

const handleSubmit = async () => {
  if (!scoreForm.agreed) {
    ElMessage.warning('请先确认评分和意见')
    return
  }

  try {
    await ElMessageBox.confirm('确定提交考察结果？', '提示', { type: 'warning' })
    ElMessage.success('提交成功')
    router.push('/expert/on-site-review')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.onsite-review-form-page {
  .info-card {
    margin-bottom: 16px;
  }

  .score-card {
    .form-actions {
      margin-top: 24px;
      text-align: center;

      .el-button {
        min-width: 120px;
      }
    }
  }
}
</style>
