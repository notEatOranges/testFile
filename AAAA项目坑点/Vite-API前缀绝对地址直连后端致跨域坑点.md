# Vite API 前缀用绝对地址直连后端致跨域 坑点

## 现象
前端部署后，所有接口请求失败，浏览器控制台报跨域（CORS），或 fetch 抛 `TypeError: Failed to fetch`（无响应、F12 Network 里请求标红 "(blocked: CORS)" 或直接 failed）。但页面本身能打开。

## 根因（通用规则）
Vite 项目常把 `VITE_APP_API` 作为接口 URL 前缀，在某处（如 `apis[api] = \`${import.meta.env.VITE_APP_API}${apis[api]}\``）拼到每个接口路径前。当前缀写成**绝对地址**（含协议+host+端口，且端口与页面不同）时：

- 页面 origin = `http://host:32186`（Nginx 静态托管端口）
- 接口请求 = `http://host:31004/...`（后端真实端口，绝对地址）
- 端口不同 → 浏览器判定跨域 → 后端若未对该 Origin 配置 CORS 响应头 → 预检/请求被拦截。

**关键直觉**：前端永远不应直连后端真实端口。正确做法是让接口走 **Nginx 同源反向代理**（相对路径前缀），浏览器全程只看到一个 origin，根本不触发 CORS。

## 修复（通用）
把 API 前缀从绝对地址改为**相对路径**，交给 Nginx 同源代理转发：
```diff
- VITE_APP_API = http://host:31004/qsn-api/qsn-service   # 绝对地址 → 跨域
+ VITE_APP_API = /qsn-api/qsn-service                    # 相对路径 → 走 Nginx 代理，同源
```
配套 Nginx：
```nginx
location /qsn-api/ {
    proxy_pass http://后端真实地址:31004;   # 不带尾斜杠，保留 /qsn-api 前缀原样转发
}
```

## 验证（浏览器 DevTools console）
```js
// 直连后端（应失败）
await fetch('http://host:31004/qsn-api/qsn-service/api/xxx', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'})
  .catch(e => 'CORS拦截: ' + e)   // "TypeError: Failed to fetch" = 跨域被拦

// 走 Nginx 同源代理（应返回业务 JSON，状态码可能是 401/400 但能连通）
await fetch('/qsn-api/qsn-service/api/xxx', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'})
  .then(r => r.status)   // 200/401/400 都说明通了，没跨域
```

## 排查清单（接口跨域 / Failed to fetch）
- [ ] `VITE_APP_API`（或 axios baseURL）是不是写了绝对地址、且端口/host 与页面不同？
- [ ] 该前缀是否被拼到所有接口前（搜 `import.meta.env.VITE_APP_API` 的使用点）？
- [ ] Nginx 是否配了对应的同源反向代理 `location`？
- [ ] 后端是否真的需要直连？生产环境一律走 Nginx 代理，不要在浏览器侧直连后端端口。
- [ ] `TypeError: Failed to fetch` 不一定是网络错误，先怀疑 CORS（F12 Network 看请求是否被浏览器拦截、有无响应头）。

## 本项目实例
- 项目：青少年智能培训管理系统（Vue3 + Vite，仓库 Qsntypx-q）
- 问题点：
  - `src/apis.js` 末尾 `apis[api] = \`${import.meta.env.VITE_APP_API}${apis[api]}\`` 把前缀拼到所有接口前。
  - `.env.prod`：`VITE_APP_API = http://172.19.80.20:31004/qsn-api/qsn-service`（绝对地址，端口 31004）。
  - 页面部署在 `http://172.19.80.20:32186`（Nginx 端口），31004 ≠ 32186 → 跨域。
  - `frontend.conf` 已有 `location /qsn-api/ { proxy_pass http://172.19.80.20:31004; }`，但被绝对地址绕过了。
- 修复：`.env.prod` 改 `VITE_APP_API = /qsn-api/qsn-service`（同 `.env.cicd`），走 Nginx 同源代理。
- 验证：直连 31004 → `TypeError: Failed to fetch`（跨域拦截）；走 `/qsn-api/` → 401 正常 JSON（连通）。

## 相关坑点
- [[Vite-base子路径部署Nginx目录不匹配致永久loading坑点]] —— 同项目部署期问题，先修它才能加载页面，再修本坑点才能登录
- [[Nginx-proxy_pass末尾斜杠路径重写坑点]] —— Nginx 代理前缀保留/重写规则
