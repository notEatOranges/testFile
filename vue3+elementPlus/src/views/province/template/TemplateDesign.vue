<template>
  <div class="template-design-page">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑模板' : '新增模板' }}</h2>
      <p class="page-desc">配置申报模板的指标模块和评分标准</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" :icon="Check" @click="handleSave">保存模板</el-button>
      <el-button :icon="View" @click="showPreview = true">预览</el-button>
      <el-button :icon="Close" @click="handleCancel">取消</el-button>
    </div>

    <!-- Tab 栏 -->
    <div class="tabs-container">
      <div class="tabs-header-wrapper">
        <el-tabs v-model="activeTab" type="card" class="design-tabs">
          <!-- 第一个固定Tab：模板信息 -->
          <el-tab-pane label="模板信息" name="info" :closable="false">
            <div class="tab-content info-tab">
              <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="120px"
                class="info-form"
              >
                <el-form-item label="模板名称" prop="name">
                  <el-input
                    v-model="formData.name"
                    placeholder="请输入模板名称"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="描述" prop="description">
                  <el-input
                    v-model="formData.description"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入模板描述"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="选择专家" prop="experts">
                  <el-select
                    v-model="formData.experts"
                    multiple
                    placeholder="请选择评审专家"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="expert in expertList"
                      :key="expert.id"
                      :label="`${expert.name} - ${expert.title}`"
                      :value="expert.id"
                    />
                  </el-select>
                  <div class="expert-hint">已选择 {{ formData.experts.length }} 位专家</div>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

        <!-- 动态Tab：模块 -->
        <template v-for="(module, index) in formData.modules" :key="module.id">
          <el-tab-pane :name="module.id" :closable="false">
            <template #label>
              <div
                class="tab-label-wrapper"
                draggable="true"
                @dragstart="handleDragStart(index, $event)"
                @dragover.prevent
                @drop="handleDrop(index, $event)"
                @dragend="handleDragEnd"
              >
                <el-icon class="drag-handle" @click.stop>
                  <Rank />
                </el-icon>
                <span class="tab-name">{{ module.name || `模块${index + 1}` }}</span>
                <el-dropdown trigger="click" @command="(cmd) => handleModuleCommand(cmd, index)">
                  <span class="tab-more-trigger" @click.stop>
                    <el-icon class="tab-more-icon">
                      <MoreFilled />
                    </el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>

              <!-- 模块内容 -->
              <div class="tab-content module-tab">
                <!-- 指标列表 -->
                <div class="indicator-list">
                  <div
                    v-for="(indicator, indicatorIndex) in module.indicators"
                    :key="indicator.id"
                    class="indicator-item"
                  >
                    <!-- 指标头部 -->
                    <div class="indicator-header" @click="toggleIndicatorExpand(index, indicatorIndex)">
                      <el-icon :class="{ expanded: indicator.expanded }">
                        <ArrowRight />
                      </el-icon>
                      <span class="indicator-label">指标{{ indicatorIndex + 1 }}：</span>
                      <el-input
                        v-model="indicator.name"
                        placeholder="请输入指标名称"
                        size="small"
                        style="flex: 1; max-width: 200px"
                        @click.stop
                      />
                      <el-button
                        v-if="module.indicators.length > 1"
                        type="danger"
                        size="small"
                        :icon="Delete"
                        link
                        @click.stop="handleDeleteIndicator(index, indicatorIndex)"
                      >
                        删除
                      </el-button>
                    </div>

                    <!-- 指标内容 -->
                    <div v-show="indicator.expanded" class="indicator-content">
                      <!-- 填报类型选择 -->
                      <div class="form-row">
                        <span class="form-label">填报类型：</span>
                        <el-radio-group v-model="indicator.reportType">
                          <el-radio label="org">机构填报</el-radio>
                          <el-radio label="none">无需填报</el-radio>
                          <el-radio label="system">系统获取</el-radio>
                        </el-radio-group>
                      </div>

                      <!-- 填报内容列表（仅机构填报时显示） -->
                      <template v-if="indicator.reportType === 'org'">
                        <div
                          v-for="(content, contentIndex) in indicator.reportContents"
                          :key="content.id"
                          class="report-content-item"
                        >
                          <div class="form-row">
                            <span class="form-label required">填报内容{{ contentIndex + 1 }}：</span>
                            <el-input
                              v-model="content.label"
                              placeholder="请输入填报内容"
                              maxlength="200"
                              show-word-limit
                              style="flex: 1"
                            />
                            <el-button
                              v-if="indicator.reportContents.length > 1"
                              type="danger"
                              size="small"
                              :icon="Minus"
                              circle
                              @click="handleDeleteReportContent(index, indicatorIndex, contentIndex)"
                            />
                          </div>

                          <div class="form-row">
                            <span class="form-label required">填报形式：</span>
                            <el-radio-group v-model="content.formType">
                              <el-radio label="radio">单选</el-radio>
                              <el-radio label="checkbox">多选</el-radio>
                              <el-radio label="input">输入内容</el-radio>
                            </el-radio-group>
                          </div>

                          <!-- 选项配置（单选/多选时显示） -->
                          <template v-if="content.formType === 'radio' || content.formType === 'checkbox'">
                            <div class="options-section">
                              <div class="options-section-title">选项配置</div>
                              <div class="options-list">
                                <div
                                  v-for="(option, optIndex) in content.options"
                                  :key="optIndex"
                                  class="option-item"
                                >
                                  <el-input
                                    v-model="option.label"
                                    placeholder="选项名称"
                                    size="small"
                                    style="width: 120px"
                                  />
                                  <el-button
                                    type="danger"
                                    size="small"
                                    :icon="Delete"
                                    link
                                    @click="handleDeleteOption(index, indicatorIndex, contentIndex, optIndex)"
                                  />
                                </div>
                              </div>
                              <div class="options-add-btn">
                                <el-button
                                  type="primary"
                                  size="small"
                                  :icon="Plus"
                                  @click="handleAddOption(index, indicatorIndex, contentIndex)"
                                >
                                  添加选项
                                </el-button>
                              </div>
                            </div>
                          </template>

                          <!-- 输入内容配置 -->
                          <template v-if="content.formType === 'input'">
                            <div class="form-row">
                              <span class="form-label">提示语：</span>
                              <el-input
                                v-model="content.placeholder"
                                placeholder="请输入提示语"
                                maxlength="200"
                                show-word-limit
                                style="flex: 1"
                              />
                            </div>
                            <div class="form-row">
                              <span class="form-label">数据类型：</span>
                              <el-select v-model="content.dataType" placeholder="请选择" style="width: 150px">
                                <el-option label="文本" value="text" />
                                <el-option label="数字" value="number" />
                                <el-option label="日期" value="date" />
                              </el-select>
                            </div>
                            <div v-if="content.dataType === 'text'" class="form-row">
                              <span class="form-label">字数限制：</span>
                              <el-input-number v-model="content.maxLength" :min="1" :max="1000" :controls="false" style="width: 100px" />
                              <span class="form-hint">字</span>
                            </div>
                          </template>
                        </div>

                        <div class="add-content-btn">
                          <el-button
                            type="primary"
                            size="small"
                            :icon="Plus"
                            @click="handleAddReportContent(index, indicatorIndex)"
                          >
                            添加填报内容
                          </el-button>
                        </div>
                      </template>

                      <!-- 书面评审配置 -->
                      <div class="review-section">
                        <div class="form-row">
                          <span class="form-label">书面评审：</span>
                          <el-switch v-model="indicator.writtenReview.enabled" />
                        </div>

                        <template v-if="indicator.writtenReview.enabled">
                          <div class="form-row">
                            <span class="form-label required">总分：</span>
                            <el-input-number v-model="indicator.writtenReview.totalScore" :min="0" :controls="false" style="width: 100px" />
                            <span class="form-hint">分</span>
                          </div>

                          <div class="form-row">
                            <span class="form-label required">评判依据：</span>
                            <el-input
                              v-model="indicator.writtenReview.basis"
                              type="textarea"
                              :rows="2"
                              placeholder="请输入评判依据"
                              maxlength="200"
                              show-word-limit
                              style="flex: 1"
                            />
                          </div>

                          <div class="form-row">
                            <span class="form-label required">评分输入方式：</span>
                            <el-radio-group v-model="indicator.writtenReview.inputType">
                              <el-radio label="select">下拉框输入</el-radio>
                              <el-radio label="manual">手动输入</el-radio>
                            </el-radio-group>
                          </div>

                          <!-- 评判标准及分值 -->
                          <div class="criteria-section">
                            <div class="criteria-section-title">评判标准及分值</div>
                            <div class="criteria-list">
                              <div
                                v-for="(criteria, criteriaIndex) in indicator.writtenReview.criteria"
                                :key="criteriaIndex"
                                class="criteria-item"
                              >
                                <el-input
                                  v-model="criteria.standard"
                                  placeholder="请输入评判标准"
                                  maxlength="200"
                                  style="width: 300px"
                                />
                                <span class="form-hint">分值：</span>
                                <el-input-number v-model="criteria.score" :min="0" :controls="false" style="width: 80px" />
                                <el-button
                                  type="danger"
                                  size="small"
                                  :icon="Delete"
                                  link
                                  @click="handleDeleteCriteria(index, indicatorIndex, criteriaIndex)"
                                />
                              </div>
                            </div>
                            <div class="criteria-add-btn">
                              <el-button
                                type="primary"
                                size="small"
                                :icon="Plus"
                                @click="handleAddCriteria(index, indicatorIndex)"
                              >
                                添加标准
                              </el-button>
                            </div>
                          </div>

                          <!-- 文件上传配置 -->
                          <div class="form-row">
                            <span class="form-label">需要上传文件：</span>
                            <el-radio-group v-model="indicator.writtenReview.requireFile">
                              <el-radio :label="true">需要上传文件</el-radio>
                              <el-radio :label="false">不需要上传文件</el-radio>
                            </el-radio-group>
                          </div>

                          <template v-if="indicator.writtenReview.requireFile">
                            <div class="form-row">
                              <span class="form-label">文件数量限制：</span>
                              <el-checkbox v-model="indicator.writtenReview.fileLimitSingle">限1份</el-checkbox>
                            </div>
                          </template>

                          <div class="form-row">
                            <span class="form-label">评分提示文案：</span>
                            <el-input
                              v-model="indicator.writtenReview.hint"
                              type="textarea"
                              :rows="2"
                              placeholder="请输入评分提示文案"
                              maxlength="200"
                              show-word-limit
                              style="flex: 1"
                            />
                          </div>
                        </template>
                      </div>

                      <!-- 实地考察配置 -->
                      <div class="review-section">
                        <div class="form-row">
                          <span class="form-label">实地考察：</span>
                          <el-switch v-model="indicator.onSiteReview.enabled" />
                        </div>

                        <template v-if="indicator.onSiteReview.enabled">
                          <div class="form-row">
                            <span class="form-label required">总分：</span>
                            <el-input-number v-model="indicator.onSiteReview.totalScore" :min="0" :controls="false" style="width: 100px" />
                            <span class="form-hint">分</span>
                          </div>

                          <div class="form-row">
                            <span class="form-label required">评判依据：</span>
                            <el-input
                              v-model="indicator.onSiteReview.basis"
                              type="textarea"
                              :rows="2"
                              placeholder="请输入评判依据"
                              maxlength="200"
                              show-word-limit
                              style="flex: 1"
                            />
                          </div>

                          <div class="form-row">
                            <span class="form-label required">评分输入方式：</span>
                            <el-radio-group v-model="indicator.onSiteReview.inputType">
                              <el-radio label="select">下拉框输入</el-radio>
                              <el-radio label="manual">手动输入</el-radio>
                            </el-radio-group>
                          </div>

                          <!-- 评判标准及分值 -->
                          <div class="criteria-section">
                            <div class="criteria-section-title">评判标准及分值</div>
                            <div class="criteria-list">
                              <div
                                v-for="(criteria, criteriaIndex) in indicator.onSiteReview.criteria"
                                :key="criteriaIndex"
                                class="criteria-item"
                              >
                                <el-input
                                  v-model="criteria.standard"
                                  placeholder="请输入评判标准"
                                  maxlength="200"
                                  style="width: 300px"
                                />
                                <span class="form-hint">分值：</span>
                                <el-input-number v-model="criteria.score" :min="0" :controls="false" style="width: 80px" />
                                <el-button
                                  type="danger"
                                  size="small"
                                  :icon="Delete"
                                  link
                                  @click="handleDeleteOnSiteCriteria(index, indicatorIndex, criteriaIndex)"
                                />
                              </div>
                            </div>
                            <div class="criteria-add-btn">
                              <el-button
                                type="primary"
                                size="small"
                                :icon="Plus"
                                @click="handleAddOnSiteCriteria(index, indicatorIndex)"
                              >
                                添加标准
                              </el-button>
                            </div>
                          </div>

                          <!-- 文件上传配置 -->
                          <div class="form-row">
                            <span class="form-label">需要上传文件：</span>
                            <el-radio-group v-model="indicator.onSiteReview.requireFile">
                              <el-radio :label="true">需要上传文件</el-radio>
                              <el-radio :label="false">不需要上传文件</el-radio>
                            </el-radio-group>
                          </div>

                          <template v-if="indicator.onSiteReview.requireFile">
                            <div class="form-row">
                              <span class="form-label">文件数量限制：</span>
                              <el-checkbox v-model="indicator.onSiteReview.fileLimitSingle">限1份</el-checkbox>
                            </div>
                          </template>

                          <div class="form-row">
                            <span class="form-label">评分提示文案：</span>
                            <el-input
                              v-model="indicator.onSiteReview.hint"
                              type="textarea"
                              :rows="2"
                              placeholder="请输入评分提示文案"
                              maxlength="200"
                              show-word-limit
                              style="flex: 1"
                            />
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>

                  <!-- 添加指标按钮 -->
                  <div class="add-indicator-btn">
                    <el-button
                      type="primary"
                      :icon="Plus"
                      @click="handleAddIndicator(index)"
                    >
                      添加指标
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
        </template>
        </el-tabs>

        <!-- 添加模块按钮 -->
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleAddModule"
          size="small"
          class="add-module-inline-btn"
        >
          新增模块
        </el-button>
      </div>
    </div>

    <!-- 模块编辑对话框 -->
    <el-dialog
      v-model="showModuleEditDialog"
      title="编辑模块"
      width="500px"
    >
      <el-form :model="editingModule" label-width="100px">
        <el-form-item label="模块名称">
          <el-input v-model="editingModule.name" placeholder="请输入模块名称" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="序号">
          <el-input-number v-model="editingModule.sort" :min="1" :controls="false" style="width: 100px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showModuleEditDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEditModule">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreview"
      title="填报预览"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="form-preview-content">
        <!-- 模板标题 -->
        <div class="form-header">
          <h2>{{ formData.name || '未命名模板' }}</h2>
          <p class="form-desc">{{ formData.description || '请按照要求填写以下信息' }}</p>
        </div>

        <!-- 填报表单 -->
        <el-form label-position="top" class="preview-form">
          <!-- 遍历模块 -->
          <div v-for="(module, moduleIndex) in formData.modules" :key="module.id" class="form-module">
            <div class="form-module-title">
              <span class="module-index">{{ moduleIndex + 1 }}</span>
              <span>{{ module.name || '未命名模块' }}</span>
            </div>

            <!-- 遍历指标 -->
            <div v-for="(indicator, idx) in module.indicators" :key="indicator.id" class="form-indicator">
              <!-- 只有机构填报类型才显示表单 -->
              <template v-if="indicator.reportType === 'org'">
                <div class="indicator-label">
                  <span class="indicator-name">{{ indicator.name || `指标${idx + 1}` }}</span>
                  <span v-if="indicator.required" class="required-mark">*</span>
                </div>

                <!-- 填报内容表单 -->
                <div class="indicator-form">
                  <div v-for="(content, contentIdx) in indicator.reportContents" :key="contentIdx" class="form-content-item">
                    <el-form-item :label="content.label">
                      <!-- 单选 -->
                      <el-radio-group v-if="content.formType === 'radio'" disabled>
                        <el-radio v-for="(opt, optIdx) in content.options" :key="optIdx" :label="opt.value">{{ opt.label }}</el-radio>
                      </el-radio-group>

                      <!-- 多选 -->
                      <el-checkbox-group v-else-if="content.formType === 'checkbox'" disabled>
                        <el-checkbox v-for="(opt, optIdx) in content.options" :key="optIdx" :label="opt.value">{{ opt.label }}</el-checkbox>
                      </el-checkbox-group>

                      <!-- 输入框 -->
                      <el-input v-else-if="content.formType === 'input'" disabled :placeholder="content.placeholder || '请输入'" />

                      <!-- 文本域 -->
                      <el-input v-else-if="content.formType === 'textarea'" type="textarea" :rows="3" disabled :placeholder="content.placeholder || '请输入'" />

                      <!-- 数字输入 -->
                      <el-input-number v-else-if="content.formType === 'number'" disabled :controls="false" :placeholder="content.placeholder || '请输入'" style="width: 200px" />

                      <!-- 日期选择 -->
                      <el-date-picker v-else-if="content.formType === 'date'" disabled :placeholder="content.placeholder || '请选择'" style="width: 200px" />

                      <!-- 下拉选择 -->
                      <el-select v-else-if="content.formType === 'select'" disabled :placeholder="content.placeholder || '请选择'" style="width: 200px">
                        <el-option v-for="(opt, optIdx) in content.options" :key="optIdx" :label="opt.label" :value="opt.value" />
                      </el-select>

                      <!-- 文件上传 -->
                      <el-upload v-else-if="content.formType === 'file'" disabled>
                        <el-button icon="Upload">点击上传</el-button>
                      </el-upload>

                      <!-- 图片上传 -->
                      <el-upload v-else-if="content.formType === 'image'" disabled list-type="picture-card">
                        <el-icon><Plus /></el-icon>
                      </el-upload>
                    </el-form-item>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTemplateStore } from '@/stores/province/template'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check, Close, Plus, Delete, ArrowRight, Minus, View, Rank, MoreFilled, Edit
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const templateStore = useTemplateStore()

