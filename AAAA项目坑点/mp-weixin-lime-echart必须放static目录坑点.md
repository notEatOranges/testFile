# mp-weixin：lime-echart 的 echarts.min.js 必须放 `static/` 目录 + `require` 引入

> 适用：uni-app + lime-echart + 微信小程序（mp-weixin），HBuilderX 工程。

## 现象

引入 echarts 时按方式不同依次踩中：

1. `require('./lib/echarts.min')`（文件在 `components/xxx/lib/`）→ 运行时
   `module '.../lib/echarts.min.js' is not defined, require args is './lib/echarts.min'`
2. `import * as echarts from './lib/echarts.min.js'`（UMD 走 ES import）→ lime-echart 报
   `echarts 版本不对或未传入echarts，vue3请使用esm格式` + `library.init is not a function`
3. 末尾连锁 `Error: timeout`（init 失败后 finished 事件反复触发 render）

## 根因

lime-echart 官方约定（DCloud 插件市场 id=4899）：小程序下 echarts = **UMD + 放 `static/` + `require`**。

`static/` 是 HBuilderX 特殊目录——其下 js 会被**原样复制到产物并注册为可 require 模块**。移出 `static/`（如放进 `components/` 下）两条路全死：

- **require（非 static）**：HBuilderX 不打包非 static 的 require 目标 → `module is not defined`。
- **import（UMD）**：rollup 只认 ESM 静态 `export`；UMD 运行时动态挂 `exports`，rollup 识别不出 → tree-shake 成空对象 `Object.freeze({__proto__:null})` → `registerPreprocessor`/`init` 全 undefined → 报「vue3请使用esm格式」。

> ⚠️ 「vue3请使用esm格式」是**误导性兜底文案**——含义是「echarts 对象是空的」，不是真要 ESM。换 ESM 是错路，唯一正解：放回 static + require。

## 正确写法

文件位置：**分包页面用分包 static**（不占主包体积），如 `packageA/static/echarts.min.js`；主包页面用根 `static/`。

```js
// #ifdef MP
const echarts = require('../../static/echarts.min.js'); // 相对当前页面到对应 static
// #endif
// #ifndef MP
const echarts = null; // H5/App 由 l-echart 自动处理
// #endif
```

## 诊断

1. 产物 `unpackage/dist/dev/mp-weixin/<包>/static/echarts.min.js` 是否存在——不存在 + require 报 not defined = 没放 static / 路径错。
2. 编译后 `index.js` 里 `require("...echarts.min.js")` 是否原样保留——若变 `Object.freeze({__proto__:null})` = 用了 import UMD，改回 require + static。

## 本项目实例

翼动同行（school-parent-mp）：c4fa38d「压缩体积」把 echarts.min.js 从 `uni_modules/lime-echart/static/` 移到 `packageMine/components/CECharts/lib/`，破坏约定。修复：移到分包 `packageMine/static/echarts.min.js` + CECharts 改 `require('../../static/echarts.min.js')`。详见该项目 `docs/gotchas/mp-weixin-lime-echart-static-require.md`。
