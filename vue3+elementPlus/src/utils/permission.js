/**
 * 检查路由权限
 */
export function hasPermission(route, userRoles) {
  // 如果路由没有设置 meta.roles，则表示所有人都可以访问
  if (!route.meta || !route.meta.roles) {
    return true
  }

  // 检查用户是否有路由所需的任一角色
  return route.meta.roles.some(role => userRoles.includes(role))
}

/**
 * 过滤有权限的路由
 */
export function filterRoutes(routes, userRoles) {
  const filteredRoutes = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(tmp, userRoles)) {
      if (tmp.children) {
        tmp.children = filterRoutes(tmp.children, userRoles)
      }
      filteredRoutes.push(tmp)
    }
  })

  return filteredRoutes
}

/**
 * 获取默认重定向路径
 */
export function getDefaultPath(userRoles) {
  if (userRoles.includes('province')) {
    return '/province/template'
  }
  if (userRoles.includes('organization')) {
    return '/organization/home'
  }
  if (userRoles.includes('city')) {
    return '/city/pending'
  }
  if (userRoles.includes('expert')) {
    return '/expert/written-review'
  }
  return '/login'
}