const formRef = ref()
const isEdit = computed(() => !!route.query.id)
const activeTab = ref('info')
const showPreview = ref(false)
const showModuleEditDialog = ref(false)
const editingModule = ref({ name: '', sort: 1 })
const editingModuleIndex = ref(-1)

const expertList = ref([
  { id: 'exp_1', name: '张教授', title: '主任医师' },
  { id: 'exp_2', name: '李专家', title: '副主任医师' },
  { id: 'exp_3', name: '王评审', title: '教授' },
  { id: 'exp_4', name: '赵医生', title: '主治医师' },
  { id: 'exp_5', name: '刘专家', title: '研究员' }
])

const formData = reactive({
  id: '',
  name: '',
  description: '',
  experts: [],
  modules: []
})

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入模板描述', trigger: 'blur' }],
  experts: [{ required: true, message: '请选择评审专家', trigger: 'change' }]
}

// 选中的专家文本
const selectedExpertsText = computed(() => {
  return formData.experts.map(id => {
    const expert = expertList.value.find(e => e.id === id)
    return expert ? expert.name : id
  }).join('、')
})

// 总指标数
const totalIndicators = computed(() => {
  return formData.modules.reduce((total, module) => {
    return total + module.indicators.length
  }, 0)
})

// 创建默认指标
const createDefaultIndicator = () => ({
  id: `indicator_${Date.now()}`,
  name: '',
  expanded: true,
  reportType: 'org',
  reportContents: [
    {
      id: `content_${Date.now()}`,
      label: '',
      formType: 'input',
      options: [
        { label: '选项一', value: '1' },
        { label: '选项二', value: '2' }
      ],
      placeholder: '',
      dataType: 'text',
      maxLength: 1000
    }
  ],
  writtenReview: {
    enabled: true,
    totalScore: 10,
    basis: '',
    inputType: 'select',
    criteria: [
      { standard: '', score: 0 }
    ],
    requireFile: false,
    fileLimitSingle: true,
    hint: ''
  },
  onSiteReview: {
    enabled: true,
    totalScore: 10,
    basis: '',
    inputType: 'select',
    criteria: [
      { standard: '', score: 0 }
    ],
    requireFile: false,
    fileLimitSingle: true,
    hint: ''
  }
})

