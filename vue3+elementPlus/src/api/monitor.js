import request from './index'

// 获取监测数据列表
export const getMonitorList = (params) => {
  return request({
    url: '/monitor/list',
    method: 'get',
    params
  })
}

// 获取监测详情
export const getMonitorDetail = (id) => {
  return request({
    url: `/monitor/detail/${id}`,
    method: 'get'
  })
}

// 导出监测数据
export const exportMonitorData = (data) => {
  return request({
    url: '/monitor/export',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 获取统计数据
export const getStatistics = () => {
  return request({
    url: '/monitor/statistics',
    method: 'get'
  })
}

// 获取质控规则列表
export const getQualityRules = (params) => {
  return request({
    url: '/monitor/rules',
    method: 'get',
    params
  })
}

// 新增质控规则
export const addQualityRule = (data) => {
  return request({
    url: '/monitor/rules',
    method: 'post',
    data
  })
}

// 更新质控规则
export const updateQualityRule = (id, data) => {
  return request({
    url: `/monitor/rules/${id}`,
    method: 'put',
    data
  })
}

// 删除质控规则
export const deleteQualityRule = (id) => {
  return request({
    url: `/monitor/rules/${id}`,
    method: 'delete'
  })
}

// 启用/禁用质控规则
export const toggleQualityRule = (id, enabled) => {
  return request({
    url: `/monitor/rules/${id}/toggle`,
    method: 'put',
    data: { enabled }
  })
}

// 测试质控规则
export const testQualityRule = (data) => {
  return request({
    url: '/monitor/rules/test',
    method: 'post',
    data
  })
}

// 获取规则执行历史
export const getRuleHistory = (ruleId) => {
  return request({
    url: `/monitor/rules/${ruleId}/history`,
    method: 'get'
  })
}
