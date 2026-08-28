# mp-weixin · uni-app 底部弹层嵌在 scroll-view 内，被页面底部固定栏挡住坑点

> **项目**：翼动同行（school-parent-mp）—— uni-app (Vue 3) 微信小程序
> **整理日期**：2026-07-29
> **结论先行**：`CPopup`（`uni-popup type="bottom"`，`position:fixed`）嵌在 `scroll-view` 内时，弹层**盖不住 scroll-view 之外的底部固定栏**（如「确认关联」按钮），最后一项被挡。根因是 scroll-view 成为 fixed 弹层的包含块/层叠上下文边界（fixed 不再相对视口 + z-index 被 scroll-view 圈住，scroll-view 外的后续兄弟固定栏反而盖在弹层之上）。**解法：弹层移出 scroll-view，放页面顶层（scroll-view 之外、与底部固定栏同级），字段组件只 `emit('open')` 触发，弹层 ref 由页面控制**。uni-app 下 `<root-portal>` 透传支持不确定，移到顶层是更稳的做法。

---

## 现象

- 关联学生页点「学校/校区」打开底部选择弹层，**弹层最后一项被页面底部的「确认关联」按钮挡住**。
- iOS / 安卓都可能出现（层叠问题，非机型特有）。
- 同项目的 home 切换孩子弹层（也在底层用 `uni-popup`）**正常**——因为它在页面顶层渲染，不在 scroll-view 内。差异就在弹层 DOM 位置。

## 根因

出问题的结构：
```
CPage
  scroll-view.relate-scroll
    BindField(type=select)
      CPopup(uni-popup fixed)    ← 弹层嵌在 scroll-view 内
  relate-footer(确认关联)        ← scroll-view 之外的后续兄弟
```

`CPopup` 是 `position: fixed; z-index: 99`，本应盖全屏，但嵌在 scroll-view 里：
1. **fixed 包含块退化**：scroll-view 内的 fixed 元素在 mp-weixin 上会相对 scroll-view 定位（不再相对视口），弹层只覆盖 scroll-view 区域，延伸不到 footer。
2. **z-index 被层叠上下文圈住**：scroll-view 形成层叠上下文，弹层 `z-index:99` 只在 scroll-view 内生效；footer 是 scroll-view 的后续兄弟（DOM 在后、在 scroll-view 外），普通流绘制顺序下反而盖住 scroll-view 及其后代（含弹层）。

两种机制同样导致：底部固定栏浮在弹层之上，弹层最后一项被挡。

> 印证：home 的 `SwitchStudentPopup`（CPopup 在页面顶层，不在 scroll-view 内）正常；relate 的 CPopup（在 scroll-view 内）被挡。

## 解法（uni-app：移出 scroll-view）

**字段组件 select 只 `emit('open')`，弹层在页面顶层（scroll-view 外）渲染，ref 控制 open/close。**

字段组件：
```html
<view v-if="type === 'select'" @click="onOpen">...</view>
```
```js
const emit = defineEmits(['open']);
function onOpen() { emit('open'); }
// 移除内嵌 CPopup、sheet、openSelect/onPick
```

页面：
```html
<CPage>
  <scroll-view>
    <BindField type="select" v-model="form.school" :options="schoolOptions" @open="openSchoolSheet" />
  </scroll-view>
  <view class="footer">确认关联</view>

  <!-- 弹层在 scroll-view 外（页面顶层）：fixed 相对视口，盖住 footer -->
  <CPopup ref="schoolSheet" title="学校">
    <view v-for="opt in schoolOptions" :key="opt.value" @click="pickSchool(opt)">...</view>
  </CPopup>
</CPage>
```
```js
const schoolSheet = ref(null);
function openSchoolSheet() { schoolSheet.value?.open(); }
function pickSchool(opt) { form.school = opt.value; schoolSheet.value?.close(); }
```

要点：
- **fixed 全屏弹层放页面根/顶层**，别随字段塞进 scroll-view / overflow 容器 / 带 transform 的容器。
- **多张弹层就顶层多放几个 CPopup**，各自 ref + open/close。
- 原生小程序同类问题用 `<root-portal>` 把弹层「传送」到页面根（见同库 `自定义组件弹出层-root-portal坑点.md`）；uni-app 下 root-portal 透传不确定，**移顶层更稳**。

## 区分两种「弹层被底部挡」（别误判）

- 被 **home indicator 横条**挡 → safe-area 问题（见同库 `mp-weixin-showLoading关掉showToast坑点.md` 同目录的 safe-area 类）。
- 被 **页面底部固定按钮**挡 → 本文 scroll-view 层叠问题。

排查第一步：先确认「挡住弹层的是系统横条还是页面按钮」，二者根因与解法完全不同。

## 本项目实例

- `packageMine/relate/components/BindField.vue`：select 移除内嵌 CPopup，改 `emit('open')`
- `packageMine/relate/index.vue`：顶层挂 2 个 CPopup（学校/校区），ref 控制 open/close

## 相关

- 同库原生小程序版（root-portal 解法）：`自定义组件弹出层-root-portal坑点.md`
- 同库 safe-area 坑（弹层被 home indicator 挡，另一根因）：`mp-weixin-底部弹层安全区失效坑点.md`
- 项目内 gotchas：`docs/gotchas/mp-weixin-popup-in-scrollview.md`
