import { showToast } from 'vant'

export async function copyText(t) {
  try {
    await navigator.clipboard.writeText(t)
    showToast('已复制')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = t
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      showToast('已复制')
    } catch {
      showToast('复制失败，请手动复制')
    }
    ta.remove()
  }
}

export function inviteLink(code) {
  return `${location.origin}${location.pathname}#/join?code=${code}`
}
