// 监测模块 Mock 数据

// 数据来源
const sources = ['招标管理', '资质审核', '评审管理', '资金管理']

// 数据类型
const dataTypes = ['申请数据', '审核数据', '评审数据', '支付数据']

// 状态
const statuses = ['normal', 'abnormal', 'pending']

// 生成监测数据
const generateMonitorData = (count) => {
  const data = []
  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)]

    // 生成随机时间（最近7天）
    const now = Date.now()
    const randomTime = now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
    const monitorTime = new Date(randomTime).toISOString().replace('T', ' ').substring(0, 19)

    let content = ''
    let qualityCheck = {}
    let issues = []

    if (status === 'normal') {
      content = '数据质量正常，各项指标符合要求'
      qualityCheck = {
        completeness: 'pass',
        accuracy: 'pass',
        consistency: 'pass',
        timeliness: 'pass'
      }
    } else if (status === 'abnormal') {
      content = '检测到数据异常，请及时处理'
      issues = [
        { type: '完整性', description: '必填字段缺失', severity: 'high' },
        { type: '准确性', description: '数据格式不正确', severity: 'medium' }
      ]
      qualityCheck = {
        completeness: 'fail',
        accuracy: 'fail',
        consistency: 'pass',
        timeliness: 'pass'
      }
    } else {
      content = '数据需要人工确认'
      issues = [
        { type: '一致性', description: '关联数据异常', severity: 'low' }
      ]
      qualityCheck = {
        completeness: 'pass',
        accuracy: 'warning',
        consistency: 'warning',
        timeliness: 'pass'
      }
    }

    data.push({
      id: String(i).padStart(6, '0'),
      source,
      dataType,
      monitorTime,
      status,
      content,
      qualityCheck,
      issues,
      processHistory: status !== 'normal' ? [
        { time: monitorTime, action: '系统检测', operator: '系统', result: '发现问题' }
      ] : []
    })
  }
  return data
}

// 监测数据列表（100条）
export const monitorList = generateMonitorData(100)

// 统计数据
export const statistics = {
  totalCount: 1000,
  normalCount: 950,
  abnormalCount: 30,
  pendingCount: 20,
  abnormalRate: 0.03,
  todayCount: 50,
  trendData: [
    { date: '2026-02-25', count: 120, normal: 115, abnormal: 5 },
    { date: '2026-02-26', count: 135, normal: 128, abnormal: 7 },
    { date: '2026-02-27', count: 142, normal: 136, abnormal: 6 },
    { date: '2026-02-28', count: 138, normal: 132, abnormal: 6 },
    { date: '2026-03-01', count: 145, normal: 139, abnormal: 6 },
    { date: '2026-03-02', count: 150, normal: 144, abnormal: 6 },
    { date: '2026-03-03', count: 170, normal: 156, abnormal: 14 }
  ],
  sourceDistribution: [
    { name: '招标管理', value: 300 },
    { name: '资质审核', value: 250 },
    { name: '评审管理', value: 250 },
    { name: '资金管理', value: 200 }
  ],
  typeDistribution: [
    { name: '申请数据', value: 400 },
    { name: '审核数据', value: 300 },
    { name: '评审数据', value: 200 },
    { name: '支付数据', value: 100 }
  ]
}

// 质控规则
export const qualityRules = [
  {
    id: '1',
    ruleName: '机构名称非空校验',
    ruleCode: 'ORG_NAME_NOT_NULL',
    ruleType: 'completeness',
    targetTable: 'tender_application',
    targetField: 'orgName',
    ruleExpression: 'field !== null && field !== \'\'',
    severity: 'high',
    isEnabled: true,
    description: '机构名称不能为空',
    lastExecuteTime: '2026-03-03 10:00:00',
    executeCount: 1200,
    errorCount: 15,
    errorRate: '1.25%'
  },
  {
    id: '2',
    ruleName: '统一社会信用代码格式校验',
    ruleCode: 'CREDIT_CODE_FORMAT',
    ruleType: 'accuracy',
    targetTable: 'tender_application',
    targetField: 'creditCode',
    ruleExpression: '/^[0-9A-HJ-NPQRTUWXY]{2}\\\\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(field)',
    severity: 'high',
    isEnabled: true,
    description: '统一社会信用代码必须符合18位标准格式',
    lastExecuteTime: '2026-03-03 10:00:00',
    executeCount: 1200,
    errorCount: 8,
    errorRate: '0.67%'
  },
  {
    id: '3',
    ruleName: '申请金额范围校验',
    ruleCode: 'APPLY_AMOUNT_RANGE',
    ruleType: 'accuracy',
    targetTable: 'tender_application',
    targetField: 'applyAmount',
    ruleExpression: 'field >= 0 && field <= 1000000',
    severity: 'medium',
    isEnabled: true,
    description: '申请金额必须在0-100万元之间',
    lastExecuteTime: '2026-03-03 10:00:00',
    executeCount: 1200,
    errorCount: 5,
    errorRate: '0.42%'
  },
  {
    id: '4',
    ruleName: '关联机构存在性校验',
    ruleCode: 'ORG_EXISTS',
    ruleType: 'consistency',
    targetTable: 'tender_application',
    targetField: 'orgId',
    ruleExpression: 'relatedTable.find(r => r.id === field) !== undefined',
    severity: 'high',
    isEnabled: true,
    description: '申请机构必须在机构表中存在',
    lastExecuteTime: '2026-03-03 10:00:00',
    executeCount: 1200,
    errorCount: 2,
    errorRate: '0.17%'
  },
  {
    id: '5',
    ruleName: '数据更新时效性校验',
    ruleCode: 'DATA_TIMELINESS',
    ruleType: 'timeliness',
    targetTable: 'tender_application',
    targetField: 'updateTime',
    ruleExpression: '(Date.now() - new Date(field)) / 86400000 <= 7',
    severity: 'medium',
    isEnabled: false,
    description: '数据更新时间不能超过7天',
    lastExecuteTime: '2026-03-02 10:00:00',
    executeCount: 800,
    errorCount: 25,
    errorRate: '3.13%'
  }
]

// 规则执行历史
export const ruleHistory = [
  {
    id: '1',
    ruleId: '1',
    executeTime: '2026-03-03 10:00:00',
    recordCount: 100,
    errorCount: 2,
    errorRate: '2%',
    errorDetails: [
      { recordId: '000005', field: 'orgName', error: '字段为空' },
      { recordId: '000018', field: 'orgName', error: '字段为空' }
    ]
  },
  {
    id: '2',
    ruleId: '1',
    executeTime: '2026-03-02 10:00:00',
    recordCount: 98,
    errorCount: 1,
    errorRate: '1.02%',
    errorDetails: [
      { recordId: '000042', field: 'orgName', error: '字段为空' }
    ]
  }
]

export default {
  monitorList,
  statistics,
  qualityRules,
  ruleHistory
}
