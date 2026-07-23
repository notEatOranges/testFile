// 省体育局群体端路由
const provinceRoutes = [
  {
    path: '/province',
    redirect: '/province/template'
  },
  {
    path: '/province/template',
    name: 'ProvinceTemplate',
    component: () => import('@/views/province/template/TemplateList.vue'),
    meta: {
      title: '模板管理',
      roles: ['province']
    }
  },
  {
    path: '/province/template/design',
    name: 'TemplateDesign',
    component: () => import('@/views/province/template/TemplateDesign.vue'),
    meta: {
      title: '模板设计',
      roles: ['province']
    }
  },
  {
    path: '/province/declaration',
    name: 'DeclarationConfig',
    component: () => import('@/views/province/declaration/ParameterConfig.vue'),
    meta: {
      title: '申报设置',
      roles: ['province']
    }
  },
  {
    path: '/province/preliminary',
    name: 'PreliminaryReview',
    component: () => import('@/views/province/preliminary/PreliminaryCard.vue'),
    meta: {
      title: '资格初审',
      roles: ['province']
    }
  },
  {
    path: '/province/preliminary/list',
    name: 'PreliminaryList',
    component: () => import('@/views/province/preliminary/PreliminaryList.vue'),
    meta: {
      title: '资格初审列表',
      roles: ['province']
    }
  },
  {
    path: '/province/review',
    name: 'WrittenReview',
    component: () => import('@/views/province/review/ReviewCard.vue'),
    meta: {
      title: '书面评审',
      roles: ['province']
    }
  },
  {
    path: '/province/review/list',
    name: 'WrittenReviewList',
    component: () => import('@/views/province/review/ReviewList.vue'),
    meta: {
      title: '书面评审列表',
      roles: ['province']
    }
  },
  {
    path: '/province/inspection',
    name: 'Inspection',
    component: () => import('@/views/province/inspection/InspectionCard.vue'),
    meta: {
      title: '实地考察',
      roles: ['province']
    }
  },
  {
    path: '/province/inspection/list',
    name: 'InspectionList',
    component: () => import('@/views/province/inspection/InspectionList.vue'),
    meta: {
      title: '实地考察列表',
      roles: ['province']
    }
  },
  {
    path: '/province/summary',
    name: 'ScoreSummary',
    component: () => import('@/views/province/summary/SummaryList.vue'),
    meta: {
      title: '评分汇总',
      roles: ['province']
    }
  },
  {
    path: '/province/form/dynamic',
    name: 'DynamicForm',
    component: () => import('@/views/province/form/DynamicForm.vue'),
    meta: {
      title: '动态表单',
      roles: ['province']
    }
  },
  {
    path: '/province/form/designer',
    name: 'FormDesigner',
    component: () => import('@/views/province/form/FormDesigner.vue'),
    meta: {
      title: '表单设计器',
      roles: ['province']
    }
  }
]

export default provinceRoutes
