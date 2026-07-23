/**
 * 格式化工具函数
 */

/**
 * 格式化日期时间
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''

  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期
 */
export function formatDate(date) {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 */
export function formatTime(date) {
  return formatDateTime(date, 'HH:mm:ss')
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 格式化金额
 */
export function formatMoney(amount, symbol = '¥') {
  if (amount === null || amount === undefined) return ''

  const num = Number(amount)
  if (isNaN(num)) return ''

  return symbol + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return ''

  const n = Number(num)
  if (isNaN(n)) return ''

  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化百分比
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) return ''

  const num = Number(value)
  if (isNaN(num)) return ''

  return (num * 100).toFixed(decimals) + '%'
}

/**
 * 格式化手机号（隐藏中间4位）
 */
export function formatPhone(phone) {
  if (!phone) return ''

  const str = String(phone)
  if (str.length !== 11) return phone

  return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 格式化身份证号（隐藏中间部分）
 */
export function formatIdCard(idCard) {
  if (!idCard) return ''

  const str = String(idCard)
  if (str.length !== 18) return idCard

  return str.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

/**
 * 截断文本
 */
export function truncate(text, length = 50, suffix = '...') {
  if (!text) return ''

  const str = String(text)
  if (str.length <= length) return str

  return str.substring(0, length) + suffix
}

/**
 * 高亮关键词
 */
export function highlightKeyword(text, keyword, className = 'highlight') {
  if (!text || !keyword) return text

  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, `<span class="${className}">$1</span>`)
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename) {
  if (!filename) return ''

  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

/**
 * 判断是否为图片文件
 */
export function isImageFile(filename) {
  const ext = getFileExtension(filename)
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  return imageExts.includes(ext)
}

/**
 * 判断是否为PDF文件
 */
export function isPdfFile(filename) {
  return getFileExtension(filename) === 'pdf'
}

/**
 * 下载文件
 */
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      document.body.removeChild(textarea)
      return false
    }
  }
}
