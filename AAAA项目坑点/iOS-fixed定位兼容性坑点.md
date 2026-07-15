# iOS 上 position:fixed 的兼容性坑点

> **项目**：体e智慧助手（tezhzs-mp）—— uni-app (Vue 3) 微信小程序
> **运行环境**：iOS 上微信小程序跑在 **WKWebView**（非原生），Safari/Webkit 内核
> **整理日期**：2026-07-15
> **结论先行**：是，iOS（WKWebView）的 `position: fixed` 确实有几个经典坑，最容易踩且和本项目强相关的两条是——**① 软键盘弹起时 iOS 不缩小视口，fixed 底部被键盘整个挡住；② 祖先元素带 `transform` 会让 fixed 退化成 absolute**。常表现为「Android 正常、iOS 异常」。

---

## 坑点总览

| # | 坑点 | 类型 | iOS vs Android |
|---|---|---|---|
| 1 | 键盘弹起时 fixed 底部被遮挡 | 平台行为差异 | **iOS 中招，Android 不中招** |
| 2 | 祖先有 transform → fixed 退化成 absolute | CSS 规范（非 bug，但易踩） | 两端都中招，iOS 严格执行 |
| 3 | 刘海 / Home Indicator 遮挡 fixed 顶/底 | 安全区适配 | 仅 iOS 刘海机型 |
| 4 | 键盘动画期间 fixed 抖动/重绘滞后 | WebKit 渲染 | iOS 更明显 |
| 5 | fixed 弹层滚动穿透到背景 | WebKit 滚动 | iOS 常见 |

---

## 坑 1 🔴：键盘弹起时 iOS 不缩小视口 → fixed 底部被键盘遮挡

### 现象
- 底部 `position: fixed` 的元素（弹层、底部操作栏），iOS 上软键盘弹起时**仍贴屏幕底部**，被键盘完全挡住。
- **同样的代码 Android 上正常**：Android 键盘弹起会缩小视口，fixed bottom 自动浮到键盘上方。

### 根因（平台行为差异，非"bug"但最坑）
iOS 的 WKWebView 键盘弹起时只缩小 **visual viewport**，**layout viewport 高度不变**；而 `position: fixed` 是相对 layout viewport 定位的，所以键盘弹起 fixed 元素纹丝不动。Android 缩小的是 layout viewport，所以 fixed bottom 自动上移。

### 影响（本项目）
含 `<input>` 的底部弹层（如修正成绩弹层 `FixScorePopup`），iOS 上键盘弹起会把输入框和「确认修正」按钮整个挡住。

### 规避（本项目已做）
- 监听 `uni.onKeyboardHeightChange` 拿到键盘高度，手动 `transform: translateY(-height)` 上抬弹层。
- input 设 `:adjust-position="false"`（微信对 fixed 弹层的自动避让本就无效，关掉避免干扰）。
- 已封装为 composable：[hooks/useKeyboardLift.js](../../../Documents/oneSport/AAA-xiaoyuan-YFY/tezhzs-mp/hooks/useKeyboardLift.js)，含微信开发者工具不触发的 40% 屏高兜底。
- 详见 skill：`/use-keyboard-lift`。

> 注：`uni.onKeyboardHeightChange` 在微信开发者工具默认不触发（真机可靠），所以避让逻辑必须带兜底，否则工具里调试会误以为没生效。

---

## 坑 2 🔴：祖先元素有 transform/filter/perspective → fixed 退化成 absolute

### 现象
fixed 元素「跑偏」——不再相对屏幕视口，而是相对某个祖先定位；页面滚动时跟着滚，或位置整体错位。

### 根因（CSS 规范，不是 bug）
按 CSS Containing Block 规范：`position: fixed` 的包含块默认是**视口**；**但当任一祖先元素设置了 `transform` / `filter` / `perspective` / `will-change: transform` 等属性时，包含块会变成那个祖先**，fixed 就退化成「相对该祖先」的定位（行为类似 absolute）。WebKit（iOS）严格遵守这条，最容易让人误以为是 bug。

