// 聊天未读徽标：全局订阅 chat 列表 → 未读 = 比上次可见时间新的对方消息
import { defineStore } from 'pinia'

export const useChatBadge = defineStore('chatBadge', {
  state: () => ({ unread: 0 }),
  actions: {
    sync(list, myRole) {
      const seen = Number(localStorage.getItem('love-chat-seen') || 0)
      this.unread = list.filter(
        (m) => (m.ts || 0) > seen && m.sender !== myRole && m.type !== 'poke' && !m.recalled
      ).length
      this._latest = list.reduce((m, x) => Math.max(m, x.ts || 0), 0)
    },
    markSeen() {
      if (this._latest) localStorage.setItem('love-chat-seen', String(this._latest))
      this.unread = 0
    }
  }
})
