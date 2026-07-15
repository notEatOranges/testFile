# 体e智慧助手 · uni-app 微信小程序坑点总结

> **项目**：体e智慧助手（tezhzs-mp）—— 校园体育工具，班级/学生管理 + 校内人脸录入
> **技术栈**：uni-app (Vue 3 `<script setup>`) + Pinia + scss(rpx)
> **目标平台**：mp-weixin（AppID `wx7fc58b30e5ab6b21`）；存在 App-Plus 代码分支但 mp-weixin 为现行目标
> **构建方式**：HBuilderX 工程（无 uni CLI / 无 vite 脚本），发行 = HBuilderX「发行 → 小程序-微信」
> **整理日期**：2026-07-15

---

## 坑点总览

| # | 坑点 | 严重度 | 触发环节 | 一句话结论 |
|---|---|---|---|---|
| 1 | async 函数内直接用 `uni.X` | 🔴 P0 崩溃 | **仅发行构建** | dev 正常、生产必崩；模块顶层具名解构 `uni` 即可避免 |
| 2 | `v-for` 单字母循环变量撞编译器数据槽 | 🔴 P0 渲染错乱 | dev/build 均触发 | 循环变量/索引一律 ≥2 字符 |
| 3 | tabBar 页面放进 subPackages | 🟠 P1 结构 | 注册即错 | tabBar 页面必须放主包 `pages/` |
| 4 | geling 原生分包未注入 | 🟠 P1 集成 | 每次编译后 | HBuilderX 编译后必须 `pnpm geling:inject` |
| 5 | geling 科目白名单三处不对齐 | 🟠 P1 业务 | 跳转点不动 | 三方交集：sport.js ∩ home 白名单 ∩ geling 分包 |
| 6 | `wx.shareFileMessage` 脱离 TAP 栈 | 🟡 P2 平台API | 真机转发 | 调用前零 `await`，用持久化路径 |
| 7 | `onKeyboardHeightChange` 工具不触发 | 🟡 P2 平台API | 弹层键盘避让 | 真机可靠；避让逻辑要加兜底 |
| 8 | 点击触发的网络请求无 loading | 🟢 P3 习惯 | 全程 | 主动 `showLoading({mask:true})` |

---

## 坑 1 🔴：async 函数内直接用 `uni.X` —— 发行构建必崩

### 是什么坑
在 `async` 函数体内**直接调用** `uni.showLoading()` / `uni.showToast()` / `uni.navigateTo()` 等原生 uni API（裸写 `uni.X`，而非具名解构）。

### 导致什么结果
- **开发模式（dev）完全正常**，怎么测都不报错。
- **发行构建（build）后，真机/预览一调用该 async 函数就必崩**，报类似 `Cannot read properties of undefined (reading 'index')` / `undefined.index is not a function`。
- 因为 dev 无感，**极易漏到生产环境**，是隐蔽性最高、杀伤力最大的坑。

### 根因（原理）
1. **发行构建把 `async/await` 编译成 regenerator 运行时**（用 generator 函数模拟 async），而不是原生 async。
2. 压缩器（terser）会把 async 函数体内 `try` 块里的 `const x = await ...` 命名成极短的变量名（经常就是 `e`），并**提升到函数顶部**（regenerator 的状态机需要）。
3. 而模块级的 `uni`，在打包后其实是某个 **vendor 模块导出的短名**（也经常被命名成 `e`）。于是函数内裸写的 `uni.showLoading(...)`，编译后变成 `e.index.showLoading(...)`（`e.index` 即 `uni`）。
4. 当 async 函数内那个被提升的局部 `const e = await ...` 与模块级 vendor 的 `e` **同名**时，局部变量**遮蔽**了模块级 `uni`。regenerator 重新进入函数、执行到 `e.index.showLoading` 时，局部 `e` 尚处于 TDZ（未赋值）→ 读到 `undefined` → `undefined.index` 崩溃。

> 关键：**`const ... = await` 提供了被提升的局部短名**，**裸 `uni.X` 提供了走 `e.index` 的访问**，两者在同一个 async 函数里同时存在 → 必崩。

### 触发条件（同时满足）
1. 发行构建（dev 走原生 async，**不触发**）；
2. 位于 `async` 函数体内（含嵌套的 `success/fail: async () => {}` 回调）；
3. 直接写 `uni.X(...)`；
4. 该 async 函数内还有 `const ... = await ...`（产生被提升的局部变量）。

### 怎么避免（标准写法）
**在文件 `<script setup>` / 模块顶层具名解构 `uni`，函数内只用解构名**。解构名是直接的局部变量引用，编译后不走 `e.index`，不受遮蔽。