### 影响（本项目）
- `uni-popup` 内部用 `uni-transition` 做 `transform` 入场动画。如果在带 transform 的容器里再放 `position: fixed` 元素，iOS 上会定位错乱。
- 本项目给弹层内容 `.fix` 加 `transform: translateY(...)` 做键盘上抬——**注意：上抬用的是弹层内容自身的 transform，不是把 fixed 放进 transform 祖先**，所以不触发此坑。但要避免在弹层内再嵌 fixed 子元素。

### 规避
- `fixed` 元素**直接挂在页面/body 根**，不要嵌在带 `transform`/`filter`/`perspective` 的祖先里。
- 弹层动画用 `transform` 可以，但别让 fixed 元素成为它的后代。
- 排查：fixed 元素定位异常时，沿祖先链查有没有 `transform`。

---

## 坑 3 🟠：刘海 / Home Indicator 遮挡 fixed 顶/底

### 现象
- fixed 顶部元素被状态栏/刘海盖住；
- fixed 底部元素被底部 Home Indicator 横条盖住。

### 根因
iOS 刘海屏/全面屏有安全区（safe area），fixed 元素贴边时没留安全区就会被系统 UI 遮挡。

### 规避（本项目已做）
- 顶部：按 `statusBarHeight`（`sysStore.headerState`）下推，`CHeader` / 自定义 header 都用这个。
- 底部：`padding-bottom: env(safe-area-inset-bottom)`，如 `action-bar`、弹层 footer：
  ```scss
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  ```
- HBuilderX/微信开发者工具不会模拟安全区，**必须真机（刘海机）验证**。

---

## 坑 4 🟡：键盘弹起/收起瞬间 fixed 元素抖动

### 现象
iOS 上键盘动画期间，fixed 弹层出现「先掉下去再上来」或闪烁的视觉抖动；Android 一般平滑。

### 根因
iOS WKWebView 的键盘动画与 fixed 元素重绘不同步（渲染滞后）。

### 规避
- 上抬用 **`transform`**（走 GPU 合成层）而不是 `top`/`bottom`/`margin`。
- 给上抬加 `transition: transform 0.25s ease` 平滑过渡。
- 避免在键盘动画期间频繁改 fixed 元素的其它样式。
- 本项目 `useKeyboardLift` 即用 `transform` + transition，符合此规避。

---

## 坑 5 🟡：fixed 弹层内滚动 → 滚动穿透到背景

### 现象
iOS 上 fixed 弹层（尤其内部含 `scroll-view`）打开时，在弹层内滑动，背景页面跟着滚动（滚动穿透）。

### 根因
iOS WKWebView 的 touch 滚动穿透，fixed 容器未阻断触摸事件时，滚动会传到下层。

### 规避
- 弹层遮罩/容器加 `@touchmove.stop.prevent`（或 `catchtouchmove`）阻断背景滚动。
- H5 端可设 `body { overflow: hidden }`（uni-popup 源码在 H5 已这么做）。
- 微信小程序用 `catchtouchmove` 更稳。

---

## 通用建议（本项目开发守则）

1. **含 input 的底部弹层**：一律用 [hooks/useKeyboardLift.js](../../../Documents/oneSport/AAA-xiaoyuan-YFY/tezhzs-mp/hooks/useKeyboardLift.js)，不要手写避让；input 设 `:adjust-position="false"`。
2. **fixed 元素**：挂在页面根，远离 `transform`/`filter` 祖先。
3. **fixed 底部**：留 `env(safe-area-inset-bottom)`；顶部按 `statusBarHeight`。
4. **上抬/位移动画**：用 `transform` + `transition`，不用 `top/bottom`。
5. **iOS/Android 都要真机回归**：开发者工具既不触发键盘高度、也不模拟安全区，工具正常≠真机正常。

---

## 相关
- 键盘避让 composable 用法：skill `/use-keyboard-lift`
- 项目通用坑点：`测试文件/AAAA项目坑点/体e智慧助手-uni-app微信小程序坑点总结.md`
- 项目内 gotchas：`docs/gotchas/`
