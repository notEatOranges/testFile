# Fortify 安全漏洞修复坑点

> 记录 Fortify 静态扫描常见前端 / Dockerfile 漏洞的修复要点与牵连，避免重复踩坑。

## 一、Insecure Randomness：Math.random() 即便非安全用途也会报

**现象**：Fortify 把 `Math.random()` 报为 Insecure Randomness，哪怕它只用于请求去重 key、缓存破坏参数、列表 v-for key 等非安全场景。

**规则**：只要代码里出现 `Math.random()`，Fortify 几乎必报，不论用途。

**解决**：用 Web Crypto API 替代。封装一个与 `Math.random()` 同返回格式（[0,1) 浮点）的工具函数，调用处直接替换：

```js
export function cryptoRandom() {
  const array = new Uint32Array(1)
  window.crypto.getRandomValues(array)
  return array[0] / (0xFFFFFFFF + 1)
}
```

**坑**：`crypto.getRandomValues` 只在安全上下文（HTTPS 或 localhost）可用。生产必须 HTTPS 或经反向代理，否则会抛异常。

## 二、Dockerfile Misconfiguration: Default User Privilege

**现象**：Dockerfile 运行阶段（最终镜像）没有 `USER <非root>` 指令，Fortify 报 Default User Privilege。

**nginx 非 root 运行的完整改造点（缺一不可，否则容器启动失败）**：
1. 监听端口 > 1024：nginx 不能以非 root 绑定 80，需改 8080 等非特权端口。
2. `nginx.conf` 删除 `user root;`（非 root 启动时 master 进程继承 USER 身份，留 user 指令会 warning）。
3. `pid` 路径改非 root 可写：`/var/run/nginx.pid` → `/tmp/nginx.pid`。
4. 日志/临时目录授权：`/var/log/nginx`、`/var/cache/nginx` 在 Dockerfile 里 `chown` 给非 root 用户。
5. Dockerfile 运行阶段：创建用户 + `USER appuser` + `EXPOSE <非特权端口>`。

**牵连（重要）**：端口 80→8080 后，部署侧（K8s Service targetPort、Ingress、容器端口映射）必须同步改，否则服务不通。改之前务必确认部署配置在哪改。

**基础镜像不确定时的兼容写法**（同时兼容 Alpine `adduser -S` 与 Debian/RedHat `useradd -r`）：

```dockerfile
RUN set -eux; \
    if command -v addgroup >/dev/null 2>&1; then \
      addgroup -S appuser && adduser -S -G appuser appuser; \
    else \
      groupadd -r appuser && useradd -r -g appuser appuser; \
    fi; \
    chown -R appuser:appuser /var/log/nginx; \
    { chown -R appuser:appuser /var/cache/nginx || true; }
USER appuser
```

## 三、间接依赖升级必须用 pnpm.overrides

**现象**：想升级 `form-data`（axios 的间接依赖）到 4.0.6，但它不在 package.json dependencies 里。直接 `pnpm add form-data@4.0.6` 会把它变成项目的直接依赖，且未必改变 axios 实际拉取的传递版本。

**规则**：固定/升级间接（传递）依赖版本，用 pnpm 的 `overrides`，所有引用都会被钉到指定版本：

```json
"pnpm": {
  "overrides": {
    "form-data": "4.0.6"
  }
}
```

然后 `pnpm install`，`pnpm-lock.yaml` 里该包全部引用同步更新。

## 四、Command Injection：execSync 字符串拼接 + shell

**现象**：Fortify 把 `execSync(cmd, { shell })`（或封装它的 helper）报为 Command Injection，只要 `cmd` 含外部/配置来源的动态内容。本项目报警点在部署脚本第 19 行的 `sh = (cmd) => execSync(cmd, { stdio:'inherit', shell: SH })`——它把 `.deployed.json` 的 `host`/`username`/`localPath`/`remotePath`/`script` 直接字符串拼进 shell 命令。

