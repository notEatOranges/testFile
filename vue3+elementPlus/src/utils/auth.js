const TOKEN_KEY = 'sport_admin_token'
const USER_KEY = 'sport_admin_user'
const ROLES_KEY = 'sport_admin_roles'

const ROLES = {
  PROVINCE: 'province',      // 省体育局群体处
  ORGANIZATION: 'organization', // 机构端
  CITY: 'city',               // 市体育部门
  EXPERT: 'expert'            // 专家端
}

const ROLE_NAMES = {
  [ROLES.PROVINCE]: '省体育局群体处',
  [ROLES.ORGANIZATION]: '机构端',
  [ROLES.CITY]: '市体育部门',
  [ROLES.EXPERT]: '专家端'
}

/**
 * 获取 token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 设置 token
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 移除 token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 获取用户信息
 */
export function getUser() {
  const userStr = localStorage.getItem(USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

/**
 * 设置用户信息
 */
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * 移除用户信息
 */
export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

/**
 * 获取用户角色
 */
export function getRoles() {
  const rolesStr = localStorage.getItem(ROLES_KEY)
  if (rolesStr) {
    try {
      return JSON.parse(rolesStr)
    } catch {
      return []
    }
  }
  return []
}

/**
 * 设置用户角色
 */
export function setRoles(roles) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
}

/**
 * 移除用户角色
 */
export function removeRoles() {
  localStorage.removeItem(ROLES_KEY)
}

/**
 * 检查是否有指定角色
 */
export function hasRole(role) {
  const roles = getRoles()
  return roles.includes(role)
}

/**
 * 检查是否有任一角色
 */
export function hasAnyRole(roles) {
  const userRoles = getRoles()
  return roles.some(role => userRoles.includes(role))
}

/**
 * 登录
 */
export function login(token, user, roles) {
  setToken(token)
  setUser(user)
  setRoles(roles)
}

/**
 * 登出
 */
export function logout() {
  removeToken()
  removeUser()
  removeRoles()
}

/**
 * 检查是否已登录
 */
export function isLoggedIn() {
  return !!getToken()
}

/**
 * 获取角色名称
 */
export function getRoleName(role) {
  return ROLE_NAMES[role] || role
}

export { ROLES, ROLE_NAMES }

// 重新导出 permission 模块的函数
export { getDefaultPath } from './permission.js'
