# mp-weixin · 底部弹层 safe-area 失效，iPhone 底部内容被 home indicator 挡住坑点

> **项目**：翼动同行（school-parent-mp）—— 校园体育家长端
> **技术栈**：uni-app (Vue 3 `<script setup>`) + uni-popup 底部弹层
> **目标平台**：mp-weixin
> **整理日期**：2026-07-29
> **结论先行**：基于 `uni-popup type="bottom"` 的底部弹层，在 iPhone（无 Home 键机型）真机上**弹层底部内容被底部 home 横条遮挡一部分**。根因是 safe-area 适配走了两条都不靠谱的路径——uni-popup **把自己 CSS 的 `env(safe-area-inset-bottom)` 注释掉了**（[uni-popup.vue:491-494](.claude/...)），只靠 JS 算的 `safeAreaInsets`（`data` 里没声明、非响应式、依赖 `mounted` 时 `getWindowInfo` 时序，偶发为 `undefined`）；业务层 `.cpopup` 写的 CSS `env()` 理论上能兜底，但在 uni-popup 动画层（`position:fixed` + `transform`）这条链路上真机没可靠生效。**根治办法：业务层（CPopup）用 JS 显式取 `safeAreaInsets.bottom` 作内联 `paddingBottom`，并给 uni-popup 传 `:safe-area="false"` 关掉它那条不可控路径避免叠加，CSS `env()` 留作兜底。**

---

## 现象

- relate（关联学生）页点「学校/校区」打开底部选择弹层，iPhone 真机上**弹层最后一项（或确认按钮）被底部 home indicator 横条挡住一部分**，要点很准或滑动才能点到。
- 安卓正常（无 home indicator，`safe-area-inset-bottom` 为 0）。
- 典型的「安卓好的、iPhone 底部被挡」→ 100% 是底部安全区没适配到位。

## 根因（uni-popup 的 safe-area 两条路径都不稳）

`uni-popup type="bottom"` 适配底部安全区的链路：

### 路径 A：uni-popup 自己的 CSS env() —— 被注释了，等于没有
[uni-popup.vue](uni_modules/uni-popup/components/uni-popup/uni-popup.vue) 的 `.uni-popup__wrapper` 样式：
```scss
/* iphonex 等安全区设置，底部安全区适配 */
/* #ifndef APP-NVUE */
// padding-bottom: constant(safe-area-inset-bottom);
// padding-bottom: env(safe-area-inset-bottom);
/* #endif */
```
**CSS 的 `env()` 被注释掉了**，uni-popup 不靠 CSS 适配 safe-area。

### 路径 B：uni-popup 的 JS safeAreaInsets —— 非响应式 + 时序依赖，偶发 undefined
uni-popup 改用 JS 算 safe-area，在 `bottom()` 方法里把它塞进动画层 `transClass`：
```js
// bottom()
this.transClass = {
  position: 'fixed', left: 0, right: 0, bottom: 0,
  paddingBottom: this.safeAreaInsets + 'px',   // ← 应用到 uni-transition 动画层
  ...
}
```
而 `this.safeAreaInsets` 在 `mounted` 里才算：
```js
mounted() {
  const fixSize = () => {
    const { safeArea, screenHeight } = uni.getWindowInfo()   // mp-weixin
    if (safeArea && this.safeArea) {
      this.safeAreaInsets = screenHeight - safeArea.bottom
    } else {
      this.safeAreaInsets = 0
    }
  }
  fixSize()
}
```
问题：
1. **`safeAreaInsets` 没在 `data()` 里声明** → 非响应式属性，赋值行为依赖实例时序；
2. `getWindowInfo()` 在 `mounted` 同步调用，**没有 try-catch**；任何异常 → `safeAreaInsets` 保持 `undefined`；
3. 一旦 `this.safeAreaInsets` 是 `undefined`，`paddingBottom: this.safeAreaInsets + 'px'` = `"undefinedpx"` → **无效 CSS 值，动画层没有底部安全区留白** → 弹层贴到屏幕最底 → 内容被 home 横条挡。

### 路径 C：业务层 CSS env() —— 理论兜底，真机这条链路没可靠生效
本项目 `CPopup` 的 `.cpopup` 写了 `padding: 16rpx 32rpx env(safe-area-inset-bottom);`（wxss 编译产物里 `env()` 确实保留）。理论上路径 B 失效时它能兜底。但 `.cpopup` 处在 `uni-popup → uni-transition（position:fixed + transform 动画）→ .uni-popup__wrapper → slot` 这条链路深处，真机上这条链路的 `env()` 没有可靠兜住（实测被挡）。

