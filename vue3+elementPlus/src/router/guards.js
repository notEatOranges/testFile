import { useAuthStore } from '@/stores/auth'
import { getToken } from '@/utils/auth'
import { getDefaultPath } from '@/utils/permission'
import { ElMessage } from 'element-plus'

// 白名单路由（不需要登录就可以访问）
const whiteList = ['/login', '/404', '/403']

/**
 * 路由前置守卫
 */
export const setupRouterGuard = (router) => {
  router.beforeEach(async (to, from, next) => {
    const hasToken = getToken()

    if (hasToken) {
      // 已登录
      if (to.path === '/login') {
        // 如果已登录，访问登录页则重定向到首页
        const authStore = useAuthStore()
        const defaultPath = getDefaultPath(authStore.roles)
        next(defaultPath)
      } else {
        // 检查是否有用户信息
        const authStore = useAuthStore()
        if (authStore.user) {
          // 检查路由权限
          if (hasPermission(to, authStore.roles)) {
            next()
          } else {
            ElMessage.error('没有访问权限')
            next({ path: '/403' })
          }
        } else {
          try {
            // 获取用户信息
            await authStore.getUserInfoData()
            if (hasPermission(to, authStore.roles)) {
              next()
            } else {
              ElMessage.error('没有访问权限')
              next({ path: '/403' })
            }
          } catch (error) {
            // 获取用户信息失败，清除 token 并跳转登录页
            await authStore.logout()
            ElMessage.error('登录状态已过期，请重新登录')
            next({ path: '/login', query: { redirect: to.fullPath } })
          }
        }
      }
    } else {
      // 未登录
      if (whiteList.includes(to.path)) {
        next()
      } else {
        next({ path: '/login', query: { redirect: to.fullPath } })
      }
    }
  })

  router.afterEach((to) => {
    // 设置页面标题
    document.title = to.meta.title
      ? `${to.meta.title} - 运动促进健康申报管理系统`
      : '运动促进健康申报管理系统'
  })
}

/**
 * 检查路由权限
 */
function hasPermission(route, userRoles) {
  if (!route.meta || !route.meta.roles) {
    return true
  }
  return route.meta.roles.some(role => userRoles.includes(role))
}
