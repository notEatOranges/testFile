import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from './core/auth'
import { getToken } from './core/request'
import { showToast } from 'vant'

import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Space from './views/Space.vue'
import Join from './views/Join.vue'
import Home from './views/Home.vue'
import Me from './views/Me.vue'
import Chat from './views/Chat.vue'
import Days from './views/Days.vue'
import Wishlist from './views/Wishlist.vue'
import Truthbox from './views/Truthbox.vue'
import MoodHistory from './views/MoodHistory.vue'
import Stub from './views/Stub.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', component: Login, meta: { public: true } },
    { path: '/register', component: Register, meta: { public: true } },
    { path: '/join', component: Join, meta: { public: true } },
    { path: '/space', component: Space },
    { path: '/home', component: Home, meta: { tab: 0 } },
    { path: '/chat', component: Chat, meta: { tab: 1 } },
    { path: '/games', component: Stub, meta: { tab: 2, title: '游戏大厅' } },
    { path: '/me', component: Me, meta: { tab: 3 } },
    { path: '/days', component: Days, meta: { title: '纪念日' } },
    { path: '/wishlist', component: Wishlist, meta: { title: '心愿清单' } },
    { path: '/truthbox', component: Truthbox, meta: { title: '真心话' } },
    { path: '/mood-history', component: MoodHistory, meta: { title: '历史心情' } },
    { path: '/leaderboard', component: Stub, meta: { title: '成绩榜' } },
    { path: '/:pathMatch(.*)*', redirect: '/home' }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  if (!auth.loaded) await auth.load()
  const paired = auth.isPaired

  // 邀请链接 /#/join?code=XXX：登录后转 space 自动填码
  if (to.path === '/join') return true

  if (to.meta.public) {
    // 已配对用户访问登录/注册页 → 回家
    if (paired && (to.path === '/login' || to.path === '/register')) return '/home'
    return true
  }
  if (!getToken()) return '/login'
  if (!paired && to.path !== '/space') return '/space'
  if (paired && to.path === '/space') return '/home'
  return true
})

router.afterEach((to) => {
  if (to.meta.title) document.title = `${to.meta.title} · 小窝`
  else document.title = '小窝'
  if (import.meta.env.DEV && ['/games', '/leaderboard'].includes(to.path)) {
    showToast(`${to.meta.title} 将在 M3 交付`)
  }
})

export default router
