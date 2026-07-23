import request from './index'

/**
 * 用户登录
 */
export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 用户登出
 */
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
  return request({
    url: '/auth/user-info',
    method: 'get'
  })
}

/**
 * 刷新 token
 */
export const refreshToken = () => {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

/**
 * 修改密码
 */
export const changePassword = (data) => {
  return request({
    url: '/auth/change-password',
    method: 'post',
    data
  })
}
