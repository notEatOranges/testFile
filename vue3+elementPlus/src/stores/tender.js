import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTenderStore = defineStore('tender', () => {
  // 状态
  const templateList = ref([])
  const currentTemplate = ref(null)
  const loading = ref(false)

  // 表单字段配置
  const formFields = ref([])

  // 方法
  const setTemplateList = (data) => {
    templateList.value = data
  }

  const setCurrentTemplate = (template) => {
    currentTemplate.value = template
  }

  const setFormFields = (fields) => {
    formFields.value = fields
  }

  const addFormField = (field) => {
    formFields.value.push(field)
  }

  const removeFormField = (index) => {
    formFields.value.splice(index, 1)
  }

  const updateFormField = (index, field) => {
    formFields.value[index] = field
  }

  const setLoading = (status) => {
    loading.value = status
  }

  return {
    // 状态
    templateList,
    currentTemplate,
    loading,
    formFields,
    // 方法
    setTemplateList,
    setCurrentTemplate,
    setFormFields,
    addFormField,
    removeFormField,
    updateFormField,
    setLoading
  }
})
