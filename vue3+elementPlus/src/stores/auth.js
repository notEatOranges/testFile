import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ROLES } from '@/utils/auth'
import {
  setToken as setTokenToStorage,
  setUser as setUserToStorage,
  setRoles as setRolesToStorage,
  removeToken,
  removeUser,
  removeRoles,
  getToken, getUser, getRoles
} from '@/utils/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态 - 从 localStorage 初始化
  const token = ref(getToken() || '')
  const user = ref(getUser() || null)
  const roles = ref(getRoles() || [])

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => user.value?.username || '')
  const displayName = computed(() => user.value?.name || user.value?.username || '')
  const avatar = computed(() => user.value?.avatar || '')
  const isProvince = computed(() => roles.value.includes(ROLES.PROVINCE))
  const isOrganization = computed(() => roles.value.includes(ROLES.ORGANIZATION))
  const isCity = computed(() => roles.value.includes(ROLES.CITY))
  const isExpert = computed(() => roles.value.includes(ROLES.EXPERT))

  // 方法
  const setToken = (newToken) => {
    token.value = newToken
    setTokenToStorage(newToken)
  }

  const setUser = (userData) => {
    user.value = userData
    setUserToStorage(userData)
  }

  const setRoles = (userRoles) => {
    roles.value = userRoles
    setRolesToStorage(userRoles)
  }

  // Mock 登录（直接返回模拟数据，不调用 API）
  const login = async (loginData) => {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      // 根据选择的角色生成用户数据
      const mockUsers = {
        province: {
          id: 'user_province',
          username: loginData.username,
          name: '省体育局管理员',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        },
        organization: {
          id: 'user_org',
          username: loginData.username,
          name: '机构用户',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        },
        city: {
          id: 'user_city',
          username: loginData.username,
          name: '市局管理员',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        },
        expert: {
          id: 'user_expert',
          username: loginData.username,
          name: '评审专家',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        }
      }

      const userData = mockUsers[loginData.role]
      if (!userData) {
        return { success: false, message: '请选择正确的角色' }
      }

      // 设置登录状态（同时更新内存和 localStorage）
      const mockToken = 'mock_token_' + Date.now()
      setToken(mockToken)
      setUser(userData)
      setRoles([loginData.role])

      return { success: true }
    } catch (error) {
      return { success: false, message: error.message || '登录失败' }
    }
  }

  const logout = async () => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200))

    // 清除状态（同时更新内存和 localStorage）
    token.value = ''
    user.value = null
    roles.value = []

    removeToken()
    removeUser()
    removeRoles()
  }

  const getUserInfoData = async () => {
    // 已在登录时设置，直接返回
    return {
      user: user.value,
      roles: roles.value
    }
  }

  const hasRole = (role) => {
    return roles.value.includes(role)
  }

  const hasAnyRole = (roleList) => {
    return roleList.some(role => roles.value.includes(role))
  }

  const reset = () => {
    token.value = ''
    user.value = null
    roles.value = []
  }

  return {
    // 状态
    token,
    user,
    roles,
    // 计算属性
    isLoggedIn,
    username,
    displayName,
    avatar,
    isProvince,
    isOrganization,
    isCity,
    isExpert,
    // 方法
    setToken,
    setUser,
    setRoles,
    login,
    logout,
    getUserInfoData,
    hasRole,
    hasAnyRole,
    reset
  }
})
