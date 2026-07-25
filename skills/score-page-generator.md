# 评分页面生成能力文档

## 概述

本文档描述如何根据模板配置生成书面评审评分页面。评分页面用于专家对申请进行打分，支持暂存和提交功能。

## 核心数据结构

### 模板配置结构（writtenReview）

```javascript
{
  modules: [
    {
      id: 'module_1',
      name: '基础设施评估',
      indicators: [
        {
          id: 'indicator_1',
          name: '场地设施情况',
          maxScore: 40,           // 该指标最高分
          inputType: 'select',    // 'select' 下拉选择 | 'manual' 手动输入
          tips: '评分提示信息',   // 可选，评分提示
          criteria: [             // 评分标准及分值
            { id: 'c1', description: '完全符合要求', score: 40 },
            { id: 'c2', description: '基本符合要求', score: 30 },
            { id: 'c3', description: '部分符合要求', score: 20 },
            { id: 'c4', description: '不符合要求', score: 0 }
          ],
          // 填报内容（申请时填写的数据）
          fillData: [
            {
              id: 'fill_1',
              title: '场地面积',
              formType: 'input',   // 'input' 文本 | 'single' 单选 | 'multi' 多选
              value: '2000平方米',
              selectConfig: null   // 单选/多选时有值
            },
            {
              id: 'fill_2',
              title: '设施类型',
              formType: 'multi',
              value: ['type_1', 'type_3'],
              selectConfig: {
                options: [
                  { id: 'type_1', label: '健身器材' },
                  { id: 'type_2', label: '游泳池' },
                  { id: 'type_3', label: '篮球场' }
                ]
              }
            }
          ],
          // 附件材料
          attachment: {
            attachmentFiles: [
              { name: '场地照片.jpg', url: 'xxx', size: 102400, originUrl: 'xxx' }
            ]
          }
        }
      ]
    }
  ]
}
```

### 评分数据结构

```javascript
{
  applicationId: 'xxx',      // 申请ID
  expertId: 'xxx',           // 专家ID
  status: 'pending',         // pending | in_progress | completed
  totalScore: 0,             // 总得分
  modules: [
    {
      id: 'module_1',
      name: '基础设施评估',
      indicators: [
        {
          id: 'indicator_1',
          name: '场地设施情况',
          maxScore: 40,
          score: null,           // 实际打分（两位小数）
          deductionReason: '',   // 扣分依据（非满分必填，最多200字）
        }
      ]
    }
  ]
}
```

## 页面布局

### 整体结构
```
┌─────────────────────────────────────────────────────────┐
│  页面标题（申请名称）                                      │
├─────────────────────────────────┬───────────────────────┤
│                                 │                       │
│   评分区域（可滚动）              │   评分总览（固定）     │
│                                 │                       │
│   ┌─────────────────────────┐   │   ┌─────────────────┐ │
│   │ 模块1标题               │   │   │ 进度条          │ │
│   │   ┌───────────────────┐ │   │   │ 已完成 X / 共 Y │ │
│   │   │ 指标卡片1         │ │   │   └─────────────────┘ │
│   │   │  - 填报内容       │ │   │                       │
│   │   │  - 附件材料       │ │   │   ┌─────────────────┐ │
│   │   │  - 评分标准       │ │   │   │ 指标完成情况    │ │
│   │   │  - 得分输入       │ │   │   │ □ 模块1        │ │
│   │   │  - 扣分依据       │ │   │   │   ✓ 指标1      │ │
│   │   └───────────────────┘ │   │   │   ○ 指标2      │ │
│   │   ┌───────────────────┐ │   │   │ □ 模块2        │ │
│   │   │ 指标卡片2         │ │   │   │   ...          │ │
│   │   └───────────────────┘ │   │   └─────────────────┘ │
│   └─────────────────────────┘   │                       │
│                                 │                       │
├─────────────────────────────────┴───────────────────────┤
│  [暂存]  [提交]                                          │
└─────────────────────────────────────────────────────────┘
```

## 组件说明

### 1. 指标评分卡片（ScoreIndicatorCard）

每个指标一个卡片，包含以下部分：

#### 1.1 卡片头部（可折叠）
- 折叠图标（箭头）
- 指标名称
- 满分提示："（满分 XX 分）"
- 已评分标签（如果有分数）

#### 1.2 填报内容展示
- 标题："填报内容"
- 使用描述列表展示每个填写项
- 根据 `formType` 显示不同内容：
  - `input`: 直接显示文本
  - `single`: 显示选中选项的 label
  - `multi`: 显示选中选项的 label，用顿号连接

#### 1.3 附件材料
- 标题："附件材料"
- 使用文件列表组件展示附件
- 支持预览和下载

#### 1.4 评分标准及分值
- 标题："评分标准及分值"
- 列表展示所有 criteria
- 按分数从高到低排序
- 格式：序号. 描述 分值

