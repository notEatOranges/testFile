let token = localStorage.getItem('love-token') || ''

export function getToken() { return token }
export function setToken(t) {
  token = t || ''
  if (t) localStorage.setItem('love-token', t)
  else localStorage.removeItem('love-token')
}

export async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  let data = null
  try { data = await res.json() } catch { /* 非 JSON 响应 */ }
  if (!res.ok || (data && data.ok === false)) {
    throw new Error((data && data.message) || `请求失败 (${res.status})`)
  }
  return data
}

export const get = (url) => api('GET', url)
export const post = (url, body) => api('POST', url, body)
export const put = (url, body) => api('PUT', url, body)
