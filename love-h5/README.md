# love-h5 v2 · 我们的小窝（H5 + Java 后端）

情侣互动网站：微信小程序版（`../AAAAAA`）的 H5 重构迁移版，v1 纯静态老版本见 [README-legacy-v1.md](./README-legacy-v1.md)（其页面与 js 保留作参考）。

- 设计方案：[docs/01-功能清单与迁移设计方案.md](./docs/01-功能清单与迁移设计方案.md)
- UI 规范：[docs/02-UI设计规范.md](./docs/02-UI设计规范.md)｜高保真设计稿：[design/index.html](./design/index.html)
- 数据迁移（云开发 → 本站）：[migrate/README.md](./migrate/README.md)

## 目录

| 目录 | 说明 |
|---|---|
| `server/` | Spring Boot 3 后端：注册登录(账号密码+角色) / 情侣空间绑定 / kv 实时层(1:1 复刻原 kvWrite 语义) / WebSocket(变更推送+在线状态) / 文件上传 / 真心话题库 / 云开发数据导入 |
| `web/` | Vue 3 + Vite + Vant 4 前端；8 套马卡龙主题、App 化安全区适配；构建产物直接输出到 server 静态目录 |
| `migrate/` | 微信云开发数据迁移脚本与说明 |
| `docs/` `design/` | 设计文档与设计稿 |
| `tools/` | 本机便携 Maven（不入库） |

## 运行（一个 jar 就是整个网站）

```bash
# 1. 构建前端（产物自动进入 server/src/main/resources/static）
cd web && npm install && npm run build

# 2. 打包后端
cd ../server
set JAVA_HOME=C:\Program Files\Huawei\DevEco Studio\jbr
..\tools\apache-maven-3.9.9\bin\mvn package -DskipTests

# 3. 运行 → 浏览器打开 http://localhost:8090
java -jar target\love-nest.jar
```

> 开发模式：`cd web && npm run dev`（Vite 5173，已代理 /api /ws 到 8080）

## 自测实时同步（两人双开）

1. 普通窗口注册一个**男生**账号 → 创建空间 → 复制邀请链接
2. 无痕窗口打开邀请链接 → 注册**女生**账号 → 自动加入
3. 两边同时进小窝：右上角在线状态即连即亮；「我的」页改网名/戳一戳后缀，对方页面实时变化

## 数据与部署

- SQLite 单文件 `server/data/love.db`（备份=复制整个 `data/` 目录）
- 上传文件在 `server/data/files/`
- 家庭电脑部署：`java -jar love-nest.jar` + 开机自启；外网访问建议 Cloudflare Tunnel/frp（HTTPS 后解锁语音/系统通知/PWA）

## 里程碑进度

- ✅ **M1 基建**：注册登录 / 空间绑定 / kv+WebSocket 实时层 / 在线状态 / 主题系统 / 小窝·我的页面 / 迁移工具
- ⬜ M2 核心功能：聊天、心情记录、纪念日管理、心愿清单、真心话、站内通知
- ⬜ M3 游戏一期：成绩榜、2048、俄罗斯方块、五子棋、黑白棋、记忆翻牌、翻翻棋
- ⬜ M4 游戏二期：象棋、军棋、你画我猜、大富翁
- ⬜ M5 打磨部署：暗色模式、语音消息、浏览器通知、PWA、内网穿透