// 创建默认模块
const createDefaultModule = () => ({
  id: `module_${Date.now()}`,
  name: '',
  indicators: [createDefaultIndicator()]
})

// 添加模块
const handleAddModule = () => {
  const newModule = createDefaultModule()
  formData.modules.push(newModule)
  activeTab.value = newModule.id
}

// 删除模块
const handleDeleteModule = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除该模块吗？', '提示', { type: 'warning' })
    formData.modules.splice(index, 1)
    if (activeTab.value === formData.modules[index]?.id) {
      activeTab.value = 'info'
    }
  } catch {
    // 用户取消
  }
}

// 编辑模块
const handleEditModule = (index) => {
  editingModule.value = {
    name: formData.modules[index].name,
    sort: index + 1
  }
  editingModuleIndex.value = index
  showModuleEditDialog.value = true
}

// 确认编辑模块
const confirmEditModule = () => {
  if (editingModuleIndex.value >= 0) {
    formData.modules[editingModuleIndex.value].name = editingModule.value.name
  }
  showModuleEditDialog.value = false
}

// 处理模块命令
const handleModuleCommand = (command, index) => {
  if (command === 'edit') {
    handleEditModule(index)
  } else if (command === 'delete') {
    handleDeleteModule(index)
  }
}

// 拖拽相关
const draggedIndex = ref(null)

