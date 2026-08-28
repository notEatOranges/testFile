# Docker Nginx 容器非 root 降权坑点

## 场景

安全扫描报 **`Dockerfile Misconfiguration: Default User Privilege`**（高危，常定位到首个 `FROM` 行），根因是运行时容器以 root 运行。前端项目用 Nginx 托管静态资源时，要让容器非 root 运行，会同时踩到「特权端口绑定」「user 指令」「pid 路径」「运行时目录权限」四个坑，**缺一不可**，且彼此耦合。

## 通用规则

### Nginx 非 root 运行的 4 个必备改造点

| # | 坑点 | 根因 | 修复 |
|---|------|------|------|
| 1 | **监听端口 < 1024** | 80 是特权端口，非 root 进程 `bind()` 会失败（`permission denied`） | `listen 80` → `listen 8080`（任意 ≥1024） |
| 2 | **nginx.conf 有 `user` 指令** | 非 root 启动时 `user` 指令被忽略（告警），且写 `user root;` 等于让处理外部请求的 worker 以 root 身份运行——这本身就是最差实践 | **删除 `user` 指令**；worker 默认继承启动用户（即 `USER` 指定的非 root 用户） |
| 3 | **pid 在 `/var/run`** | `/var/run`（→ `/run`）属 root，非 root 写不了 pid 文件 | `pid /var/run/nginx.pid;` → `pid /tmp/nginx.pid;` |
| 4 | **运行时目录属 root** | `/var/cache/nginx`、`/var/log/nginx`、静态资源目录、`/etc/nginx/conf.d` 非 root 不可写 | `RUN chown -R <user>:<user> ...` 后再 `USER <user>` |

### Dockerfile 双阶段降权要点

**运行时阶段**（Nginx 镜像）：
- 用 **镜像自带的 `nginx` 用户**（官方 nginx 镜像无论 Alpine 还是 Debian 变体都自带，UID 通常 101），`chown nginx:nginx` + `USER nginx`。
- **不要**自己 `adduser`/`useradd`：不同基础镜像底层发行版不同（Alpine 用 BusyBox `adduser`，Debian/openEuler 用 `useradd`），自己建用户会引入跨发行版兼容坑。
- `chown` 必须在 `USER` 切换**之前**（chown 需 root 权限）。

**构建阶段**（Node 镜像，Alpine）：
- 全局安装工具（`npm install -g pnpm`）必须在 `USER` 切换**之前**（写全局目录需 root）。
- `adduser` 要带 home 目录（`-h /home/xxx` 并 `mkdir -p`），否则 pnpm/npm 的 store 与缓存因无 HOME 报错。
- `COPY` 用 `--chown=xxx:xxx`，并在 `USER` 前先 `chown -R` 工作目录，否则非 root 用户在 root 所有的目录里写不了 `node_modules`。
- 顺序：root 装全局工具 → 建用户 → `WORKDIR` → `COPY --chown package.json` → `chown -R /app` → `USER xxx` → `pnpm install` → `COPY --chown . .` → `build`。

### 副作用：端口变化牵连部署侧

容器内端口从 80 改 8080 后，**部署侧必须同步**：
- K8s：`Deployment.containerPort` 与 `Service.targetPort` 改为 8080。
- Docker：`docker run -p` 映射改 `8080:8080`（或对外仍 80：`-p 80:8080`）。
- **对外访问端口由 Service `port` / `-p 左侧` 决定，仍可保持 80 对外**，只是容器内监听换成 8080。

## 本项目实例

项目：Tyzxyy-q（RuoYi-Vue3 前端），文件：`Dockerfile` / `nginx.conf` / `frontend.conf`。

- 扫描告警：`Default User Privilege`（高危，定位 Dockerfile 第 4 行 `FROM node:20-alpine as builder`）。
- 额外发现：原 `nginx.conf` 写死 `user root;`，worker 以 root 处理外部请求——比扫描告警更严重的实际风险。
- 修复：
  - `frontend.conf`：`listen 80` → `listen 8080`。
  - `nginx.conf`：删除 `user root;`；`pid /var/run/nginx.pid` → `pid /tmp/nginx.pid`。
  - `Dockerfile` builder（`node:20-alpine`，Alpine BusyBox）：`adduser` 加 `-D -h /home/appuser` + `mkdir home`；`COPY --chown=appuser`；先 `chown -R /app` 再 `USER appuser`；全局 pnpm 仍在 root 阶段装。
  - `Dockerfile` 运行时（`ctyunos-nginx:v1.29.3`）：用镜像自带 `nginx` 用户，`chown -R nginx:nginx` 四个目录 → `USER nginx` → `EXPOSE 8080`。
- 待办：部署侧 `containerPort`/`targetPort` 同步 8080。

---

项目：Qsnss-q（青少年赛事管理前端，Vue3+Vite），文件：`Dockerfile` / `nginx.conf` / `frontend.conf`。2026-08 踩过。