#### 1.5 评分输入区域
- 标签："书面评审得分"
- 根据 `inputType` 显示不同输入：
  - `select`: 下拉框，选项为 criteria，格式"描述（XX分）"
  - `manual`: 数字输入框，支持两位小数
- 分数单位："分"
- 评分提示（如果有 tips）

#### 1.6 扣分依据
- 文本域，最多200字，显示字数统计
- 标签根据分数动态变化：
  - 满分时："扣分依据（满分时非必填）"
  - 非满分时："扣分依据"

## 交互逻辑

### 1. 分数输入校验

```javascript
// 分数变化处理
function handleScoreChange(value) {
  // 检查是否超过最高分
  if (value !== null && value !== undefined && Number(value) > indicator.maxScore) {
    formData.score = null;
    emit('update:score', null);
    modal.msgWarning('分数不得超过指标最高分，请重新打分。');
    return;
  }

  emit('update:score', value);

  // 如果是满分，清空扣分依据
  if (Number(value) === indicator.maxScore) {
    formData.deductionReason = '';
    emit('update:deductionReason', '');
  }

  // 触发扣分依据校验
  formRef.value?.validateField('deductionReason');
}
```

### 2. 扣分依据校验

```javascript
// 扣分依据校验规则
function validateDeductionReason(rule, value, callback) {
  const score = Number(formData.score);
  const isNotFullScore = !isNaN(score) && score < indicator.maxScore;

  if (isNotFullScore && !value?.trim()) {
    callback(new Error('非满分时扣分依据必填'));
  } else {
    callback();
  }
}
```

### 3. 指标完成判断

```javascript
function isIndicatorCompleted(indicator) {
  // 分数未填写，未完成
  if (indicator.score === null || indicator.score === undefined || indicator.score === '') {
    return false;
  }
  // 非满分且未填写扣分依据，未完成
  if (Number(indicator.score) < indicator.maxScore && !indicator.deductionReason?.trim()) {
    return false;
  }
  return true;
}
```

### 4. 提交校验

```javascript
async function handleSubmit() {
  // 校验所有指标
  for (const module of modules.value) {
    for (const indicator of module.indicators) {
      if (!isIndicatorCompleted(indicator)) {
        // 定位到第一个未完成的指标
        scrollToIndicator(module.id, indicator.id);
        modal.msgWarning('请完成所有指标的评分');
        return;
      }
    }
  }

  // 提交评分
  submitScore(scoreData).then(() => {
    modal.msgSuccess('提交成功');
    // 返回列表页
  });
}
```

### 5. 定位到指标

```javascript
function scrollToIndicator(moduleId, indicatorId) {
  const element = document.getElementById(`indicator-${moduleId}-${indicatorId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 高亮该指标卡片
  }
}
```

## 右侧边栏组件

### 评分总览
- 进度条：已完成百分比
- 完成情况："已完成 X / 共 Y 项"

### 指标完成情况
- 按模块分组显示
- 每个指标显示：
  - 指标名称
  - 完成状态图标（✓ 已完成 / ○ 未完成）
- 点击指标可定位到左侧对应位置

## API 接口

```javascript
// 获取评分详情
export function getScoreDetail(applicationId, expertId) {
  return request({
    url: '/business/healthCenter/specialFundApplication/score/detail',
    method: 'get',
    params: { applicationId, expertId }
  });
}

// 暂存评分
export function saveScoreDraft(data) {
  return request({
    url: '/business/healthCenter/specialFundApplication/score/draft',
    method: 'post',
    data
  });
}

// 提交评分
export function submitScore(data) {
  return request({
    url: '/business/healthCenter/specialFundApplication/score/submit',
    method: 'post',
    data
  });
}
```

## 小程序适配建议

### 1. 布局调整
- 移除右侧边栏，改为顶部悬浮的进度指示器
- 或使用底部 Tab 切换"评分"和"总览"

### 2. 组件替换
| Web 组件 | 小程序替代方案 |
|---------|--------------|
| el-form | 原生 form + 自定义校验 |
| el-input-number | input type="digit" |
| el-select | picker 组件 |
| el-progress | 自定义进度条或 canvas |
| el-scrollbar | scroll-view |

### 3. 交互优化
- 使用微信的 showToast 提示
- 使用 showConfirm 确认提交
- 折叠动画使用小程序动画 API

### 4. 文件预览
- 使用 wx.previewImage 预览图片
- 使用 wx.openDocument 打开文档

## 生成提示词模板

```
请根据以下模板配置生成小程序评分页面：

模板配置：
${JSON.stringify(templateConfig, null, 2)}

要求：
1. 使用 uni-app / 原生小程序（选择其一）
2. 实现指标卡片组件，支持折叠展开
3. 支持下拉选择和手动输入两种评分方式
4. 非满分时扣分依据必填
5. 分数超过最高分时清空并提示
6. 实现暂存和提交功能
7. 顶部显示进度指示器
8. 提交时校验完整性，定位到未完成项
```
