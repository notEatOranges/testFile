# echarts 6 + Rolldown 代码分割致 init_Component 未定义白屏

## 现象
Vite 7/8（默认 Rolldown 打包器）+ echarts 6.x 项目：
- 本地 `pnpm dev` 一切正常
- 生产 `pnpm build` 部署后，登录跳转首页（或任何用到 echarts 的页面）白屏
- 控制台唯一致命错误：`ReferenceError: init_Component is not defined`，堆栈指向 echarts 相关 chunk，并经 `app.use(...) → install` 把整个 Vue 应用拖崩
- 登录页本身正常显示（因为登录页不加载 echarts，echarts 在业务页懒加载，所以表现为"登录后白屏"）

## 根因
echarts 6 的 ESM 源码入口（`index.js`）顶层有一段内部模块注册调用序列：
`init_Component(), init_Model(), init_util(), init_Chart(), init_Series() ... init_zrender(), init_extension()`
这些 `init_XXX` 是 echarts 内部各子模块（`lib/chart/*`、`lib/component/*`）的导出函数，用于注册图表/组件/模型。

Rolldown（Vite 7+ 默认打包器，基于 Rust）在代码分割时：
1. 把 echarts 的具名导出（init/registerMap 等）正确分配到 echarts 主 chunk
2. 但把 echarts `index.js` 顶层那段 `init_XXX()` side-effect 调用序列，错误地"内联/剥离"到**每个 import echarts 的业务 chunk**
3. 而这些 `init_XXX` 函数的定义在主 chunk 里被 tree-shake 或改名，业务 chunk 里的裸调用 `init_Component()` 没有任何 import 对应 → ReferenceError

业务 chunk 里会看到：`import{n as y,t as b}from"./echarts-xxx.js"`（正常命名导入）紧跟一串 `y(),init_Component(),init_Model()...`（孤儿调用）。echarts 主 chunk 里 grep `init_Component` **0 匹配**（定义丢失）。

这是 echarts 6 + Rolldown 的不兼容，**Rollup（Vite 6 及以下）无此问题**。

## 诊断方法
1. chrome-devtools MCP 打开部署页，`list_console_messages` 抓 `ReferenceError: init_Component is not defined`
2. `evaluate_script` 抓 echarts 业务 chunk：`fetch('/assets/ECharts-xxx.js').then(r=>r.text())`，搜 `init_Component` —— 确认业务 chunk 里有裸调用
3. 抓 echarts 主 chunk，搜 `init_Component` —— 确认主 chunk **0 匹配**（定义丢失）
4. 产物里出现 `rolldown-runtime` chunk = 确认用的是 Rolldown

## 通用解决方案（保留 echarts 6，推荐）
**用 `resolve.alias` 把 `echarts` 精确指向官方预打包的完整 ESM 单文件 bundle**，让 echarts 从源头就是一个不可拆分的自洽模块：

```js
// vite.config.js
resolve: {
  alias: [
    { find: '@', replacement: path.resolve(__dirname, 'src') },
    // ⚠ 必须用正则 ^echarts$ 精确匹配包名，不能写对象形式 { echarts: '...' }
    // 对象形式是前缀匹配，会误伤 echarts/theme/macarons、echarts/core 等子路径导入 → UNLOADABLE_DEPENDENCY
    { find: /^echarts$/, replacement: path.resolve(__dirname, 'node_modules/echarts/dist/echarts.esm.mjs') },
  ],
},
```

要点：
- **必须正则 `^echarts$` 精确匹配**（数组形式 alias）。对象形式 `echarts: '...'` 是前缀匹配，会把 `import 'echarts/theme/macarons'` 也替换掉，报 `Could not load .../echarts.esm.mjs/theme/macarons`。
- 用未压缩的 `echarts.esm.mjs`（让打包器统一压缩，产物更优），或 `echarts.esm.min.mjs`（已压缩，1MB 出头）。
- 该 bundle 是**命名导出**（`init$1 as init`、`registerMap`、`use`、`connect`、`version` … 全是 named export，**无 default**），完美适配业务代码 `import * as echarts from 'echarts'`，`echarts.init / echarts.registerMap` 都能取到。
- **不需要加 manualChunks**：实测"强制 echarts/zrender/tslib 整包合并"无效——Rolldown 仍会把 init side-effect 散射到业务 chunk，反而让 `init_XXX` 出现在更多 chunk（6 个）。alias 到单文件 bundle 才是从根上解决。

### 备选方案
- **降级 echarts 到 5.x**：最稳妥。5.x 与 Rollup/Rolldown 兼容性久经考验；项目用到的 `init/setOption/resize/dispose/registerMap` 等 API 在 5.x 完全一致。多数 RuoYi/Vue2 老项目原本就是 echarts 5，升级时"顺手升 6"反而引入此回归。
- **回退打包器到 Rollup**：Vite 6 及以下用 Rollup，无此 bug（但需降 Vite 版本，影响面大）。

## 本项目实例
- 项目：Tyzxyy-q（RuoYi-Vue3 框架，Vue 3.5 + Vite 8.0.16 + echarts 6.1.0）
- 修复位置：项目根 `vite.config.js` 的 `resolve.alias`
- 部署地址 `http://172.19.80.20:30050/login` 登录后白屏
- 含 `import * as echarts from 'echarts'` 的业务 chunk：`src/components/ECharts/index.vue`、`src/views/dashboard/{Bar,Line,Pie,Raddar}Chart.vue`、`src/views/monitor/cache/index.vue`、`src/views/data/analysis/echartOption.js`；另有 `import 'echarts/theme/macarons'`（4 处，正则精确匹配可避免误伤）
- 验证：改 alias 后 `pnpm build:prod`，grep `dist/assets` 的 `init_Component` 从「6 个文件各 1 次」降为 **0**；业务 chunk 改为 `import{n as y,t as b}from"./echarts.esm-xxx.js"` 正常命名导入