const handleDragStart = (index, event) => {
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.target.classList.add('dragging')
}

const handleDrop = (targetIndex, event) => {
  event.preventDefault()
  const fromIndex = draggedIndex.value
  if (fromIndex === null || fromIndex === targetIndex) return

  // 重新排序模块
  const [movedModule] = formData.modules.splice(fromIndex, 1)
  formData.modules.splice(targetIndex, 0, movedModule)

  // 如果当前打开的tab是被拖动的，需要更新activeTab
  if (activeTab.value === movedModule.id) {
    // 保持当前tab不变
  }

  draggedIndex.value = null
}

const handleDragEnd = (event) => {
  event.target.classList.remove('dragging')
  draggedIndex.value = null
}

// 添加指标
const handleAddIndicator = (moduleIndex) => {
  formData.modules[moduleIndex].indicators.push(createDefaultIndicator())
}

// 删除指标
const handleDeleteIndicator = (moduleIndex, indicatorIndex) => {
  formData.modules[moduleIndex].indicators.splice(indicatorIndex, 1)
}

// 切换指标展开状态
const toggleIndicatorExpand = (moduleIndex, indicatorIndex) => {
  const indicator = formData.modules[moduleIndex].indicators[indicatorIndex]
  indicator.expanded = !indicator.expanded
}