> 三条路径，A 被注释、B 偶发 undefined、C 真机没兜住 → iPhone 底部内容被挡。

## 怎么避免（标准修复）

**业务层（公共弹层组件）用 JS 显式取 `safeAreaInsets.bottom` 作内联 `paddingBottom`；关掉 uni-popup 自带 safe-area 避免叠加；CSS `env()` 留作兜底。**

```vue
<template>
  <!-- :safe-area="false" 关掉 uni-popup 自己那条不可控的 JS safe-area，避免与下面内联值叠加 -->
  <uni-popup ref="popup" type="bottom" :safe-area="false">
    <!-- paddingBottom 用 JS 取的安全区高度，真机可靠 -->
    <view class="cpopup" :style="{ paddingBottom: `${safeBottomPx}px` }">
      <slot />
    </view>
  </uni-popup>
</template>

<script setup>
import { ref } from 'vue';

const safeBottomPx = ref(0);
try {
  const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync();
  safeBottomPx.value = (info.safeAreaInsets && info.safeAreaInsets.bottom) || 0;
} catch (e) {
  safeBottomPx.value = 0;
}
</script>

<style lang="scss" scoped>
.cpopup {
  /* env() 留作 CSS 层兜底；被上面的内联 paddingBottom 覆盖（内联优先级更高） */
  padding: 16rpx 32rpx env(safe-area-inset-bottom);
  background: #fff;
}
</style>
```

要点：
- **`:safe-area="false"` 必须加**：否则 uni-popup 的路径 B 仍会往动画层塞 `paddingBottom`，和业务层内联值**叠加**（iPhone 上多留一倍安全区，视觉异常）。
- **内联 `paddingBottom` 优先级高于 CSS**：所以即使 CSS 的 `env()` 真机失效，内联的 JS 值照样顶住。
- **`uni.getWindowInfo()` 在组件创建时同步调用**即可（App 启动后就能拿到正确值）；带 `getSystemInfoSync` 降级 + try-catch 兜底。
- 只在**业务层的弹层内容容器**上设一次 safe-area，不要 uni-popup、业务层各设一次。

## 诊断方法

1. **现象判据**：底部弹层在 iPhone 底部内容被横条挡、安卓正常 → 底部 safe-area 失效。
2. **确认 env() 是否在 wxss**：看编译产物 `unpackage/dist/dev/mp-weixin/<comp>/index.wxss` 有没有 `env(safe-area-inset-bottom)`。有但仍被挡 → 说明 env() 在真机这条链路没生效，得用 JS 显式控制。
3. **确认 uni-popup safeArea 路径**：看 `uni-popup.vue` 的 `.uni-popup__wrapper` 里 `env()` 是否被注释（被注释 = uni-popup 不靠 CSS）；看 `this.safeAreaInsets` 是否在 `data()` 声明（没声明 = 非响应式，偶发 undefined）。
4. 三者对上 → 用上面的「JS 显式 + 关 uni-popup safe-area」方案。

## 本项目实例

- **公共组件**：`components/CPopup/index.vue`（基于 `uni-popup type="bottom"` 的底部弹层外壳）
  - 加 `safeBottomPx`（JS 取 `getWindowInfo().safeAreaInsets.bottom`）→ `.cpopup` 内联 `paddingBottom`
  - `<uni-popup :safe-area="false">` 关掉 uni-popup 自带 safe-area
  - `.cpopup` 的 CSS `env()` 保留作兜底
- **受影响调用方（都随公共组件一起修好）**：
  - `packageMine/relate/components/BindField.vue`（学校/校区选择弹层）← 用户反馈点
  - `pages/home/components/SwitchStudentPopup.vue`（切换孩子弹层）

## 通用建议（守则）

1. **底部弹层 safe-area 不要只靠 CSS `env()`**：在 `position:fixed` + transform 动画层链路里真机偶发失效，务必用 JS `getWindowInfo().safeAreaInsets.bottom` 显式控制。
2. **用 uni-popup 时给它传 `:safe-area="false"`**：它的 JS safe-area 路径（非响应式 + 时序）不稳，自己接管更可控，也避免叠加。
3. **safe-area 只在一处控制**：要么 uni-popup、要么业务层，别两边都设。
4. **「安卓好的、iPhone 底部被挡」是 safe-area 问题的判据**，看到这个现象直接查底部 safe-area 适配。

## 相关

- 项目通用坑点：`测试文件/AAAA项目坑点/体e智慧助手-uni-app微信小程序坑点总结.md`
- 同库另一坑：`测试文件/AAAA项目坑点/mp-weixin-showLoading关掉showToast坑点.md`
- 项目内 gotchas：`docs/gotchas/`
