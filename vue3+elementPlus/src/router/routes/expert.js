// 专家端路由
const expertRoutes = [
  {
    path: '/expert',
    redirect: '/expert/written-review'
  },
  {
    path: '/expert/written-review',
    name: 'ExpertWrittenReview',
    component: () => import('@/views/expert/written-review/ReviewCard.vue'),
    meta: {
      title: '书面评审',
      roles: ['expert']
    }
  },
  {
    path: '/expert/written-review/list',
    name: 'ExpertReviewList',
    component: () => import('@/views/expert/written-review/ReviewList.vue'),
    meta: {
      title: '评审列表',
      roles: ['expert']
    }
  },
  {
    path: '/expert/written-review/form',
    name: 'ExpertReviewForm',
    component: () => import('@/views/expert/written-review/ReviewForm.vue'),
    meta: {
      title: '评审打分',
      roles: ['expert']
    }
  },
  {
    path: '/expert/on-site-review',
    name: 'ExpertOnSiteReview',
    component: () => import('@/views/expert/on-site-review/CityList.vue'),
    meta: {
      title: '实地考察',
      roles: ['expert']
    }
  },
  {
    path: '/expert/on-site-review/orgs',
    name: 'ExpertOrgList',
    component: () => import('@/views/expert/on-site-review/OrgList.vue'),
    meta: {
      title: '考察机构',
      roles: ['expert']
    }
  },
  {
    path: '/expert/on-site-review/form',
    name: 'ExpertOnSiteForm',
    component: () => import('@/views/expert/on-site-review/ReviewForm.vue'),
    meta: {
      title: '考察评分',
      roles: ['expert']
    }
  }
]

export default expertRoutes
