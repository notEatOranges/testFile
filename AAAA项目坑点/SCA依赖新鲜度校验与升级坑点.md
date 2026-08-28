# SCA「依赖新鲜度>3年」校验与升级坑点

> 与漏洞（vulnerability）不同：**新鲜度（freshness）** 是供应链「组件发布时间距今是否 ≤ 3 年」的合规指标，不代表有安全漏洞。两者排查思路完全不同，别混。

## 坑 1：「>3 年都要升级」对间接依赖多数是伪命题

### 现象
SCA 报告（如制品库导出的 `组件清单.xlsx`）列出 N 个「不新鲜（>3年）」组件，要求「都要升级」。但逐个查 npm 后发现绝大多数**根本升不动**：

- **A 类·已是最新版（包已停更）**：当前安装版本就是上游最新发布版本，上游多年没发新版（成熟稳定 / 停止维护）。例：`ms@2.1.3`、`json5@2.2.3`、`lodash.clonedeep@4.5.0`、`combined-stream@1.0.8`、`async-validator@4.2.5`、`@popperjs/core@2.11.8`、`nprogress@0.2.0`（仅此一个稳定版）。**没有可升级的目标版本。**
- **B 类·存在新版但被父依赖锁主版本**：npm 上有更新主版本，但父依赖声明的 semver 范围（常是**精确锁定**或 `^旧主版本`）不允许。例：`semver` 6.3.1→7.x（被 `@babel/*` 锁 6）、`mime-types` 2.1.35→3.x（被 `form-data` 精确锁 2.1.x）、`https-proxy-agent` 5→9（被 `axios` 锁）、`lru-cache` 5→11、`js-tokens` 4→10。强 override 到新主版本会因 API 不兼容**破坏父依赖**。

### 根因
新鲜度是**包的发布时间**，不是「有没有新版可用」。一个包「老」可能只是因为它早就做完了、没人再发版（A 类），或它的父依赖还停在旧主版本（B 类）。这两类都不是「升一下就好」。

### 怎么处理
1. **先分死活**：拿到「>3年」清单后，对每个包查 `registry.npmmirror.com/<pkg>` 的 `dist-tags.latest` 和 `time`，判断属于 A/B/C（C=范围内确有更新小版本可升）哪一类。只有 C 类值得动。详见 [[代码扫描结果先分死活再修坑点]]。
2. A 类 → 归档为「已知例外（已停更，无更新版）」；B 类 → 归档为「已知例外（跨主版本，被父依赖限制）」。
3. 真正能改善计数的杠杆：**替换停更的直接依赖**（见坑 4），而不是硬升叶子包。

## 坑 2：`pnpm update <传递依赖>` 对「父依赖精确锁定」的包无效

### 现象
想安全升级 `sortablejs` 1.14.0→1.15.7、`mime-db` 1.52.0→1.54.0（都是同主版本小升级、确有新版），执行：
```bash
pnpm update sortablejs mime-db
```
输出 `Already up to date`，lockfile **纹丝不动**，仍是旧版本。

### 根因
- `vuedraggable@4.1.0` 的 `dependencies` 写的是 **`"sortablejs": "1.14.0"`（精确版本，无 `^`）**；
- `mime-types@2.1.35` 写的是 **`"mime-db": "1.52.0"`（精确版本）**。
- 精确锁定 = 父依赖只认这个版本，`pnpm update <传递包>` 在范围内无可用更新（1.15.7 不在 `1.14.0` 这个精确约束里），于是 "already up to date"。

### 修复
用 `pnpm.overrides` 强制（对同主版本小升级是安全的）：
```json
"pnpm": { "overrides": { "sortablejs": "1.15.7", "mime-db": "1.54.0" } }
```
然后 `pnpm install`，lockfile 才会更新到新版本。override 的其它注意事项（孤儿包残留、版本选择器语法）见 [[pnpm-overrides修漏洞后孤儿包残留仍被扫描告警坑点]]。

### 要点
- 「父依赖是精确锁定还是 `^` 范围」决定了传递依赖能不能被 `pnpm update` 拉新。先读父包 `package.json` 的 dependencies 再决定手段。
- `pnpm update <传递包>` 说 "already up to date" ≠ 真的没有更新版，只代表「在父依赖声明的约束内没有更新版」。

