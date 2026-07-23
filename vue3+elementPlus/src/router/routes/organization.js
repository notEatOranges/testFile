// 机构端路由
const organizationRoutes = [
  {
    path: '/organization',
    redirect: '/organization/home'
  },
  {
    path: '/organization/home',
    name: 'OrganizationHome',
    component: () => import('@/views/organization/home/HomeView.vue'),
    meta: {
      title: '机构首页',
      roles: ['organization']
    }
  },
  {
    path: '/organization/guide',
    name: 'ApplicationGuide',
    component: () => import('@/views/organization/application/GuideView.vue'),
    meta: {
      title: '申请指南',
      roles: ['organization']
    }
  },
  {
    path: '/organization/application',
    name: 'ApplicationForm',
    component: () => import('@/views/organization/application/ApplicationForm.vue'),
    meta: {
      title: '补助申请',
      roles: ['organization']
    }
  },
  {
    path: '/organization/application/detail',
    name: 'ApplicationDetail',
    component: () => import('@/views/organization/application/ApplicationDetail.vue'),
    meta: {
      title: '申请详情',
      roles: ['organization']
    }
  }
]

export default organizationRoutes
