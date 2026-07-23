// Mock 数据配置
import mockData from './monitor'
import { authMockHandlers } from './auth'
import { templateMockHandlers } from './province/template'

// 模拟延迟
export const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API 响应
export const mockApi = {
  // 监测数据列表
  '/api/monitor/list': async (params) => {
    await delay()
    const { page = 1, pageSize = 10, source, dataType, status, startTime, endTime } = params

    let filteredList = [...mockData.monitorList]

    // 筛选
    if (source) {
      filteredList = filteredList.filter(item => item.source === source)
    }
    if (dataType) {
      filteredList = filteredList.filter(item => item.dataType === dataType)
    }
    if (status) {
      filteredList = filteredList.filter(item => item.status === status)
    }
    if (startTime && endTime) {
      filteredList = filteredList.filter(item => {
        const time = new Date(item.monitorTime).getTime()
        return time >= new Date(startTime).getTime() && time <= new Date(endTime).getTime()
      })
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
  },

  // 监测详情
  '/api/monitor/detail': async (id) => {
    await delay()
    const detail = mockData.monitorList.find(item => item.id === id)
    return {
      code: 200,
      message: 'success',
      data: detail || mockData.monitorList[0]
    }
  },

  // 统计数据
  '/api/monitor/statistics': async () => {
    await delay()
    return {
      code: 200,
      message: 'success',
      data: mockData.statistics
    }
  },

  // 质控规则列表
  '/api/monitor/rules': async () => {
    await delay()
    return {
      code: 200,
      message: 'success',
      data: { list: mockData.qualityRules, total: mockData.qualityRules.length }
    }
  }
}

// 合并所有 Mock handlers
export const allMockHandlers = {
  ...mockApi,
  ...authMockHandlers,
  ...templateMockHandlers
}

// 拦截 fetch 并返回 mock 数据
export const setupMock = () => {
  const originalFetch = window.fetch
  window.fetch = async (url, options) => {
    // 检查是否是 mock 路由
    for (const [route, handler] of Object.entries(allMockHandlers)) {
      if (url.includes(route)) {
        // 认证相关接口从 options.body 获取参数
        if (url.includes('/api/auth/')) {
          const result = await handler(url, options)
          return result
        }
        // 其他接口从 URL 参数获取
        const params = new URLSearchParams(url.split('?')[1])
        const paramsObj = Object.fromEntries(params)
        const result = await handler(paramsObj)
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    return originalFetch(url, options)
  }
}
