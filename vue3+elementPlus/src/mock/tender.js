// 招标模块 Mock 数据

// 招标模板列表
export const templateList = [
  {
    id: '1',
    templateName: '运促中心专项资金补助申请模板',
    templateType: 'fund_application',
    isEnabled: true,
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    version: 'v1.0',
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-02-20 15:30:00',
    formFields: [
      {
        fieldName: '机构名称',
        fieldCode: 'orgName',
        fieldType: 'input',
        required: true,
        maxLength: 100,
        placeholder: '请输入机构名称'
      },
      {
        fieldName: '统一社会信用代码',
        fieldCode: 'creditCode',
        fieldType: 'input',
        required: true,
        pattern: '^[0-9A-HJ-NPQRTUWXY]{2}\\\\d{6}[0-9A-HJ-NPQRTUWXY]{10}$',
        placeholder: '请输入统一社会信用代码'
      },
      {
        fieldName: '申请金额',
        fieldCode: 'applyAmount',
        fieldType: 'number',
        required: true,
        min: 0,
        max: 1000000,
        placeholder: '请输入申请金额（元）'
      },
      {
        fieldName: '申请日期',
        fieldCode: 'applyDate',
        fieldType: 'date',
        required: true,
        placeholder: '请选择申请日期'
      },
      {
        fieldName: '机构类型',
        fieldCode: 'orgType',
        fieldType: 'select',
        required: true,
        options: [
          { label: '体育俱乐部', value: 'club' },
          { label: '训练基地', value: 'base' },
          { label: '体育公司', value: 'company' }
        ],
        placeholder: '请选择机构类型'
      },
      {
        fieldName: '申请说明',
        fieldCode: 'description',
        fieldType: 'textarea',
        required: false,
        maxLength: 500,
        placeholder: '请输入申请说明（限500字）'
      },
      {
        fieldName: '附件材料',
        fieldCode: 'attachments',
        fieldType: 'upload',
        required: true,
        fileType: 'file',
        limit: 5,
        placeholder: '请上传附件材料，最多5个文件'
      }
    ]
  },
  {
    id: '2',
    templateName: '场地设施评估模板',
    templateType: 'facility_evaluation',
    isEnabled: true,
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    version: 'v1.0',
    createTime: '2026-01-05 10:00:00',
    updateTime: '2026-02-15 14:20:00',
    formFields: [
      {
        fieldName: '场地名称',
        fieldCode: 'facilityName',
        fieldType: 'input',
        required: true,
        placeholder: '请输入场地名称'
      },
      {
        fieldName: '场地面积',
        fieldCode: 'area',
        fieldType: 'number',
        required: true,
        placeholder: '请输入场地面积（平方米）'
      },
      {
        fieldName: '场地类型',
        fieldCode: 'facilityType',
        fieldType: 'select',
        required: true,
        options: [
          { label: '室内场馆', value: 'indoor' },
          { label: '室外场地', value: 'outdoor' },
          { label: '综合场馆', value: 'comprehensive' }
        ],
        placeholder: '请选择场地类型'
      }
    ]
  }
]

// 字段类型选项
export const fieldTypes = [
  { label: '文本输入', value: 'input', icon: 'Edit' },
  { label: '数字输入', value: 'number', icon: 'Histogram' },
  { label: '下拉选择', value: 'select', icon: 'ArrowDown' },
  { label: '日期选择', value: 'date', icon: 'Calendar' },
  { label: '日期时间', value: 'datetime', icon: 'Timer' },
  { label: '多行文本', value: 'textarea', icon: 'Document' },
  { label: '文件上传', value: 'upload', icon: 'Upload' },
  { label: '开关', value: 'switch', icon: 'Switch' },
  { label: '单选框', value: 'radio', icon: 'CircleCheck' },
  { label: '复选框', value: 'checkbox', icon: 'Select' }
]

export default {
  templateList,
  fieldTypes
}