// 添加填报内容
const handleAddReportContent = (moduleIndex, indicatorIndex) => {
  const indicator = formData.modules[moduleIndex].indicators[indicatorIndex]
  indicator.reportContents.push({
    id: `content_${Date.now()}`,
    label: '',
    formType: 'input',
    options: [
      { label: '选项一', value: '1' },
      { label: '选项二', value: '2' }
    ],
    placeholder: '',
    dataType: 'text',
    maxLength: 1000
  })
}

// 删除填报内容
const handleDeleteReportContent = (moduleIndex, indicatorIndex, contentIndex) => {
  const indicator = formData.modules[moduleIndex].indicators[indicatorIndex]
  indicator.reportContents.splice(contentIndex, 1)
}

// 添加选项
const handleAddOption = (moduleIndex, indicatorIndex, contentIndex) => {
  const content = formData.modules[moduleIndex].indicators[indicatorIndex].reportContents[contentIndex]
  const newIndex = content.options.length + 1
  content.options.push({
    label: `选项${newIndex}`,
    value: `${newIndex}`
  })
}

// 删除选项
const handleDeleteOption = (moduleIndex, indicatorIndex, contentIndex, optIndex) => {
  const content = formData.modules[moduleIndex].indicators[indicatorIndex].reportContents[contentIndex]
  content.options.splice(optIndex, 1)
}