**根因**：凡经 shell 解释的字符串拼接，配置值里混入 `;`、`` ` ``、`$()`、`|`、`&` 等元字符就会被当命令执行。如 `host = "x;rm -rf /"` 会让 `scp ... x;rm -rf /` 真去执行 `rm -rf /`。

**解决（两步缺一不可）**：

1. **结构化命令改用 `execFileSync(file, args, { shell:false })`**，以参数数组传递，程序不经 shell，参数原样透传，元字符天然失效。tar/scp/ssh 这类固定程序命令都能这样改：

```js
import { execFileSync } from 'node:child_process'
const run = (file, args) => execFileSync(file, args, { stdio: 'inherit', shell: false })

run('tar',  ['-czf', tarName, '-C', localPath, '.'])
run('scp',  ['-P', String(port), tarName, `${user}@${host}:${remoteTar}`])
// 多步远程命令拆成多次 ssh，避免本地 && 字符串拼接
run('ssh', ['-p', String(port), `${user}@${host}`, `tar -xpf ${remoteTar} -C ${remote} -m`])
```

2. **配置值白名单校验**，作为纵深防御（远程侧 ssh 仍会把拼接串交给远程 shell，需保证值安全）：

```js
const SAFE_RE = /^[\w.@:/\\~-]+$/
const assertSafe = (v, label) => {
  if (typeof v !== 'string' || !SAFE_RE.test(v)) { console.error(`非法配置 ${label}: ${v}`); process.exit(1) }
  return v
}
```

**唯一保留 shell 的场景**：用户自定义 build 脚本（如 `npm run build:prod`），它本就是合法 shell 命令、来自可信本地配置，用 `execSync` 即可，但应在注释中显式标注为可信来源，避免再次误判。

**坑**：
- `execFileSync` 无 shell 时，Windows 下只能直接调 `.exe`（`tar`/`scp`/`ssh` 在 System32 都是 .exe，OK）；但 `npm` 是 `npm.cmd`，无 shell 找不到，所以 build 脚本必须保留 shell。
- `stdio: 'inherit'` 在 `execFileSync` 下同样支持 scp/ssh 的交互式密码输入，行为不变。
- 白名单正则不含空格/中文，含空格的路径（如 `Program Files`）会被拒——部署路径基本不含空格，属可接受取舍；若确需空格路径，改用专门的 shell-quote 转义库。

---

## 本项目实例

- **项目**：青少年智能培训管理系统（Qsntypx-q，Vue3 + Vite + Element Plus）
- **路径**：`d:\Users\Orange\Documents\oneSport\AAA-kechuang-YFY\Qsntypx-q`
- **涉及改动**：
  - `src/lib/http.js` 第 103 行 `Math.random()` → 复用 `src/utils/utils.js` 已有的 `cryptoRandom()`
  - `Dockerfile` / `nginx.conf` / `frontend.conf`：nginx 非 root 化，监听端口 80 → 8080，pid 改 `/tmp/nginx.pid`，新增 `appuser` + `USER appuser` + `EXPOSE 8080`
  - `package.json` `pnpm.overrides`：`form-data` 钉到 4.0.6
- **项目**：体育中考上云统一报名平台（Tyzxyy-q-mp，uni-app 微信小程序）
  - **路径**：`d:\Users\Orange\Documents\oneSport\AAA-kechuang-YFY\Tyzxyy-q-mp`
  - **涉及改动**：`scripts/deploy.mjs` 第 19 行 `sh = (cmd) => execSync(cmd, {shell})` 报 Command Injection（严重）。改为：tar/scp/ssh 全部用 `execFileSync` 参数数组（`shell:false`）执行；新增 `assertSafe` 对 `host`/`username`/`localPath`/`remotePath`/`port` 做 `^[\w.@:/\\~-]+$` 白名单校验；远程 `&&` 拼接拆成多次 ssh 调用；build 脚本（`npm run build:prod`）保留 `execSync` 经 shell 执行并加注释说明为可信配置。
