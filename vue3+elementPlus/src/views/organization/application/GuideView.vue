<template>
  <div class="guide-page">
    <div class="page-header">
      <h2 class="page-title">申请指南</h2>
      <p class="page-desc">运动促进健康专项资金补助申报指南</p>
    </div>

    <el-row :gutter="16">
      <el-col :span="18">
        <!-- 指南内容 -->
        <el-card shadow="never" class="guide-card">
          <el-collapse v-model="activeNames">
            <el-collapse-item title="一、申报条件" name="1">
              <div class="guide-content">
                <p>1. 在本省注册登记的具有独立法人资格的企事业单位、社会组织等；</p>
                <p>2. 具有健全的财务管理制度和专业的项目执行团队；</p>
                <p>3. 项目应符合运动促进健康相关要求，具有明确的建设内容和实施方案；</p>
                <p>4. 同一单位同一年度只能申报一个项目；</p>
                <p>5. 申报单位近三年内无严重违法违规记录。</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="二、申报材料" name="2">
              <div class="guide-content">
                <p><strong>基本材料：</strong></p>
                <ul>
                  <li>申报表（在线填写并打印盖章）</li>
                  <li>营业执照或组织机构代码证复印件</li>
                  <li>法定代表人身份证复印件</li>
                  <li>上年度财务审计报告</li>
                </ul>
                <p><strong>项目材料：</strong></p>
                <ul>
                  <li>项目实施方案（含项目目标、实施计划、进度安排等）</li>
                  <li>项目预算明细表</li>
                  <li>自筹资金证明</li>
                  <li>其他需要提供的证明材料</li>
                </ul>
              </div>
            </el-collapse-item>

            <el-collapse-item title="三、申报流程" name="3">
              <div class="guide-content">
                <el-timeline>
                  <el-timeline-item timestamp="步骤一" color="#AD333A">
                    <p>在线填写申报信息</p>
                  </el-timeline-item>
                  <el-timeline-item timestamp="步骤二" color="#AD333A">
                    <p>上传申报材料</p>
                  </el-timeline-item>
                  <el-timeline-item timestamp="步骤三" color="#AD333A">
                    <p>提交并等待初审</p>
                  </el-timeline-item>
                  <el-timeline-item timestamp="步骤四" color="#AD333A">
                    <p>市体育部门审核</p>
                  </el-timeline-item>
                  <el-timeline-item timestamp="步骤五" color="#AD333A">
                    <p>省体育局组织专家评审</p>
                  </el-timeline-item>
                  <el-timeline-item timestamp="步骤六" color="#AD333A">
                    <p>结果公示与资金拨付</p>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-collapse-item>

            <el-collapse-item title="四、评审标准" name="4">
              <div class="guide-content">
                <el-table :data="reviewCriteria" border style="width: 100%">
                  <el-table-column prop="item" label="评审项目" width="180" />
                  <el-table-column prop="content" label="评审内容" />
                  <el-table-column prop="score" label="分值" width="80" align="center" />
                </el-table>
              </div>
            </el-collapse-item>

            <el-collapse-item title="五、注意事项" name="5">
              <div class="guide-content">
                <p>1. 申报单位应对所提供材料的真实性负责，如有弄虚作假，将取消申报资格；</p>
                <p>2. 获得补助的项目单位应严格按照申报内容实施，不得擅自变更；</p>
                <p>3. 项目资金应专款专用，严禁截留、挤占、挪用；</p>
                <p>4. 省体育局将对项目实施情况进行监督检查。</p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>

      <el-col :span="6">
        <!-- 快捷入口 -->
        <el-card shadow="never" class="action-card">
          <template #header>
            <span>快捷入口</span>
          </template>
          <div class="action-list">
            <div class="action-item" @click="$router.push('/organization/application')">
              <el-icon class="action-icon"><EditPen /></el-icon>
              <span class="action-label">立即申报</span>
            </div>
            <div class="action-item" @click="handleDownload">
              <el-icon class="action-icon"><Download /></el-icon>
              <span class="action-label">下载模板</span>
            </div>
            <div class="action-item" @click="handleContact">
              <el-icon class="action-icon"><Phone /></el-icon>
              <span class="action-label">联系我们</span>
            </div>
          </div>
        </el-card>

        <!-- 联系方式 -->
        <el-card shadow="never" class="contact-card">
          <template #header>
            <span>联系方式</span>
          </template>
          <div class="contact-info">
            <p><el-icon><Phone /></el-icon> 咨询电话：010-12345678</p>
            <p><el-icon><Message /></el-icon> 邮箱：support@example.com</p>
            <p><el-icon><Clock /></el-icon> 工作时间：周一至周五 9:00-17:00</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Download, Phone, Message, Clock } from '@element-plus/icons-vue'

const activeNames = ref(['1'])

const reviewCriteria = [
  { item: '项目必要性', content: '项目符合政策方向，需求明确', score: 20 },
  { item: '方案可行性', content: '实施方案科学合理，进度安排合理', score: 25 },
  { item: '团队专业性', content: '执行团队专业，经验丰富', score: 15 },
  { item: '预算合理性', content: '预算编制合理，资金用途明确', score: 20 },
  { item: '预期效果', content: '社会效益和经济效益显著', score: 20 }
]

const handleDownload = () => {
  ElMessage.success('模板下载中...')
}

const handleContact = () => {
  ElMessage.info('咨询电话：010-12345678')
}
</script>

<style scoped lang="scss">
.guide-page {
  .guide-card {
    .guide-content {
      padding: 12px 0;
      line-height: 1.8;
      color: #666;

      p {
        margin: 8px 0;
      }

      ul {
        padding-left: 20px;

        li {
          margin: 4px 0;
        }
      }
    }
  }

  .action-card {
    margin-bottom: 16px;

    .action-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .action-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 1px solid #e6e6e6;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #AD333A;
          background: #fff5f5;
        }

        .action-icon {
          font-size: 24px;
          color: #AD333A;
        }

        .action-label {
          font-size: 14px;
          color: #333;
        }
      }
    }
  }

  .contact-card {
    .contact-info {
      p {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 12px 0;
        color: #666;
      }
    }
  }
}
</style>
