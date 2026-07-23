import request from '../index'

/**
 * 获取模板列表
 */
export const getTemplateList = (params) => {
  return request({
    url: '/province/template/list',
    method: 'get',
    params
  })
}

/**
 * 获取模板详情
 */
export const getTemplateDetail = (id) => {
  return request({
    url: `/province/template/${id}`,
    method: 'get'
  })
}

/**
 * 新增模板
 */
export const createTemplate = (data) => {
  return request({
    url: '/province/template',
    method: 'post',
    data
  })
}

/**
 * 编辑模板
 */
export const updateTemplate = (id, data) => {
  return request({
    url: `/province/template/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除模板
 */
export const deleteTemplate = (id) => {
  return request({
    url: `/province/template/${id}`,
    method: 'delete'
  })
}

/**
 * 复制模板
 */
export const copyTemplate = (id) => {
  return request({
    url: `/province/template/${id}/copy`,
    method: 'post'
  })
}

/**
 * 启用/停用模板
 */
export const toggleTemplateStatus = (id, status) => {
  return request({
    url: `/province/template/${id}/status`,
    method: 'put',
    data: { status }
  })
}

/**
 * 获取专家列表
 */
export const getExpertList = (params) => {
  return request({
    url: '/province/expert/list',
    method: 'get',
    params
  })
}

/**
 * 保存模板专家配置
 */
export const saveTemplateExperts = (id, experts) => {
  return request({
    url: `/province/template/${id}/experts`,
    method: 'put',
    data: { experts }
  })
}

/**
 * 保存模板表单字段配置
 */
export const saveTemplateFields = (id, fields) => {
  return request({
    url: `/province/template/${id}/fields`,
    method: 'put',
    data: { fields }
  })
}
