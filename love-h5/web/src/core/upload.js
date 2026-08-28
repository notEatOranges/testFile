// 文件上传（图片/语音/文件统一入口）
import { getToken } from './request'

export async function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data || data.ok === false) throw new Error((data && data.message) || '上传失败')
  return data.url
}