// 添加书面评审标准
const handleAddCriteria = (moduleIndex, indicatorIndex) => {
  const indicator = formData.modules[moduleIndex].indicators[indicatorIndex]
  indicator.writtenReview.criteria.push({
    standard: '',
    score: 0
  })
}

// 删除书面评审标准
const handleDeleteCriteria = (moduleIndex, indicatorIndex, criteriaIndex) => {
  const indicator = formData.modules[moduleIndex].indicators[indicatorIndex]
  indicator.writtenReview.criteria.splice(criteriaIndex, 1)
}

// 添加实地考察标准
const handleAddOnSiteCriteria = (moduleIndex, indicatorIndex) => {
  const indicator = formData.modules[moduleIndex].indicators[indicatorIndex]
  indicator.onSiteReview.criteria.push({
    standard: '',
    score: 0
  })
}

// 删除实地考察标准
const handleDeleteOnSiteCriteria = (moduleIndex, indicatorIndex, criteriaIndex) => {
  const indicator = formData.modules[moduleIndex].indicators[indicatorIndex]
  indicator.onSiteReview.criteria.splice(criteriaIndex, 1)
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value.validate()

    if (formData.modules.length === 0) {
      ElMessage.warning('请至少添加一个模块')
      return
    }

    // 验证指标名称
    let hasEmptyName = false
    formData.modules.forEach(module => {
      module.indicators.forEach(indicator => {
        if (!indicator.name) hasEmptyName = true
      })
    })

    if (hasEmptyName) {
      ElMessage.warning('请填写所有指标的名称')
      return
    }

    // 这里调用 API 保存
    if (isEdit.value) {
      // await templateStore.update(route.query.id, formData)
    } else {
      // await templateStore.create(formData)
    }

    ElMessage.success('保存成功')
    router.push('/province/template')
  } catch {
    // 验证失败
  }
}

// 取消
const handleCancel = () => {
  router.back()
}

