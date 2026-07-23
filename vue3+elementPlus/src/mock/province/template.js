import { delay } from '../index'

// 模拟模板数据
const generateTemplates = (count = 10) => {
  const templates = []
  const statuses = ['active', 'inactive']

  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    templates.push({
      id: `tpl_${i}`,
      name: `申报模板${i}`,
      description: `这是第${i}个申报模板，用于${i % 2 === 0 ? '体育场馆' : '体育赛事'}的申报管理`,
      status,
      formFields: generateFormFields(),
      experts: generateExperts(),
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  }

  return templates
}

const generateFormFields = () => {
  return [
    { id: 'field_1', label: '机构名称', type: 'input', required: true },
    { id: 'field_2', label: '统一社会信用代码', type: 'input', required: true },
    { id: 'field_3', label: '联系人', type: 'input', required: true },
    { id: 'field_4', label: '联系电话', type: 'input', required: true },
    { id: 'field_5', label: '申请金额', type: 'number', required: true },
    { id: 'field_6', label: '申请说明', type: 'textarea', required: false }
  ]
}

const generateExperts = () => {
  const experts = [
    { id: 'exp_1', name: '张教授', title: '主任医师' },
    { id: 'exp_2', name: '李专家', title: '副主任医师' },
    { id: 'exp_3', name: '王评审', title: '教授' }
  ]
  return experts.slice(0, Math.floor(Math.random() * 3) + 1)
}

export const templateList = generateTemplates(15)

// 获取模板列表
export const mockGetTemplateList = async (params) => {
  await delay()
  const { page = 1, pageSize = 10, name, status } = params

  let filteredList = [...templateList]

  if (name) {
    filteredList = filteredList.filter(item => item.name.includes(name))
  }
  if (status) {
    filteredList = filteredList.filter(item => item.status === status)
  }

  const total = filteredList.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const list = filteredList.slice(start, end)

  return {
    code: 200,
    message: 'success',
    data: { list, total }
  }
}

// 获取模板详情
export const mockGetTemplateDetail = async (id) => {
  await delay()
  const template = templateList.find(item => item.id === id)
  return {
    code: 200,
    message: 'success',
    data: template || templateList[0]
  }
}

// 新增模板
export const mockCreateTemplate = async (data) => {
  await delay()
  const newTemplate = {
    id: `tpl_${Date.now()}`,
    ...data,
    status: 'inactive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  templateList.unshift(newTemplate)
  return {
    code: 200,
    message: '创建成功',
    data: newTemplate
  }
}

// 更新模板
export const mockUpdateTemplate = async (id, data) => {
  await delay()
  const index = templateList.findIndex(item => item.id === id)
  if (index !== -1) {
    templateList[index] = {
      ...templateList[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    return {
      code: 200,
      message: '更新成功',
      data: templateList[index]
    }
  }
  return {
    code: 404,
    message: '模板不存在'
  }
}

// 删除模板
export const mockDeleteTemplate = async (id) => {
  await delay()
  const index = templateList.findIndex(item => item.id === id)
  if (index !== -1) {
    templateList.splice(index, 1)
    return {
      code: 200,
      message: '删除成功'
    }
  }
  return {
    code: 404,
    message: '模板不存在'
  }
}

// 复制模板
export const mockCopyTemplate = async (id) => {
  await delay()
  const template = templateList.find(item => item.id === id)
  if (template) {
    const newTemplate = {
      ...template,
      id: `tpl_${Date.now()}`,
      name: `${template.name} (副本)`,
      status: 'inactive',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    templateList.unshift(newTemplate)
    return {
      code: 200,
      message: '复制成功',
      data: newTemplate
    }
  }
  return {
    code: 404,
    message: '模板不存在'
  }
}

// 切换模板状态
export const mockToggleTemplateStatus = async (id, status) => {
  await delay()
  const index = templateList.findIndex(item => item.id === id)
  if (index !== -1) {
    templateList[index].status = status
    templateList[index].updatedAt = new Date().toISOString()
    return {
      code: 200,
      message: status === 'active' ? '已启用' : '已停用',
      data: templateList[index]
    }
  }
  return {
    code: 404,
    message: '模板不存在'
  }
}

// 获取专家列表
export const mockGetExpertList = async () => {
  await delay()
  const experts = [
    { id: 'exp_1', name: '张教授', title: '主任医师', hospital: '省人民医院', special: '运动医学' },
    { id: 'exp_2', name: '李专家', title: '副主任医师', hospital: '市第一医院', special: '康复医学' },
    { id: 'exp_3', name: '王评审', title: '教授', hospital: '体育大学', special: '体育教育' },
    { id: 'exp_4', name: '赵医生', title: '主治医师', hospital: '中医院', special: '中医康复' },
    { id: 'exp_5', name: '刘专家', title: '研究员', hospital: '体育科研所', special: '运动训练' }
  ]
  return {
    code: 200,
    message: 'success',
    data: { list: experts, total: experts.length }
  }
}

// 导出 Mock API 处理函数
export const templateMockHandlers = {
  '/api/province/template/list': async (url) => {
    const params = new URLSearchParams(url.split('?')[1])
    const paramsObj = Object.fromEntries(params)
    const result = await mockGetTemplateList(paramsObj)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  },
  '/api/province/template/expert/list': async () => {
    const result = await mockGetExpertList()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