```js
// ✅ 正确：模块顶层具名解构（import 之后、业务代码之前）
// 具名捕获 uni API：避免 async 函数内直接用 uni.X 在发行构建被 regenerator 提升遮蔽而崩溃
const { showLoading, hideLoading, showToast, showModal, navigateTo } = uni;

async function onExport() {
  showLoading({ title: '导出中…', mask: true });   // ✅ 用解构名
  const res = await getExportDetail(id);            // const 提升也无所谓了
  hideLoading();                                    // ✅
  navigateTo({ url: '/pages/x/index' });            // ✅
}
```

```js
// ❌ 错误：async 内裸用 uni.X —— dev 正常，发行构建崩
async function onExport() {
  uni.showLoading({ title: '导出中…', mask: true }); // ❌
  const res = await getExportDetail(id);
  uni.hideLoading();                                // ❌ → 发行构建 undefined.index 崩溃
  uni.navigateTo({ url: '/pages/x/index' });        // ❌
}
```

### 本项目已修复范围（16 个文件）
`pages/login/index.vue`、`pages/login/mm.vue`、`pages/authorize/index.vue`、`App.vue`、`packageRecord/detail/index.vue`、`packageRecord/index/index.vue`、`packageMine/info/index.vue`、`packageMine/info/components/ChangePwd.vue`、`packageMine/school/index.vue`、`packageMine/school/search.vue`、`packageFace/components/StudentItem.vue`、`packageFace/student/edit.vue`、`packageFace/shot/index.vue`、`hooks/useFace.js`、`utils/exportFile.js`、`store/user.js`。参考样例：`pages/home/index.vue` 第 146 行。

### 如何诊断
- dev 复现不了 → 必须做**发行构建**后在真机/预览复现。
- 崩溃栈含 `undefined`、`index`、`is not a function` 且定位到某个 async 函数 → 八成是这个坑。
- 排查：grep 该 async 函数体内是否有裸 `uni.X`。

---

## 坑 2 🔴：`v-for` 单字母循环变量撞编译器数据槽 → `[object Object]`

### 是什么坑
`v-for` 的循环变量或 index 用了单字母（`a`~`z` 任一，含 `f`/`c`/`s`/`g`/`h`/`i`），且模板里有**静态 `src`**（或不依赖循环项的字面量/常量 `:src`）的 `<image>`。

### 导致什么结果
- 图片 `src` 渲染成 `[object Object]`，图片不显示。
- 甚至连纯文本 `{{ s.score }}` 都会坏（变量被对象遮蔽）。

### 根因
uni-app 编译到 mp-weixin 时，会把模板里**静态 `src` 路径**「提升」到组件数据的**单字母数据槽**（`a,b,c,...,g...,s...`，按出现顺序分配），编译后 wxml 是 `src="{{g}}"`。若**外层 `v-for` 循环变量名恰好是同一个单字母**（如 `v-for="(g, gi) in ..."`），内层作用域里 `{{g}}` 被循环变量（对象）遮蔽 → 解析成对象 → `[object Object]`。

### 怎么避免（铁律）
**`v-for` 的循环项变量与 index 变量一律 ≥2 字符**：`group`/`item`/`filter`/`stu`/`sport`、`idx`/`gi`/`dotIdx`。

```html
<!-- ❌ 错误 -->
<view v-for="(g, gi) in groups" :key="gi">
  <image src="/static/building.png" />   <!-- g 撞数据槽 → [object Object] -->
</view>

<!-- ✅ 正确 -->
<view v-for="(group, gi) in groups" :key="gi">
  <image src="/static/building.png" />
</view>
```

### 已踩坑记录
`f`(筛选 chip) / `c`(首页轮播指示点) / `s`(详情学生列表) —— 全改多字符修复。详见 `docs/gotchas/mp-weixin-image-vfor-slot-collision.md`。

### 如何诊断
看 `unpackage/dist/dev/mp-weixin/<page>.wxml`：`{{<字母>}.xxx}` 或 `src="{{<字母>}}"` 是否和 `wx:for-item` 同名。

---

## 坑 3 🟠：tabBar 页面放进 subPackages

### 是什么坑 / 结果
mp-weixin 的 **tabBar 页面必须放在主包 `pages/`**，不能放在 `subPackages` 的 root 下。放错会导致 tabBar 页面加载异常、`switchTab` 失效。

### 怎么避免
- `pages.json` 的 `tabBar.list` 里所有 pagePath，其文件必须在主包 `pages/` 下。
- 需要分包的页面放 `packageMine/`、`packageFace/`、`packageRecord/`，但**不要把 tabBar 三个页（首页/学生/我的）挪进去**。
- 详见 `docs/home-tab/PROGRESS.md`。

---

## 坑 4 🟠：geling 原生分包未注入

### 是什么坑
geling（格灵智慧体育）是第三方交付的**原生微信小程序普通分包**（`Page()`/`wx.*`/`tdesign-miniprogram`），uni-app 不能直接注册。源码原样保留在 `subpackages/geling/`，靠 `scripts/inject-geling.cjs` 在 HBuilderX 编译后「注入」产物。

