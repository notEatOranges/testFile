const KEY = 'love-theme'
export const THEMES = [
  { key: 'sakura', name: '樱花粉' },
  { key: 'mint', name: '薄荷绿' },
  { key: 'lavender', name: '薰衣草' },
  { key: 'peach', name: '蜜桃橙' },
  { key: 'babyblue', name: '奶蓝' },
  { key: 'lemon', name: '奶酪黄' },
  { key: 'berry', name: '莓莓红' },
  { key: 'cocoa', name: '可可棕' }
]

export function applyTheme(key) {
  document.documentElement.dataset.theme = key
  localStorage.setItem(KEY, key)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.content = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#ff7aa2'
  }
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: key }))
}

export function initTheme() {
  applyTheme(localStorage.getItem(KEY) || 'sakura')
}
