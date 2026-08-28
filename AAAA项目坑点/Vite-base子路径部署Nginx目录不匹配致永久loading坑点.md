# Vite base 子路径部署 + Nginx 目录不匹配致永久 loading 坑点

## 现象
前端 SPA 部署后，页面打开一直卡在首屏 loading（如 "加载中" 转圈），永远进不去业务界面。控制台报：

```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.
```

且每个 `.js` 资源请求 HTTP 状态都是 200，但 `Content-Type` 是 `text/html`，响应体是 `index.html` 的内容。

## 根因（通用规则）
**Vite 的 `base` 只改 HTML 里引用资源的 URL 前缀，不改变构建产物的输出目录结构。** 于是当 `base` 是子路径（如 `/qsn-admin/`）时，三者必须严格对齐，否则 JS 资源会被 Nginx 的 SPA fallback 吞成 `index.html`：

1. `base: '/qsn-admin/'` → index.html 用 `/qsn-admin/assets/xxx.js` 引用资源。
2. Vite 输出仍是平铺结构：`dist/index.html` + `dist/assets/*.js`（**不会**生成 `dist/qsn-admin/` 子目录）。
3. 部署时若把 `dist` 平铺 COPY 到 Nginx `root`（如 `/usr/share/nginx/html`），文件实际在 `/usr/share/nginx/html/assets/*.js`。
4. Nginx `root /usr/share/nginx/html` + `try_files $uri $uri/ /index.html`：
   - 浏览器请求 `/qsn-admin/assets/x.js` → Nginx 找 `/usr/share/nginx/html/qsn-admin/assets/x.js` → 不存在 → fallback 到 `/index.html` → 返回 HTML。
5. 浏览器期望 JS module 却收到 HTML → 拒绝执行 → Vue/React 永不挂载 → 卡死在 index.html 里那个静态首屏 loading 占位符。
6. 而 `/qsn-admin/login` 这类路由 URL 本身也 fallback 到 `/index.html`，所以"页面能打开、一直转圈"，极具迷惑性。

**关键直觉**：URL 路径 `/子路径/*` 必须与文件系统 `root/子路径/*` 一一对应。`base` 决定了 URL 前缀，部署目录必须跟着多套一层同名子目录；否则 `try_files` 找不到文件，全部 fallback 成 HTML。

## 修复（任选其一，推荐 A）

### 方案 A（推荐）：产物放进同名子目录 + fallback 指向子目录 index.html
```dockerfile
# Dockerfile：COPY 到带子路径的目录
COPY --from=builder /app/dist /usr/share/nginx/html/qsn-admin
```
```nginx
# nginx：fallback 指向子路径下的 index.html
location / {
  try_files $uri $uri/ /qsn-admin/index.html;
}
```

### 方案 B（只改 Nginx，不动镜像分层）：用 alias 剥离前缀
```nginx
location /qsn-admin/ {
    alias /usr/share/nginx/html/;
    try_files $uri $uri/ /qsn-admin/index.html;
}
```
注意 `alias` + `try_files` 在旧版 Nginx 有已知坑，优先用方案 A。

## 验证
```bash
curl -I https://<host>/子路径/assets/<某hash>.js
# 正确：content-type: application/javascript
# 错误：content-type: text/html（说明还在被 fallback 吞）
```
浏览器 DevTools → Network，看 `.js` 资源的 Content-Type 是否为 `application/javascript`。

## 排查清单（卡 loading / MIME text/html 类问题）
- [ ] Vite `base` 与实际部署子路径是否一致？
- [ ] 部署产物是否放进了 `root + 子路径` 对应的目录（而非平铺到 root）？
- [ ] Nginx `try_files` 的最终 fallback 是否指向**子路径下**的 `index.html`？
- [ ] 是否残留旧框架入口（如 Express 的 `/index.js`）混在 try_files 里干扰？
- [ ] 容器内 `ls /usr/share/nginx/html` 确认目录结构，别只看本地 dist。

## 本项目实例
- 项目：青少年智能培训管理系统（Vue3 + Vite，仓库 Qsntypx-q）
- 路径：`Dockerfile`（`COPY --from=builder /app/dist /usr/share/nginx/html`）、`frontend.conf`（`root /usr/share/nginx/html` + `try_files $uri $uri/ /index.js /index.html`）、`vite.config.js`（`base: env.VITE_APP_PUBLICPATH`，prod=`/qsn-admin/`）
- 线上表现：`http://172.19.80.20:32186/qsn-admin/login` 卡在"加载中"；5 个核心 JS（index/rolldown-runtime/vue/element-plus/session）全部返回 `text/html`。
- 修复：采用方案 A（COPY 到 `/usr/share/nginx/html/qsn-admin` + fallback `/qsn-admin/index.html`）。

## 相关坑点
- [[Nginx-proxy_pass末尾斜杠路径重写坑点]] —— 同属 Nginx 路径/前缀类陷阱
- [[Docker-Nginx容器非root降权坑点]] —— 本项目 Nginx 容器降权注意事项
- [[echarts6-Rolldown代码分割致init_Component未定义白屏坑点]] —— 同项目 Rolldown 构建，另一类白屏
