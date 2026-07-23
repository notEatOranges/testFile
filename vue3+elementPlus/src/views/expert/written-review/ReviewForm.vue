<template>
  <div class="review-form-page">
    <div class="page-header">
      <h2 class="page-title">项目评审打分</h2>
      <p class="page-desc">{{ projectInfo.projectName }}</p>
    </div>

    <!-- 项目信息 -->
    <el-card shadow="never" class="info-card">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="申报机构">{{ projectInfo.orgName }}</el-descriptions-item>
        <el-descriptions-item label="项目类型">{{ projectInfo.projectType }}</el-descriptions-item>
        <el-descriptions-item label="申请金额">{{ projectInfo.applyAmount }}万元</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 评审打分 -->
    <el-card shadow="never" class="score-card">
      <template #header>
        <span>评审打分</span>
      </template>

      <el-form ref="formRef" :model="scoreForm" label-width="140px">
        <el-divider content-position="left">项目必要性 (20分)</el-divider>
        <el-form-item label="符合政策程度">
          <el-slider v-model="scoreForm.necessity1" :max="10" show-input />
        </el-form-item>
        <el-form-item label="社会需求度">
          <el-slider v-model="scoreForm.necessity2" :max="10" show-input />
        </el-form-item>

        <el-divider content-position="left">方案可行性 (25分)</el-divider>
        <el-form-item label="方案合理性">
          <el-slider v-model="scoreForm.feasibility1" :max="10" show-input />
        </el-form-item>
        <el-form-item label="进度安排">
          <el-slider v-model="scoreForm.feasibility2" :max="8" show-input />
        </el-form-item>
        <el-form-item label="风险控制">
          <el-slider v-model="scoreForm.feasibility3" :max="7" show-input />
        </el-form-item>

        <el-divider content-position="left">团队专业性 (15分)</el-divider>
        <el-form-item label="团队资质">
          <el-slider v-model="scoreForm.team1" :max="8" show-input />
        </el-form-item>
        <el-form-item label="实施经验">
          <el-slider v-model="scoreForm.team2" :max="7" show-input />
        </el-form-item>

        <el-divider content-position="left">预算合理性 (20分)</el-divider>
        <el-form-item label="预算编制">
          <el-slider v-model="scoreForm.budget1" :max="10" show-input />
        </el-form-item>
        <el-form-item label="资金用途">
          <el-slider v-model="scoreForm.budget2" :max="10" show-input />
        </el-form-item>

        <el-divider content-position="left">预期效果 (20分)</el-divider>
        <el-form-item label="社会效益">
          <el-slider v-model="scoreForm.effect1" :max="10" show-input />
        </el-form-item>
        <el-form-item label="可持续性">
          <el-slider v-model="scoreForm.effect2" :max="10" show-input />
        </el-form-item>

        <!-- 总分显示 -->
        <el-form-item label="总分">
          <el-input :value="totalScore" readonly style="width: 200px">
            <template #append>分</template>
          </el-input>
        </el-form-item>

        <el-form-item label="评审意见" prop="comment">
          <el-input
            v-model="scoreForm.comment"
            type="textarea"
            :rows="6"
            placeholder="请填写详细的评审意见，说明打分理由"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="scoreForm.agreed">确认以上打分和评审意见</el-checkbox>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button size="large" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" size="large" @click="handleSubmit">提交评审</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const formRef = ref()

const projectInfo = ref({
  projectName: '全民健身中心建设项目',
  orgName: '市体育中心',
  projectType: '场馆建设',
  applyAmount: 200
})

const scoreForm = reactive({
  necessity1: 8,
  necessity2: 7,
  feasibility1: 9,
  feasibility2: 7,
  feasibility3: 6,
  team1: 7,
  team2: 6,
  budget1: 8,
  budget2: 7,
  effect1: 9,
  effect2: 8,
  comment: '',
  agreed: false
})

const totalScore = computed(() => {
  return (
    scoreForm.necessity1 +
    scoreForm.necessity2 +
    scoreForm.feasibility1 +
    scoreForm.feasibility2 +
    scoreForm.feasibility3 +
    scoreForm.team1 +
    scoreForm.team2 +
    scoreForm.budget1 +
    scoreForm.budget2 +
    scoreForm.effect1 +
    scoreForm.effect2
  )
})

const handleSaveDraft = () => {
  ElMessage.success('草稿已保存')
}

const handleSubmit = async () => {
  if (!scoreForm.agreed) {
    ElMessage.warning('请先确认打分和评审意见')
    return
  }

  if (!scoreForm.comment) {
    ElMessage.warning('请填写评审意见')
    return
  }

  try {
    await ElMessageBox.confirm('确定提交评审结果？提交后将无法修改', '提示', {
      type: 'warning'
    })

    ElMessage.success('评审提交成功')
    router.push('/expert/written-review')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.review-form-page {
  .info-card {
    margin-bottom: 16px;
  }

  .score-card {
    .el-divider {
      margin: 24px 0 16px;
    }

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
