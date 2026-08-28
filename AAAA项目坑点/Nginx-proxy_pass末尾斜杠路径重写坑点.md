# Nginx proxy_pass 末尾斜杠路径重写坑点

## 现象
Nginx 反向代理后，后端收到的路径少了一截（或多了一截）前缀，接口 404。
例：前端请求 `/api/captchaImage`，期望到 `http://host/api/captchaImage`，实际被转发成 `http://host/captchaImage`（丢了 `/api`）。

## 根本规则
`proxy_pass` 是否**带 URI**（哪怕只是一个 `/`）决定路径处理方式：

- **不带 URI**（`http://host` 或 `http://host:port`，末尾无 `/`、无路径）：
  → **保留完整原始请求 URI**。
  → `/api/x` → `http://host/api/x`

- **带 URI**（`http://host/`、`http://host/prefix/`）：
  → 用该 URI **替换** `location` 匹配到的前缀部分。
  → `location /api/` + `proxy_pass http://host/;`：`/api/x` 的 `/api/` 换成 `/` → `http://host/x`（丢前缀）
  → `location /api/` + `proxy_pass http://host/api/;`：`/api/` 换成 `/api/` → `http://host/api/x`（保留）

## 口诀
- 想**保留** location 前缀（原样转发）：`proxy_pass` **不加末尾 `/`**（不带 URI）。
- 想**去掉** location 前缀（重写）：`proxy_pass` **加末尾 `/`**（带 URI `/`）。
- 写带 URI 的 `proxy_pass` 时，务必推算替换后的路径是否等于后端真实路径。

## 排查
请求后看后端日志收到的 path；对照 `location` + `proxy_pass` 按"替换前缀"规则手算一遍。

## 本项目实例
- 项目：**Tyzxyy-q**
- 文件：`frontend.conf`
- 问题：`location /api/` + `proxy_pass http://172.19.80.20:30049/;`（末尾带 `/`）→ `/api/captchaImage` 被重写成 `/captchaImage`，丢了 `/api`，后端 404。
- 期望：`http://172.19.80.20:30049/api/captchaImage`（保留 `/api`）。
- 修复：`proxy_pass` 去掉末尾 `/` → `http://172.19.80.20:30049;`（不带 URI，保留完整原始路径）。
- 配套：`.env.production` 的 `VITE_APP_BASE_API=/api`（前端发出的就是 `/api/xxx`），与 `location /api/` 对齐。

### 实例 2
- 项目：**Qsntypx-q**（青少年智能培训管理系统）
- 文件：`frontend.conf`
- 问题：`location /qsn-api/` + `proxy_pass http://192.168.0.33:31302/;`（末尾带 `/`）→ 前端 `/qsn-api/qsn-service/api/authentication` 被重写成 `/qsn-service/api/authentication`（丢了 `/qsn-api`），且后端地址过时。
- 期望：`http://172.19.80.20:31004/qsn-api/qsn-service/api/authentication`（保留 `/qsn-api/qsn-service`）。
- 修复：换后端地址并去掉末尾 `/` → `proxy_pass http://172.19.80.20:31004;`（不带 URI，保留完整原始路径）。与 `vite.config.js` 的 dev proxy `'/qsn-api' → http://172.19.80.20:31004` 对齐（Vite dev proxy 默认不 rewrite，原样转发，行为等价于 nginx 不带 URI）。
- 配套注意：`.env.prod` 的 `VITE_APP_API=http://172.19.80.20:31004/qsn-api/qsn-service` 是**绝对地址**，浏览器会直连后端、绕过 nginx；要让 nginx 代理真正生效，需用相对地址 `/qsn-api/qsn-service`（参考 `.env.cicd`）。
