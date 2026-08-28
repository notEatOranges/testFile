# mp-weixin：echarts 按需打包坑点（esbuild 无 umd / ESM default 的 .default interop / tree-shake 须 ESM entry / echarts5＜6）

> 适用：uni-app + lime-echart + 微信小程序（mp-weixin），把全量 echarts.min.js 改按需引入。前置约束见《mp-weixin-lime-echart必须放static目录坑点》：echarts 必须 **UMD/cjs + 放分包 static/ + require**，不能 ESM import 全量 UMD。

## 现象

全量 `echarts.min.js`（~1MB）占满分包，需按需引入。但改造连环踩坑：bundle 没瘦 / require 报错 / 真机图表空白。

## 根因（4 个连环坑）

1. **esbuild ≥0.28 移除了 `--format=umd`**：只支持 `iife`/`cjs`/`esm`。传 `--format=umd` 报 `Invalid value "umd"`；且 esbuild CLI 包装层用 `execFileSync` 跑 binary，失败时抛一串 `node:child_process:930 throw`（**真正错误在上方那行 `Invalid value`，别被 stack 误导**）。
2. **CJS entry 让 tree-shake 失效**：`const echarts=require('echarts/core'); module.exports=echarts` → esbuild 保守保留整包，按需 bundle 体积 ≈ 全量。
3. **ESM entry 能 tree-shake，但 `export default` 经 `--format=cjs` 输出成 `module.exports.default`**（带 `__esModule`）：`require(bundle)` 返回 `{default: echarts}`，`echarts.init` 在 `.default` 上而非顶层 → lime-echart 的 `init(echarts)` 拿到 `undefined.init` 崩。与原 UMD（require 直接返回 echarts 对象）接口不一致。
4. **echarts6 比 5 大**：echarts6 按需 bundle 可能比 echarts5 全量还大（新渲染/动画引擎）。原项目 echarts.min.js 多半是 5.x，按需要用 **echarts@5**。

## 正确写法

**1. entry 用 ESM import（tree-shake 才生效）+ 只注册用到的模块**（模块清单从项目 option 实测，别拍脑袋）：

```js
// scripts/echarts-custom.entry.js（构建脚本，不进小程序产物）
import * as echarts from 'echarts/core';
import { BarChart, LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent, AxisPointerComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([BarChart, LineChart, ScatterChart, GridComponent, LegendComponent, TooltipComponent, AxisPointerComponent, CanvasRenderer]);
export default echarts;
```

**2. esbuild 用 `--format=cjs`（非 umd），装 echarts@5**：

```bash
pnpm add -D echarts@5 esbuild
pnpm exec esbuild scripts/echarts-custom.entry.js --bundle --format=cjs --minify --outfile=packageFeature/static/echarts.min.js
```

**3. CECharts 的 require 加 `.default || 自身` interop**（兼容新 cjs bundle 的 `.default` + 原 UMD）：

```js
// #ifdef MP
const __echarts = require('../../static/echarts.min.js');
const echarts = __echarts.default || __echarts; // esbuild cjs 走 .default；UMD 走自身
// #endif
```

CECharts 其余代码（init/setOption/dispose）零改动，仍 `require` static（不违反 lime-echart static 约定）。

## 诊断

1. esbuild 报 `Invalid value "umd"` → 换 `--format=cjs`（0.28+ 无 umd）。
2. 按需 bundle 体积 ≈ 全量（没瘦）→ entry 是 CJS `require`；改 ESM `import`。
3. `require(bundle).init` 是 undefined → echarts 在 `.default`；加 `.default || 自身` interop。
4. echarts6 按需反而更大 → 降 `echarts@5`。
5. 真机某图表空白/报错 → entry 漏注册组件，按 option 用到的补进 `use([...])` 后重跑 esbuild（秒级）。
6. 验证可用：`node -e "const e=(require('./echarts.min.js').default||require('./echarts.min.js'));console.log(typeof e.init)"` 应为 `function`。

## 本项目实例

翼动同行（school-parent-mp）：`packageFeature/static/echarts.min.js` 全量 999.6KB（echarts5 UMD）。按需只用到 bar/line/scatter + grid/legend/tooltip/axisPointer + canvas（源自 `utils/chartOption.js` + exercise/test-report 的 option）。

踩坑链：① esbuild `--format=umd` 报错（0.28 无 umd）；② CJS entry + echarts6 → bundle 1108KB（tree-shake 失效 + 6 比 5 大）；③ ESM entry + echarts6 仍 1108KB；④ 降 echarts@5 + ESM entry → 513.8KB，但 `export default`→`.default`，node require `init:undefined`。

正解：echarts@5 + ESM entry + `--format=cjs` + CECharts 加 `.default || 自身` interop。`echarts.min.js` 999.6→513.8KB，node 验证 init/use/connect 均 `function`。构建入口留 `scripts/echarts-custom.entry.js`（含重建命令）；echarts/esbuild 进 devDependencies（构建用，不进产物）。

⚠️ **必须真机验证**：图表实际渲染（tooltip/图例/面积渐变/散点/柱状圆角）是否被按需 bundle 完整覆盖——node 只能验证 `init` 可调用，覆盖不了 option 用到的全部特性。
