// 登录态与个人/空间信息（pinia）
import { defineStore } from 'pinia'
import { get, post, put, setToken, getToken } from './request'
import * as ws from './ws'
import * as store from './store'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,     // { id, username, role, nick, avatar, coupleId }
    couple: null,   // { id, inviteCode, members:[{id,username,role,nick,avatar,online}] } | null
    loaded: false,
    peerOnline: false
  }),
  getters: {
    isLogin: (s) => !!getToken(),
    isPaired: (s) => !!(s.user && s.user.coupleId),
    peer: (s) => {
      if (!s.couple || !s.user) return null
      return (s.couple.members || []).find((m) => m.role !== s.user.role) || null
    },
    peerRole: (s) => (s.user ? (s.user.role === 'boy' ? 'girl' : 'boy') : null),
    displayName: (s) => (s.user && s.user.nick) ? s.user.nick : '我',
    peerName: (s) => {
      const p = (s.couple && s.couple.members || []).find((m) => m.role !== (s.user && s.user.role))
      return (p && p.nick) ? p.nick : 'ta'
    }
  },
  actions: {
    async load() {
      if (!getToken()) { this.loaded = true; return }
      try {
        const res = await get('/api/me')
        this.user = res.user
        this.couple = res.couple
        if (res.user && res.user.coupleId) store.setRoom(res.user.coupleId)
      } catch (e) {
        if (e.message && e.message.includes('登录')) this.logoutLocal()
      }
      this.loaded = true
    },
    async register(body) {
      const res = await post('/api/auth/register', body)
      setToken(res.token)
      this.user = res.user
      return res
    },
    async login(body) {
      const res = await post('/api/auth/login', body)
      setToken(res.token)
      this.user = res.user
      ws.connect()
      await this.load()
      return res
    },
    async saveProfile(body) {
      const res = await put('/api/me/profile', body)
      this.user = res.user
      this.couple = res.couple
      return res
    },
    async createCouple() {
      const res = await post('/api/couple/create', {})
      await this.load()
      return res
    },
    async joinCouple(inviteCode) {
      const res = await post('/api/couple/join', { inviteCode })
      await this.load()
      return res
    },
    async leaveCouple() {
      await post('/api/couple/leave', {})
      this.couple = null
      this.user = this.user ? { ...this.user, coupleId: '' } : null
      store.setRoom(null)
      return true
    },
    async refresh() { await this.load() },
    logoutLocal() {
      setToken('')
      ws.disconnect()
      store.setRoom(null)
      this.user = null
      this.couple = null
      this.peerOnline = false
    },
    logout() {
      this.logoutLocal()
    }
  }
})