onMounted(() => {
  if (isEdit.value) {
    // 编辑模式，加载数据
    const template = templateStore.currentTemplate
    if (template) {
      Object.assign(formData, {
        id: template.id,
        name: template.name,
        description: template.description,
        experts: template.experts?.map(e => e.id) || [],
        modules: template.modules || []
      })
      if (formData.modules.length > 0) {
        activeTab.value = formData.modules[0].id
      }
    }
  } else {
    // 新增模式，添加假数据
    formData.id = ''
    formData.name = '2025年度运动促进健康专项资金补助申报模板'
    formData.description = '本模板用于2025年度运动促进健康专项资金补助申报，包含机构基本信息、设施建设、运营管理等多个维度的评估。'
    formData.experts = ['exp_1', 'exp_2', 'exp_3']

    // 创建模块1：基本信息
    const module1 = {
      id: 'module_1',
      name: '基本信息',
      indicators: [
        {
          id: 'ind_1_1',
          name: '机构名称',
          expanded: true,
          reportType: 'org',
          reportContents: [
            {
              id: 'content_1_1_1',
              label: '机构全称',
              formType: 'input',
              options: [],
              placeholder: '请输入机构全称',
              dataType: 'text',
              maxLength: 100
            }
          ],
          writtenReview: {
            enabled: true,
            totalScore: 10,
            basis: '机构名称规范、准确',
            inputType: 'select',
            criteria: [
              { standard: '名称规范，无错误', score: 10 },
              { standard: '名称基本规范，有小错误', score: 8 },
              { standard: '名称不规范', score: 5 }
            ],
            requireFile: false,
            fileLimitSingle: true,
            hint: '请核实机构营业执照上的名称'
          },
          onSiteReview: {
            enabled: false,
            totalScore: 0,
            basis: '',
            inputType: 'select',
            criteria: [
              { standard: '', score: 0 }
            ],
            requireFile: false,
            fileLimitSingle: true,
            hint: ''
          }
        },
        {
          id: 'ind_1_2',
          name: '统一社会信用代码',
          expanded: true,
          reportType: 'org',
          reportContents: [
            {
              id: 'content_1_2_1',
              label: '信用代码',
              formType: 'input',
              options: [],
              placeholder: '请输入统一社会信用代码',
              dataType: 'text',
              maxLength: 50
            }
          ],
          writtenReview: {
            enabled: true,
            totalScore: 5,
            basis: '信用代码有效性验证',
            inputType: 'select',
            criteria: [
              { standard: '代码有效且与营业执照一致', score: 5 },
              { standard: '代码无效或不一致', score: 0 }
            ],
            requireFile: false,
            fileLimitSingle: true,
            hint: ''
          },
          onSiteReview: {
            enabled: false,
            totalScore: 0,
            basis: '',
            inputType: 'select',
            criteria: [
              { standard: '', score: 0 }
            ],
            requireFile: false,
            fileLimitSingle: true,
            hint: ''
          }
        }
      ]
    }

    // 创建模块2：设施建设
    const module2 = {
      id: 'module_2',
      name: '设施建设',
      indicators: [
        {
          id: 'ind_2_1',
          name: '场地面积',
          expanded: true,
          reportType: 'org',
          reportContents: [
            {
              id: 'content_2_1_1',
              label: '建筑面积',
              formType: 'input',
              options: [],
              placeholder: '请输入建筑面积（平方米）',
              dataType: 'number',
              maxLength: 1000
            }
          ],
          writtenReview: {
            enabled: true,
            totalScore: 20,
            basis: '根据场地面积评分，面积越大分数越高',
            inputType: 'select',
            criteria: [
              { standard: '5000平方米以上', score: 20 },
              { standard: '3000-5000平方米', score: 15 },
              { standard: '1000-3000平方米', score: 10 },
              { standard: '1000平方米以下', score: 5 }
            ],
            requireFile: true,
            fileLimitSingle: false,
            hint: '请提供场地证明材料'
          },
          onSiteReview: {
            enabled: true,
            totalScore: 15,
            basis: '实地测量场地面积',
            inputType: 'manual',
            criteria: [
              { standard: '', score: 0 }
            ],
            requireFile: true,
            fileLimitSingle: true,
            hint: '现场核实实际使用面积'
          }
        }
      ]
    }

    formData.modules = [module1, module2]
    activeTab.value = 'info'
  }
})
</script>

