<template>
  <div class="application-form-page">
    <div class="page-header">
      <h2 class="page-title">专项资金补助申请</h2>
      <p class="page-desc">请认真填写申请信息，确保材料真实有效</p>
    </div>

    <!-- 申请进度 -->
    <el-card shadow="never" class="progress-card">
      <el-steps :active="currentStep" align-center>
        <el-step title="填写申请" icon="Edit" />
        <el-step title="上传材料" icon="Upload" />
        <el-step title="确认提交" icon="Check" />
      </el-steps>
    </el-card>

    <!-- 申请表单 -->
    <el-card shadow="never" class="form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="140px"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="机构名称" prop="orgName">
              <el-input v-model="formData.orgName" placeholder="请输入机构名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一社会信用代码" prop="creditCode">
              <el-input v-model="formData.creditCode" placeholder="请输入统一社会信用代码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="机构性质" prop="orgType">
              <el-select v-model="formData.orgType" placeholder="请选择机构性质" style="width: 100%">
                <el-option label="事业单位" value="public" />
                <el-option label="社会团体" value="social" />
                <el-option label="企业单位" value="enterprise" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成立时间" prop="establishDate">
              <el-date-picker
                v-model="formData.establishDate"
                type="date"
                placeholder="请选择成立时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="法定代表人" prop="legalPerson">
              <el-input v-model="formData.legalPerson" placeholder="请输入法定代表人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="legalPhone">
              <el-input v-model="formData.legalPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">项目信息</el-divider>

        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="formData.projectName" placeholder="请输入项目名称" />
        </el-form-item>

        <el-form-item label="项目类型" prop="projectType">
          <el-checkbox-group v-model="formData.projectType">
            <el-checkbox label="场馆建设">场馆建设</el-checkbox>
            <el-checkbox label="赛事活动">赛事活动</el-checkbox>
            <el-checkbox label="器材配备">器材配备</el-checkbox>
            <el-checkbox label="培训指导">培训指导</el-checkbox>
            <el-checkbox label="健康促进">健康促进</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="项目内容" prop="projectContent">
          <el-input
            v-model="formData.projectContent"
            type="textarea"
            :rows="6"
            placeholder="请详细描述项目内容、实施计划、预期效果等"
          />
        </el-form-item>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="计划开始时间" prop="startDate">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="请选择开始时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束时间" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="请选择结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">资金申请</el-divider>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="申请金额(万元)" prop="applyAmount">
              <el-input-number
                v-model="formData.applyAmount"
                :min="1"
                :max="1000"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自筹资金(万元)" prop="selfAmount">
              <el-input-number
                v-model="formData.selfAmount"
                :min="0"
                :max="1000"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="资金用途" prop="fundUsage">
          <el-input
            v-model="formData.fundUsage"
            type="textarea"
            :rows="4"
            placeholder="请说明资金的具体用途"
          />
        </el-form-item>

        <el-divider content-position="left">附件材料</el-divider>

        <el-form-item label="机构证明" required>
          <el-upload
            action="#"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
            :limit="3"
            :on-exceed="handleExceed"
            :file-list="fileList"
          >
            <el-button type="primary" :icon="Upload">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传营业执照、组织机构代码证等证明材料，支持 PDF、JPG、PNG 格式，单个文件不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="项目计划书" required>
          <el-upload
            action="#"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :limit="1"
            :file-list="projectFileList"
          >
            <el-button type="primary" :icon="Upload">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                请上传项目计划书，支持 PDF、Word 格式，不超过 20MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="formData.agreeTerms">
            我已阅读并同意《申报须知》和《诚信承诺书》，承诺所填信息真实有效
          </el-checkbox>
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button size="large" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" size="large" @click="handleSubmit">提交申请</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const currentStep = ref(0)

const formData = reactive({
  orgName: '',
  creditCode: '',
  orgType: '',
  establishDate: '',
  legalPerson: '',
  legalPhone: '',
  projectName: '',
  projectType: [],
  projectContent: '',
  startDate: '',
  endDate: '',
  applyAmount: 50,
  selfAmount: 10,
  fundUsage: '',
  agreeTerms: false
})

const formRules = {
  orgName: [{ required: true, message: '请输入机构名称', trigger: 'blur' }],
  creditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  orgType: [{ required: true, message: '请选择机构性质', trigger: 'change' }],
  legalPerson: [{ required: true, message: '请输入法定代表人', trigger: 'blur' }],
  legalPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  projectContent: [{ required: true, message: '请输入项目内容', trigger: 'blur' }],
  applyAmount: [{ required: true, message: '请输入申请金额', trigger: 'blur' }]
}

const fileList = ref([])
const projectFileList = ref([])

const handlePreview = (file) => {
  console.log('预览:', file)
}

const handleRemove = (file, fileList) => {
  console.log('移除:', file, fileList)
}

const beforeRemove = (file) => {
  return ElMessageBox.confirm(`确定移除 ${file.name}？`)
}

const handleExceed = (files) => {
  ElMessage.warning(`当前限制选择 3 个文件，本次选择了 ${files.length} 个文件`)
}

const handleSaveDraft = async () => {
  try {
    await formRef.value.validate()
    ElMessage.success('草稿已保存')
  } catch {
    ElMessage.warning('请完善必填信息')
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    if (!formData.agreeTerms) {
      ElMessage.warning('请先阅读并同意申报须知')
      return
    }

    await ElMessageBox.confirm('确定提交申请？提交后将无法修改', '提示', {
      type: 'warning'
    })

    ElMessage.success('申请提交成功')
    router.push('/organization/application/detail')
  } catch {
    // 用户取消或验证失败
  }
}
</script>

<style scoped lang="scss">
.application-form-page {
  .progress-card {
    margin-bottom: 16px;
  }

  .form-card {
    .form-actions {
      margin-top: 24px;
      text-align: center;

      .el-button {
        min-width: 120px;
      }
    }
  }

  .el-divider {
    margin: 24px 0;
  }
}
</style>