### 导致什么结果
- 忘了跑注入脚本 → geling 页面打不开 / `not found` / `Component is not found: tdesign-miniprogram/xxx`。
- **顺序不能反**：HBuilderX 每次编译会重建 `app.json`，覆盖注入结果。

### 怎么避免（每次改完代码必做）
```
① HBuilderX：运行/发行 → 小程序-微信
        ↓
② 注入：  pnpm geling:inject         （dev）
          pnpm geling:inject:build    （build）
        ↓
③ 微信开发者工具：重新编译/刷新
```
> Claude Code 里可 `/geling-ops` 唤起运维指令包。详见 `docs/geling/README.md`。

---

## 坑 5 🟠：geling 科目白名单三处不对齐

### 是什么坑 / 结果
首页某个运动项跳转 geling，必须 **三处白名单同时包含** 该科目，否则**点了没反应**：
1. `common/sport.js` 的 sport `code`；
2. `pages/home/index.vue` 的 `GELING_SUBJECTS`；
3. geling 分包的 `KNOWN_SUBJECT_IDS`。

### 怎么避免
新增/改动可跳 geling 的运动项时，**三处同步更新**，取交集。曾因白名单漏了 `shuttleRun508`（50×8 往返跑）导致点不动。

---

## 坑 6 🟡：`wx.shareFileMessage` 必须在 TAP 同步栈内

### 是什么坑
转发本地文件给微信好友要用 `wx.shareFileMessage`（uni-app 无封装，须直接 `wx.*` + `// #ifdef MP-WEIXIN`）。它**必须在用户点击事件的同步调用栈内触发**。

### 导致什么结果
调用前一旦有 `await`（尤其 `downloadFile`），TAP gesture 上下文失效，真机报：
```
shareFileMessage:fail can only be invoked by user TAP gesture.
```
→ **100% fail**（每次必挂，非偶发）。曾被误判成 iOS 18.4.1 的 bug。

### 怎么避免
- 点击 handler 里**零 `await`** 直接调 `wx.shareFileMessage`；
- `filePath` 用**持久化的 `savedFilePath`**（导出/进页面时已存好），**绝不现场 `downloadFile`**；
- `fileName` 必须带正确后缀（如 `.xlsx`）；
- 基础库 ≥ 2.16.1；DevTools 模拟器常报 `not support`，**只能真机调**；
- 失败兜底走 `uni.openDocument({showMenu:true})` 让用户手动转发。
- 详见 `docs/gotchas/mp-weixin-share-file-message.md`。

---

## 坑 7 🟡：`onKeyboardHeightChange` 微信开发者工具默认不触发

### 是什么坑
自定义底部弹层 + `<input>` 的键盘避让，标准做法是 `uni.onKeyboardHeightChange` 拿键盘高度，再 `transform: translateY(-height)` 上抬弹层。

### 导致什么结果
**微信开发者工具默认不触发 `onKeyboardHeightChange`**（模拟键盘行为不同），导致工具里 `keyboardHeight` 恒为 0，弹层纹丝不动，键盘完全挡住弹层。开发者以为避让没做，实则真机正常。

### 怎么避免
- **避让逻辑必须加兜底**：input `@focus` 时若短时间内 `onKeyboardHeightChange` 未给高度，按「屏幕高 × 40%」估算上抬；真机拿到真实高度后覆盖估算值。
- input 失焦 / 关闭弹层要主动 `uni.hideKeyboard()` + 清零高度，保证回落。
- 关闭弹层用 `:is-mask-click="false"` 禁止点遮罩误关。
- 参考实现：`packageRecord/detail/components/FixScorePopup.vue`。

---

## 坑 8 🟢：点击触发的网络请求要主动加 loading

### 是什么坑 / 结果
用户点击按钮触发的网络请求，如果不主动 `showLoading`，用户不知道在加载，会重复点击或以为没反应。

### 怎么避免
- 点击 handler 第一行就 `uni.showLoading({ title: '…', mask: true })`（`mask:true` 防连点）；
- 请求结束（成功/失败）`uni.hideLoading()`；
- **先 `hideLoading` 再 `showToast`**（两者共用浮层，不先 hide 会互吞）；
- 下拉刷新自带指示器，不复用此 loading。

---

## 通用避坑原则

1. **dev 正常 ≠ 生产正常**：发行构建会做 async→regenerator、压缩重命名等 transform，凡涉及 `async`/`await`/压缩命名的写法，**必须发行构建回归**。
2. **mp-weixin 的 API 行为以真机为准**：开发者工具对键盘、转发、域名等有模拟差异，工具里不通≠真机不通，反之亦然。
3. **命名避开单字母**：循环变量、临时变量用多字符名，避免与编译器/压缩器内部短名撞车。
4. **改完代码走 HBuilderX 全流程**：本工程无 CLI 编译，改动后需 HBuilderX 编译 → （geling 的话）注入 → 微信工具验证。
