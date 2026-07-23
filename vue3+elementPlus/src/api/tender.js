import request from './index'

// 获取招标模板列表
export const getTemplateList = (params) => {
  return request({
    url: '/tender/templates',
    method: 'get',
    params
  })
}

// 获取模板详情
export const getTemplateDetail = (id) => {
  return request({
    url: `/tender/templates/${id}`,
    method: 'get'
  })
}

// 创建招标模板
export const createTemplate = (data) => {
  return request({
    url: '/tender/templates',
    method: 'post',
    data
  })
}

// 更新招标模板
export const updateTemplate = (id, data) => {
  return request({
    url: `/tender/templates/${id}`,
    method: 'put',
    data
  })
}

// 删除招标模板
export const deleteTemplate = (id) => {
  return request({
    url: `/tender/templates/${id}`,
    method: 'delete'
  })
}

// 启用/禁用模板
export const toggleTemplate = (id, enabled) => {
  return request({
    url: `/tender/templates/${id}/toggle`,
    method: 'put',
    data: { enabled }
  })
}

// 获取字段类型选项
export const getFieldTypes = () => {
  return request({
    url: '/tender/field-types',
    method: 'get'
  })
}