## 坑 3：SCA 导出的「组件清单」Excel 首行即数据，没有表头

### 现象
用 openpyxl 解析制品库导出的 `组件清单` sheet，按惯例把第 1 行当表头、从第 2 行开始读数据 → **漏掉第 1 行那个组件**，总数比报告「概要」里的「组件总数」少 1。

### 根因
该 sheet **没有表头行**，第 1 行就是第一条数据（如 `delayed-stream`）。

### 修复
读之前先确认第 1 行是否表头；若是纯数据，要么按无表头处理（遍历所有行），要么 `insert_rows(1)` 自己补表头。校验：解析出的组件总数必须等于「概要」sheet 的「组件总数」，否则就是差了首行。

## 坑 4：补全「无发布时间」组件——获取 npm 发布时间的网络与编码坑

### 现象
SCA 报告里大量组件「发布时间」为空（扫描器没取到）。要补全就得批量查 npm registry 的 `time` 对象，过程中踩了三个坑：

1. **registry.npmjs.org 国内极慢/超时**：`urllib` 顺序拉 100+ 包动辄几分钟不返回（大 packument 持续滴流字节，read timeout 不触发）。
2. **npmmirror 对 scoped 包 URL 编码敏感**：`urllib.parse.quote('@babel/core')` 会把 `@` 编码成 `%40` → `https://registry.npmmirror.com/%40babel/core` → **HTTP 422**。curl 用字面 `@babel/core` 却 200。
3. **npmmirror 大响应走 gzip**：不加 `Accept-Encoding` 时返回 gzip 字节流，`json.load(resp)` 直接炸；但小包不一定压缩，时好时坏，极具迷惑性。

### 修复
- 用 **npmmirror**（`https://registry.npmmirror.com/<pkg>`，国内用户的 `~/.npmrc` 默认源），比 npmjs.org 快一个数量级。
- 包名**不要 quote**（或 `quote(p, safe='@/')`），保留字面 `@` 与 `/`。
- 请求头加 **`Accept-Encoding: identity`**，禁用 gzip，`json.load` 才稳。
- 并发（`ThreadPoolExecutor(max_workers≈16)`）+ 单请求 `timeout≈12s`，100+ 包几十秒搞定。

### 要点（结论）
- 「无发布时间」的组件**绝大多数是最新（2024-2026）的包**，补全后基本都「新鲜」——扫描器没取到时间 ≠ 陈旧。别被空值吓到，补全后重新校验即可。
- 私有包（如项目自身 `qsntypx-admin`）在公网 registry 404，单独标注「本项目」即可。

## 坑 5：要给「停更/无时间」组件出 npm 截图证据时的三个坑

### 坑 5a：npmjs.com 对 headless Chrome 有人机校验，截出来是空白校验页
- 用 `chrome --headless=new --screenshot` 批量截 `https://www.npmjs.com/package/<pkg>`，得到的不是包页面，而是 **Cloudflare「Verifying you are human」校验页**（截图 ~25KB，无任何包信息）。
- **解法**：改截 **npmmirror.com**（npm 官方镜像）的「版本历史」页 `https://npmmirror.com/package/<pkg>/versions`：无人机校验，且一页同时显示**版本号 + 发布时间**（如 `8.0.0  2026-06-16`），比 npmjs 主页更能证明「停更时间/是否最新版」。合规上 npmmirror 即「npm」，可作证据源。
- 要么就得用**真实有头**浏览器（chrome-devtools-mcp 那种 headed Chrome 能过 Cloudflare），但 200+ 个页无法交互式逐个截。

### 坑 5b：`chrome --screenshot=<路径>` 的路径必须是「绝对路径」
- 传相对路径会报 `Failed to write file ...: 系统找不到指定的路径 (0x3)`，因为 headless chrome 的 CWD 不是你 shell 的 CWD。用 `os.path.abspath` / `$(pwd)` 拼绝对路径。

### 坑 5c：chrome-devtools-mcp 的 browser profile 可能被占，导致 MCP 起不来
- 报错 `The browser is already running for ...chrome-profile. Use --isolated to run multiple browser instances.`
- 此时 MCP 工具完全不可用。批量截图这种场景，改用 `chrome --headless=new --user-data-dir=<独立目录>`（独立 profile，不干扰日常浏览器），用脚本驱动即可，不依赖 MCP。

