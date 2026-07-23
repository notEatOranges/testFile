import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMonitorStore = defineStore('monitor', () => {
  // 状态
  const monitorList = ref([])
  const total = ref(0)
  const loading = ref(false)
  const statistics = ref({
    totalCount: 0,
    normalCount: 0,
    abnormalCount: 0,
    pendingCount: 0,
    abnormalRate: 0,
    todayCount: 0
  })

  // 筛选条件
  const filters = ref({
    source: '',
    dataType: '',
    status: '',
    startTime: '',
    endTime: ''
  })

  // 分页
  const pagination = ref({
    page: 1,
    pageSize: 10
  })

  // 计算属性
  const abnormalRatePercent = computed(() => {
    if (statistics.value.totalCount === 0) return 0
    return ((statistics.value.abnormalCount / statistics.value.totalCount) * 100).toFixed(2)
  })

  // 方法
  const setMonitorList = (data) => {
    monitorList.value = data.list
    total.value = data.total
  }

  const setStatistics = (data) => {
    statistics.value = data
  }

  const setLoading = (status) => {
    loading.value = status
  }

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const setPagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination }
  }

  const resetFilters = () => {
    filters.value = {
      source: '',
      dataType: '',
      status: '',
      startTime: '',
      endTime: ''
    }
  }

  return {
    // 状态
    monitorList,
    total,
    loading,
    statistics,
    filters,
    pagination,
    // 计算属性
    abnormalRatePercent,
    // 方法
    setMonitorList,
    setStatistics,
    setLoading,
    setFilters,
    setPagination,
    resetFilters
  }
})
