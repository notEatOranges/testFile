import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuard } from './guards'
import provinceRoutes from './routes/province'
import organizationRoutes from './routes/organization'
import cityRoutes from './routes/city'
import expertRoutes from './routes/expert'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 登录页
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { title: '登录' }
    },
    // 主布局
    {
      path: '/',
      component: () => import('@/views/LayoutView.vue'),
      redirect: '/login',
      children: [
        // 保留原有路由（monitor 和 tender）
        {
          path: 'tender/template',
          name: 'TemplateDesignOld',
          component: () => import('@/views/tender/TemplateDesign.vue'),
          meta: { title: '模板设计', roles: ['province'] }
        },
        {
          path: 'monitor/quality',
          name: 'QualityManage',
          component: () => import('@/views/monitor/QualityManage.vue'),
          meta: { title: '数据质量管理', roles: ['province'] }
        },
        {
          path: 'monitor/rules',
          name: 'QualityRules',
          component: () => import('@/views/monitor/QualityRules.vue'),
          meta: { title: '数据质控规则', roles: ['province'] }
        },
        {
          path: 'monitor/data',
          name: 'DataMonitor',
          component: () => import('@/views/monitor/DataMonitor.vue'),
          meta: { title: '数据监测', roles: ['province'] }
        },
        {
          path: 'monitor/statistics',
          name: 'Statistics',
          component: () => import('@/views/monitor/Statistics.vue'),
          meta: { title: '数据统计', roles: ['province'] }
        },
        // 运动促进健康申报管理系统路由
        ...provinceRoutes,
        ...organizationRoutes,
        ...cityRoutes,
        ...expertRoutes
      ]
    },
    // 403 无权限
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/error/403.vue'),
      meta: { title: '无权限' }
    },
    // 404 页面
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/404.vue'),
      meta: { title: '页面不存在' }
    },
    // 保留原有路由
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue')
    }
  ]
})

// 设置路由守卫
setupRouterGuard(router)

export default router