### 批量截图脚本要点
- `--virtual-time-budget=10000`：给 npm/npmmirror 这种 SPA 足够虚拟时间渲染，否则截到白屏。
- `--window-size=1280,1400`：版本历史页要高一点才能截到多行版本+日期。
- **断点续跑**：已存在且 >5KB 的 png 跳过；200+ 张中断后再跑会接着来。

## 坑 6：把截图嵌入 xlsx 表格（openpyxl）

### 坑 6a：图片锚点必须用「坐标字符串」，不能用 Cell 对象
- `img.anchor = ws.cell(row, col)` 会在 `wb.save()` 时炸：`AttributeError: 'Cell' object has no attribute 'upper'`（`_check_anchor` 期望字符串）。
- **正确**：`img.anchor = f"{get_column_letter(col)}{row}"`，如 `"O5"`。

### 坑 6b：嵌入大量截图要先缩略，否则行高失控、文件巨大
- npmmirror 版本页截图是 1280×1400，整张嵌进去行高会到 ~1000pt，200 行根本没法看。
- 用 Pillow **裁顶部 720px**（包名+前若干个版本日期都在顶部）再 resize 到 ~480 宽，存 JPEG q82，单图 ~12KB；200+ 张嵌入后 xlsx 才 ~2MB。
- 行高 = 图片显示高(px) × 0.75(≈pt/px) + 余量；嵌图的行才撑高，其余行保持默认。
- 同一包名多版本行可复用同一张图（按包名 slug 查 png）。

### 坑 6c：xlsx 被 Excel 打开时写盘失败
- `wb.save()` 报 PermissionError。脚本应 catch 后改写到「(文件被占用)」后缀文件，别硬崩。

## 坑 7：报告的「当前版本/最新版」可能失真甚至投毒——升级前必须双向校正

### 现象
SCA/新鲜度报告（xlsx）给的两列版本都可能是「线索」而非「事实」：
- **「当前版本」失真**：报告报的当前版本与实际安装不符。例 `magic-string` 报 `0.26.7`，但 `pnpm-lock.yaml` 里实际是 `0.30.21`（报告基于旧快照或误扫另一份依赖树）。直接信报告去 override 会做无效升级。
- **「最新版」给出疑似投毒/抢注版本**：例 `balanced-match` 报最新 `4.0.4`，但该包（juliangruber 维护）多年止于 `1.0.2`，4.x 突现于 registry，高度疑似**供应链抢注/投毒**。若照报告 override 到 4.0.4 等于主动引入恶意代码。

### 修复（升级前必做双向校正）
1. **当前版本** → 以 `pnpm-lock.yaml` 的 `packages:` 段（v9 格式 key 为 `'name@version'`，scoped 包带 peer 后缀如 `'@deployed/cli@1.7.0(@types/node@26.1.2)'`）或 `pnpm list` 为准。
2. **最新版本** → 以 `npm view <pkg> version`（registry 实际 `dist-tags.latest`）为准，丢弃报告值。
3. **可疑值告警**：小工具包（常年 1.x/0.x）突现大版本跳跃 → 查维护者/发布历史/下载量，宁可标「疑似投毒，不升」也绝不 override。

### 要点
报告是「待校验的线索清单」，不是「可直接执行的升级指令」。任何一个版本号都要落到 registry/lock 实证后才动手。

## 坑 8：「有新版(可升级)」对「宿主已是最新」的间接依赖多为死路——ESM-only 预筛法

### 现象
报告标「有新版(可升级)」的 N 个组件若**全是间接依赖**，且其**宿主直接依赖本身已是 npm 最新版**（无新版可升），则无法靠升级直接依赖带动（治本路径断）。唯一手段是 `pnpm.overrides` 强升传递依赖。但这些传递依赖的最新版**多为 ESM-only 大版本**（chalk 6 / ora 9 / glob 13 / string-width 8 / wrap-ansi 10 / supports-color 11 / type-fest 5 / onetime 8 / mimic-fn 5 …），而宿主（@deployed/cli、构建插件等）是 CommonJS，强升后宿主 `require()` 必报 `ERR_REQUIRE_ESM` → 构建/部署直接崩。

