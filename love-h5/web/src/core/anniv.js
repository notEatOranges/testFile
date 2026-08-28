// 纪念日工具（从原 utils/anniv.js、utils/util.js 移植核心规则：2-29 兜底、月末截断、倒计时文案）
export const ANNIV_TYPES = [
  { key: 'anniversary', name: '纪念日' },
  { key: 'birthday', name: '生日' },
  { key: 'first', name: '第一次' },
  { key: 'festival', name: '节日' },
  { key: 'countdown', name: '倒计时' }
]
export const RECURRENCE = [
  { key: 'once', name: '单次' },
  { key: 'yearly', name: '每年' },
  { key: 'monthly', name: '每月' }
]

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysBetween(startDate) {
  if (!startDate) return 0
  const start = new Date(startDate + 'T00:00:00')
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((today - start) / 86400000))
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate()
}

/** 下一次发生的日期（本地零点），once 已过则返回原日期（负数天数表示已过） */
export function nextOccur(dateStr, recurrence) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (recurrence === 'yearly' || recurrence === 'monthly') {
    let ny = today.getFullYear()
    let nm = recurrence === 'yearly' ? m - 1 : m - 1
    let nd = d
    const step = () => {
      if (recurrence === 'yearly') ny += 1
      else {
        nm += 1
        if (nm > 11) { nm = 0; ny += 1 }
      }
    }
    const clamp = () => {
      if (recurrence === 'yearly' && m - 1 === 1 && d === 29) {
        // 2-29 闰年兜底到 2-28
        const isLeap = (ny % 4 === 0 && ny % 100 !== 0) || ny % 400 === 0
        if (!isLeap) nd = 28
        else nd = 29
      } else {
        nd = Math.min(d, daysInMonth(ny, nm))
      }
    }
    clamp()
    let cand = new Date(ny, nm, nd)
    while (cand < today) { step(); clamp(); cand = new Date(ny, nm, nd) }
    return cand
  }
  return new Date(y, m - 1, d)
}

export function daysUntil(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date - today) / 86400000)
}

export function countdownText(dateStr, recurrence) {
  const n = daysUntil(nextOccur(dateStr, recurrence))
  if (n === 0) return '就是今天'
  if (n > 0) return `还有 ${n} 天`
  return `${-n} 天前`
}

/** 事件列表排序：未过期按剩余天数升序；已过的单次沉底 */
export function sortEvents(events) {
  return [...events].sort((a, b) => {
    const na = daysUntil(nextOccur(a.date, a.recurrence))
    const nb = daysUntil(nextOccur(b.date, b.recurrence))
    const pa = na < 0 && a.recurrence === 'once' ? 1 : 0
    const pb = nb < 0 && b.recurrence === 'once' ? 1 : 0
    if (pa !== pb) return pa - pb
    if (pa && pb) return nb - na
    return na - nb
  })
}