- **症状与 Tyzxyy-q 不同，更隐蔽**：不是安全扫描告警，而是**「镜像构建推送成功、K8s 部署成功，但浏览器访问 `http://ip:port/` 一直连不上 / 超时 / 拒绝连接」**。没有明显报错，极易被误诊为「网络策略 / Service / Ingress / 端口映射」问题去查，实际是容器内 nginx 根本没起来。
- **根因链**：Dockerfile 写了 `USER appuser` + `EXPOSE 8080`（降权意图），但 `frontend.conf` 仍是 `listen 80;`（特权端口）。appuser 启动 nginx → `bind(80)` permission denied → master 退出 → 容器内无进程监听任何端口 → Pod 反复重启或 Service 无后端 → 外部访问不到。
- **额外坑：Dockerfile 漏 COPY `nginx.conf`**。Qsnss-q 根目录有一份 `nginx.conf`（带 `user root;` + `pid /var/run/nginx.pid;`），但原 Dockerfile 只 `COPY frontend.conf`，没 COPY `nginx.conf`，主配置用的是镜像自带那份。修复时**必须同时 COPY 两个文件**：把改好的 `nginx.conf`（去 `user`、`pid /tmp/nginx.pid`）一并覆盖进 `/etc/nginx/nginx.conf`，否则单改 frontend.conf 的端口，主配置里的 pid/临时目录权限仍可能让非 root 启动失败。
- **修复（与 Tyzxyy-q 一致的 4 点 + 补 COPY）**：
  - `frontend.conf`：`listen 80` → `listen 8080`。
  - `nginx.conf`：删除 `user root;`；`pid /var/run/nginx.pid` → `pid /tmp/nginx.pid`。
  - `Dockerfile`：补 `COPY nginx.conf /etc/nginx/nginx.conf`（与 `COPY frontend.conf` 并列）。
  - 用户方案：Qsnss-q 用 `adduser appuser` + `chown -R appuser:appuser` + `USER appuser`（自建用户，可行）；与 Tyzxyy-q 后期「数字 UID 最稳」不同，按镜像实际情况二选一即可。
- **部署侧**：容器内 8080，对外端口由 K8s Service `port` / `nodePort`（如 32185）决定，对外可不变。
- **排查口诀**：部署后访问不到页面，先 `kubectl logs <pod>` 看 nginx 有无 `bind() to 0.0.0.0:80 failed (13: Permission denied)`；有即本坑，别去查网络。

## 风险点 / 验证

- 运行时用镜像自带 `nginx` 用户的前提是基础镜像确实带该用户（官方 nginx 必带，私有魔改镜像需确认）。若 `chown nginx:nginx` 报 `unknown user`，说明镜像没该用户，需改用镜像内存在的用户名或自建。
- **更稳的做法：直接用数字 UID**（`chown -R 1001:1001 ...` + `USER 1001:1001`），不依赖镜像自带用户名、也不依赖 `useradd`/`adduser`（跨发行版最稳）。本项目 Tyzxyy-q 的 `ctyunos-nginx:v1.29.3` 实测无 nginx 用户（`chown nginx:nginx` 报 invalid user），最终改用数字 UID 1001 解决。
- 非 root 下 nginx 启动会自动在 `/var/cache/nginx` 下创建 `client_temp` 等临时子目录，只要该父目录已 chown 即可。
- 验证：构建后 `docker inspect` 看 `User` 字段非 root；`docker run` 后容器内 `ps` 看 nginx master/worker 非 root；`curl` 验证 8080 可访问。

## 衍生坑点：builder 阶段 USER 切换后 npm registry 配置丢失（高发！）

给 builder 阶段加 `USER appuser` 降权后，Docker 构建报 `pnpm install` 访问 `registry.npmjs.org` 全部 `ERR_SOCKET_TIMEOUT`（内网环境访问不了公网）。构建直接失败。

**根因**：`npm config set registry` / `pnpm config set registry` 写的是**当前用户**的 `~/.npmrc`（root 时是 `/root/.npmrc`）。`USER appuser` 切换后，pnpm 读 `/home/appuser/.npmrc`（没有 registry 配置）→ fallback 到默认 `registry.npmjs.org` → 超时。这是 builder 非 root 化最容易踩的雷，且报错信息（访问 npmjs.org 超时）很有迷惑性，不易联想到 USER 切换。

**修复**：用 ENV 环境变量配置 registry，它对所有 USER 生效：
```dockerfile
ENV npm_config_registry=https://你的私有源/
RUN npm install -g pnpm     # root 阶段，读 ENV
...
USER appuser
RUN pnpm install            # appuser 阶段，仍读 ENV 的 registry
```

**要点**：凡有 `USER` 切换的 Dockerfile，registry / 镜像源等 npm 配置**一律用 ENV**（`npm_config_*`），不要用 `npm config set`（只对当前用户生效）。注意环境变量名是小写下划线的 `npm_config_registry`（npm/pnpm 都认）。本项目 Tyzxyy-q 2026-07 踩过。
