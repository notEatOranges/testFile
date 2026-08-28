# mp-weixin input 键盘 adjust-position 整页上推顶走导航栏坑点

## 现象
表单页 input 聚焦弹起键盘时，**顶部自定义导航栏被整体顶出视口顶部消失**，导航栏背景一块空白。底部 tabbar / 固定栏同理会被顶走。用户感受是「键盘一弹，头没了」。

## 根因
mp-weixin 的 `<input>` 默认 `adjust-position=true`。键盘弹起时，**微信在 webview 层面对整个 page 做 transform 上推**（上推量 = 键盘高度 − 输入框到屏幕底的距离），目的是让输入框露在键盘上方。

这个上推作用在 **page 根** 上，流式布局里的一切（导航栏、插图、固定底栏、背景图）都跟着上移；即使导航栏 `position:fixed`，page 层 transform 也会带着 fixed 一起走（fixed 包含块在 transform 下退化），**fixed 也救不了**。

## 解决（页面场景：adjust-position=false + JS 滚动避让）

### 1. input 设 `:adjust-position="false"`
关掉微信原生整页上推，顶部导航栏/背景图纹丝不动。**但这会牺牲原生自动避让**（input 不再自动露到键盘上方），需自己补 ↓。

### 2. JS 滚动 scroll-view 把 input 滚到键盘上方
- 监听 `uni.onKeyboardHeightChange` 取键盘高度（具名捕获 + 存 cb + `onUnload` 解绑）。
- input `@focus` → `createSelectorQuery().select('#fieldId').boundingClientRect()` 查字段 bottom，算增量让 input 露到 `windowHeight - kbdHeight - 余量` 之上。
- scroll-view `:scroll-top` 绑响应式值驱动（**非 `scroll-into-view`**——滚到顶卡片上蹿）；`@scroll` 同步防过期；同值不滚用 `+0.1` trick。
- scroll-view 内容 `paddingBottom` 联动键盘高度——否则卡片 `min-height:100%` 撑满视口、input 滚不上来。
- 键盘收起 → scrollTop 归 0。

### 兼容
- **微信开发者工具**默认不触发 `onKeyboardHeightChange`，`@focus` 起 300ms 兜底定时器按 `windowHeight×0.4` 估算，真机回调覆盖。
- **iOS**：返回值含键盘实际高度，算法留 20px 余量。
- **input 间切换**：键盘未收 kbdCb 不 fire，`@focus` 里若 kbdHeight>0 直接重滚。

## 被实践否决的方案

| 方案 | 否决理由 |
|---|---|
| `adjust-position=true`（默认） | 根因，顶部被推走 |
| `:scroll-into-view` + `paddingBottom` | 字段滚到顶（卡片大幅上蹿）、paddingBottom 跳动 |
| 整体 `translateY` 平移内容区 | 页面场景不自然，且需改全局导航栏提层 |
| 纯 `adjust-position=false` 不避让 | input 不会自动避让、只能手动滑，体验差 |

## 本项目实例
- 项目：翼动同行（school-parent-mp，uni-app Vue3 / mp-weixin / HBuilderX 工程）
- 页面：`packageMine/relate/index.vue`（关联学生信息：学校/校区 select + 姓名/学号 input）
- 最终方案（已落地）：`adjust-position=false` + JS 滚动避让。`BindField.vue` input 加 `:adjust-position=false`、`@focus` emit、`fieldId` + 根 `:id`；`relate/index.vue` 监听 `onKeyboardHeightChange` + `createSelectorQuery` 定位 + scroll-view `:scroll-top` 精确滚动 + `paddingBottom` 联动 + 工具兜底。键盘监听抄 `packageConsult/chat/index.vue`，元素定位抄 `components/CSelect/index.vue`。
- 演进：先后试过「整体 translateY（useKeyboardLift）」→ 不自然否决；「scroll-into-view+paddingBottom」→ 卡片上蹿跳动否决；「纯 adjust-position=false 不避让」→ input 够不着否决；最终定「adjust-position=false + scroll-top 精确滚动」。相关 `hooks/useKeyboardLift.js` 及 skill 已删（被 translateY 方案牵连，无业务引用）。

## 诊断
- 「键盘弹起导航栏/底栏消失」→ 八成 input `adjust-position` 默认 true 的整页上推；加 `:adjust-position="false"` 若导航栏不再被顶即确诊。
- 真机键盘行为与微信开发者工具有差异，**以真机为准**。