### 预筛法（秒判，不必逐个 install）
`npm view <pkg>@<latest> type`（配合 `exports`/`main`）：
- `type=module` 且**无** `require`/`.cjs` 入口 → **ESM-only，CJS 宿主必崩，判不可升**。
- `type=commonjs` 或 dual（exports 同时提供 `require`）→ 才值得 `install` + 跑宿主 `require` 冒烟 + `build` 实测。

> 判定 dual：`type=module` 但 `main` 指向 `.cjs`，或 `exports` 同时有 `import` 与 `require` 条件 → 可被 CJS require，进实测池。

### 怎么处理
1. 先摸清「宿主直接依赖是否已是最新」：`npm view <宿主> version`。若已最新，整条链的传递依赖只能走 overrides。
2. 对每个传递依赖做 ESM 预筛，砍掉 type=module 的大半（伪命题）。
3. 只对剩少量 CJS/dual 候选做 `overrides` + `pnpm install` + `node -e "require('<宿主>')"` 冒烟 + `pnpm build` 实测。每个 cycle 用 `git checkout -- package.json pnpm-lock.yaml` 还原基线，避免互相污染。
4. 涉及生产依赖（如 axios）的传递依赖，升级前还要评估对业务请求的影响，不只是构建能过。

### 要点
「有新版(可升级)」≠ 可安全升。间接依赖 + 宿主已最新 + ESM-only 三件套 = 基本不可升，应归档为「已知例外」，而不是硬 override 把构建搞崩。真正能改善新鲜度计数的杠杆仍是**替换停更的直接依赖**，不是强升叶子包。

## 坑 9（工具）：Windows 下 Python subprocess 调 npm 必须 shell=True

### 现象
`subprocess.run(['npm','view',...])` 在 Windows 报 `[WinError 2] 系统找不到指定的文件`。

### 根因
npm 实际是 `npm.cmd`。subprocess 不加 `shell=True` 时**不解析 PATHEXT**（不会自动找 `.cmd`/`.bat`），所以直接 `['npm', ...]` 找不到可执行文件。

### 修复
- `subprocess.run('npm view <pkg> ...', shell=True, capture_output=True, text=True, encoding='utf-8')`（Windows 下 shell=True 走 cmd.exe，会解析 .cmd）。
- 或显式 `npm.cmd`。
- 冒烟 `node -e "require('<pkg>')"` 时，包名含特殊字符可用 `node -e "require(String.fromCharCode(...))"` 把包名编码成 charCode 传入，绕开 cmd 的引号转义地狱。
- 另见 [[Python-Windows中文控制台GBK编码崩需PYTHONUTF8坑点]]：中文路径经命令行参数（`python -c` 或传给 powershell/cmd）传递时编码易丢失，应把中文路径写入 UTF-8 文件再读，或用通配符 `glob('*')` 绕开中文字面量。

## 本项目实例
### 实例 A：Qsntypx-q（Vue3 + Vite8）
- 项目：**Qsntypx-q**（青少年智能培训管理系统，Vue3 + Vite8）
- 扫描：制品库 SCA 导出 `组件清单.xlsx`（310 组件，无漏洞）。基准日 2026-07-30。
- 结果：补全 166 个「无时间」组件后 → 新鲜 259 / 不新鲜 50 / 未知 1。
- 50 个不新鲜分类：A 类（已停更）32 个、B 类（跨主版本被父锁）16 个、C 类（范围内可升）2 个。
- 处置（用户选「仅安全升级 + 归档例外」）：
  - C 类 2 个用 `pnpm.overrides` 安全升级：`sortablejs` 1.14.0→1.15.7、`mime-db` 1.52.0→1.54.0（均精确锁定，`pnpm update` 无效）；构建 `pnpm build:test` ✓。
  - 其余 48 个归档为已知例外，见仓库 `docs/DEPENDENCY_FRESHNESS_EXCEPTIONS.md`。
  - 两个停更直接依赖 `nprogress` / `vuedraggable` 未替换（属另一改造任务）。
- 相关：[[pnpm-overrides修漏洞后孤儿包残留仍被扫描告警坑点]]、[[代码扫描结果先分死活再修坑点]]、[[Fortify安全漏洞修复坑点]]。