<style scoped lang="scss">
.template-design-page {
  .page-header {
    margin-bottom: 16px;
  }

  .action-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px;
    background: #fff;
    border-radius: 4px;
  }

  .tabs-container {
    background: #fff;
    border-radius: 4px;
    padding: 16px;
  }

  .tabs-header-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 16px;
  }

  .design-tabs {
    flex: 1;
    min-width: 0;

    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }

    :deep(.el-tabs__nav) {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }

    :deep(.el-tabs__item) {
      position: relative;
      padding: 0 16px;
      height: 40px;
      line-height: 40px;
      user-select: none;
    }
  }

  .add-module-inline-btn {
    flex-shrink: 0;
    margin-top: 4px;
  }

  .tab-label-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    height: 100%;
    user-select: none;
    cursor: move;
    transition: opacity 0.2s, background-color 0.2s;

    &.dragging {
      opacity: 0.5;
      cursor: grabbing;
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
    }

    .drag-handle {
      cursor: move;
      color: #999;
      font-size: 14px;

      &:hover {
        color: var(--el-color-primary);
      }
    }

    .tab-name {
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tab-more-trigger {
      margin-left: 4px;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      padding: 4px;

      .tab-more-icon {
        color: #999;
        font-size: 14px;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .tab-content {
    padding: 16px 0;
    min-height: 400px;
  }

  .info-tab {
    .info-form {
      max-width: 600px;
    }

    .expert-hint {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }

  .indicator-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .indicator-item {
    background: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 6px;
    overflow: hidden;

    .indicator-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      cursor: pointer;
      background: #f5f5f5;

      .el-icon {
        font-size: 14px;
        color: #999;
        transition: transform 0.3s;

        &.expanded {
          transform: rotate(90deg);
        }
      }

      .indicator-label {
        font-weight: 500;
        color: #333;
      }
    }

    .indicator-content {
      padding: 16px;
      border-top: 1px solid #e6e6e6;
    }
  }

  .form-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .form-label {
      min-width: 120px;
      font-size: 14px;
      color: #333;

      &.required::before {
        content: '*';
        color: #f56c6c;
        margin-right: 4px;
      }
    }

    .form-hint {
      font-size: 12px;
      color: #999;
    }
  }

  .report-content-item {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  .options-section {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 12px;

    .options-section-title {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;

    .option-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .options-add-btn {
    display: flex;
    justify-content: center;
  }

  .add-content-btn {
    display: flex;
    justify-content: center;
    padding: 8px 0;
    border-top: 1px dashed #e6e6e6;
    margin-top: 8px;
  }

  .add-indicator-btn {
    display: flex;
    justify-content: center;
    padding: 16px 0;
    border-top: 1px dashed #e6e6e6;
    margin-top: 12px;
  }

  .criteria-section {
    background: #fff;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #e6e6e6;
    margin-bottom: 12px;

    .criteria-section-title {
      font-size: 13px;
      color: #666;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .criteria-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;

    .criteria-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .criteria-add-btn {
    display: flex;
    justify-content: center;
    padding-top: 8px;
    border-top: 1px dashed #e6e6e6;
  }

  .review-section {
    background: #f0f7ff;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 12px;
    border-left: 3px solid var(--el-color-primary);
  }

  // 表单预览样式
  .form-preview-content {
    max-height: 650px;
    overflow-y: auto;
    padding: 24px;

    .form-header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e6f1ff;

      h2 {
        margin: 0 0 12px;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }

      .form-desc {
        margin: 0;
        font-size: 14px;
        color: #909399;
      }
    }

    .preview-form {
      .form-module {
        margin-bottom: 32px;

        &:last-child {
          margin-bottom: 0;
        }

        .form-module-title {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          margin-bottom: 20px;
          color: #fff;
          font-size: 16px;
          font-weight: 600;

          .module-index {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
          }
        }

        .form-indicator {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          .indicator-label {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px dashed #e5e7eb;

            .indicator-name {
              font-size: 15px;
              font-weight: 600;
              color: #303133;
            }

            .required-mark {
              margin-left: 4px;
              color: #f56c6c;
              font-size: 14px;
            }
          }

          .indicator-form {
            .form-content-item {
              margin-bottom: 16px;

              &:last-child {
                margin-bottom: 0;
              }

              :deep(.el-form-item) {
                margin-bottom: 0;

                .el-form-item__label {
                  color: #606266;
                  font-weight: 500;
                }
              }

              :deep(.el-radio-group),
              :deep(.el-checkbox-group) {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
              }

              :deep(.el-radio),
              :deep(.el-checkbox) {
                margin-right: 0;
              }
            }
          }
        }
      }
    }
  }
}
</style>
