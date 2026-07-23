import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getTemplateList, createTemplate, updateTemplate, deleteTemplate, copyTemplate, toggleTemplateStatus } from '@/api/province/template'

export const useTemplateStore = defineStore('template', () => {
  // 状态
  const templateList = ref([])
  const total = ref(0)
  const loading = ref(false)
  const currentTemplate = ref(null)

  // 筛选条件
  const filters = ref({
    name: '',
    status: ''
  })

  // 分页
  const pagination = ref({
    page: 1,
    pageSize: 10
  })

  // 计算属性
  const activeTemplateCount = computed(() => {
    return templateList.value.filter(t => t.status === 'active').length
  })

  const inactiveTemplateCount = computed(() => {
    return templateList.value.filter(t => t.status === 'inactive').length
  })

  // 方法
  const fetchTemplateList = async () => {
    loading.value = true
    try {
      const params = {
        ...filters.value,
        ...pagination.value
      }
      const res = await getTemplateList(params)
      if (res.code === 200) {
        templateList.value = res.data.list
        total.value = res.data.total
      }
    } finally {
      loading.value = false
    }
  }

  const create = async (data) => {
    const res = await createTemplate(data)
    if (res.code === 200) {
      await fetchTemplateList()
      return { success: true }
    }
    return { success: false, message: res.message }
  }

  const update = async (id, data) => {
    const res = await updateTemplate(id, data)
    if (res.code === 200) {
      await fetchTemplateList()
      return { success: true }
    }
    return { success: false, message: res.message }
  }

  const remove = async (id) => {
    const res = await deleteTemplate(id)
    if (res.code === 200) {
      await fetchTemplateList()
      return { success: true }
    }
    return { success: false, message: res.message }
  }

  const copy = async (id) => {
    const res = await copyTemplate(id)
    if (res.code === 200) {
      await fetchTemplateList()
      return { success: true }
    }
    return { success: false, message: res.message }
  }

  const toggleStatus = async (id, status) => {
    const res = await toggleTemplateStatus(id, status)
    if (res.code === 200) {
      await fetchTemplateList()
      return { success: true }
    }
    return { success: false, message: res.message }
  }

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
  }

  const resetFilters = () => {
    filters.value = {
      name: '',
      status: ''
    }
    pagination.value.page = 1
  }

  const setCurrentTemplate = (template) => {
    currentTemplate.value = template
  }

  return {
    // 状态
    templateList,
    total,
    loading,
    currentTemplate,
    filters,
    pagination,
    // 计算属性
    activeTemplateCount,
    inactiveTemplateCount,
    // 方法
    fetchTemplateList,
    create,
    update,
    remove,
    copy,
    toggleStatus,
    setFilters,
    resetFilters,
    setCurrentTemplate
  }
})