### 实例 B：Tyzxyy-q-mp（Vue3 + Vite8 + pnpm）
- 项目：**Tyzxyy-q-mp**（游泳专项项目管理系统，`package.json` 有 `"type":"module"`）。基准 2026-08-04。
- 新鲜度报告「有新版(可升级)」56 个 → pnpm-lock 校正：4 个实际已是最新（多版本并存，如 `magic-string` 报 0.26.7 实装 0.30.21；`semver`/`tslib`/`js-tokens` 同）、`@types/jsesc` 不在 lock，真正待评估 **50 个**，全是间接依赖。
- 宿主归并：`@deployed/cli@1.7.0`(44)、`vite-plugin-compression@0.5.1`(6)、`axios@1.19.0`(5)、`@vue/devtools-kit`(hookable 1)，**四个宿主均已是 npm 最新版**（`npm view <宿主> version` 证实）→ 只能 overrides 强升。
- ESM 预筛（坑 8 方法）：`npm view <pkg>@latest type` → **30 个 type=module 判不可升**；`balanced-match@4.0.4` 疑似投毒排除（坑 7）。
- 剩 19 个 CJS/dual 逐个 overrides 实测，双层信号：
  - **L1** = `module.createRequire(require.resolve('<host>/package.json'))('<pkg>')` 从宿主依赖环境 require（验证新版能 CJS 加载）。
  - **L2** = `@deployed/cli` 组跑 `pnpm exec deployed-cli --version`（exit 0 输出 1.7.0）；生产包（axios 组 + fs-extra）跑 `pnpm build:prod`。
  - 结果：**18 个可升**（已写入 `pnpm.overrides`，install+version+build 全过）；**1 个 `readable-stream@4.7.0` 真崩**（L1 能 require 但 `--version` 失败，API 不兼容）。
- **关键教训**：`readable-stream` 证明「require OK ≠ 功能 OK」。deploy 组 14 个虽过了 require+`--version`+build，但 @deployed/cli 懒加载的部署核心功能（node-ssh 建 SSH、archiver 打包、glob 扫文件、tar-stream 流处理）API 兼容性**未被触发**，需 `pnpm deploy` 实跑才能 100% 确认；否则可能像 readable-stream 一样部署时才崩。
- 校验脚本自身踩的三坑：①冒烟 `require('<传递依赖>')` 在 pnpm 根目录 `Cannot find module`（pnpm 不 hoist），须用 `module.createRequire` 从宿主 package.json 解析；②`require('@deployed/cli')` 入口直接进 inquirer 交互挂起，改用 `deployed-cli --version`；③项目 `"type":"module"` 致 `.js` 被当 ESM，`require` 失败，冒烟脚本须用 `.cjs`。
- **「依赖新鲜度检查工具」的 `lock_to_items.py` 解析 pnpm-lock v9 的坑**（已修）：v9 的 `packages:` 段 key 带引号且无 `/` 前缀（`'@babel/code-frame@7.29.7':`），按旧格式正则 `^  (\S+?):$` 解析会：a) scoped 包丢失 scope（`@babel/code-frame`→`code-frame`，因引号使 `startswith("@")` 判 False，scope 被 `rsplit("/")` 当路径切掉）；b) 版本残留引号（`7.29.7'`）；c) `snapshots:` 段（依赖图，key 带 `(peer)` 嵌套）未被 `break` 会重复解析、嵌套 peer 后缀 `re.sub(r"\(...\)")` 去不净污染包名；d) `peerDependencies`/`peerDependenciesMeta` 里的可选 peer 声明（`@farmfe/core`、`@rspack/core` 等项目根本没装的）+ `'@types\node'`（lock 把 `/` 转义成 `\n` 的字面）被误当包条目。修复：正则改 `^  '?(.+?)'?:` 并 `strip("'")`、遇 `snapshots:` 即 `break`、加合法包名过滤 `^(@[\w.-]+/)?[\w.-]+$` + 版本不含空格/引号。否则会用错误包名查 npm，导致大量假 fetch_err。
- 相关：[[pnpm-overrides修漏洞后孤儿包残留仍被扫描告警坑点]]、[[代码扫描结果先分死活再修坑点]]、[[Python-Windows中文控制台GBK编码崩需PYTHONUTF8坑点]]、[[Fortify安全漏洞修复坑点]]。
