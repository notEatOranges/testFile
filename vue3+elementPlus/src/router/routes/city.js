// 市体育部门端路由
const cityRoutes = [
  {
    path: '/city',
    redirect: '/city/pending'
  },
  {
    path: '/city/pending',
    name: 'CityPending',
    component: () => import('@/views/city/pending/PendingReview.vue'),
    meta: {
      title: '待审核',
      roles: ['city']
    }
  },
  {
    path: '/city/submit',
    name: 'CitySubmit',
    component: () => import('@/views/city/submit/SubmitCard.vue'),
    meta: {
      title: '待报送',
      roles: ['city']
    }
  },
  {
    path: '/city/submit/list',
    name: 'CitySubmitList',
    component: () => import('@/views/city/submit/SubmitList.vue'),
    meta: {
      title: '报送列表',
      roles: ['city']
    }
  },
  {
    path: '/city/submitted',
    name: 'CitySubmitted',
    component: () => import('@/views/city/submitted/SubmittedList.vue'),
    meta: {
      title: '已报送',
      roles: ['city']
    }
  },
  {
    path: '/city/rejected',
    name: 'CityRejected',
    component: () => import('@/views/city/rejected/RejectedList.vue'),
    meta: {
      title: '已驳回',
      roles: ['city']
    }
  },
  {
    path: '/city/failed',
    name: 'CityFailed',
    component: () => import('@/views/city/failed/FailedList.vue'),
    meta: {
      title: '不通过',
      roles: ['city']
    }
  }
]

export default cityRoutes
