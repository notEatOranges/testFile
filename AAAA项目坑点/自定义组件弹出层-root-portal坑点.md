# 自定义组件弹出层 root-portal 坑点

> **项目**：江苏体育（jsty-mp）—— 原生微信小程序
> **触发提交**：`77ae8a6e` `fix: 弹出层兼容性问题`（2026-07-01）
> **涉及组件**：[packageMatch/yssCommon/components/area-picker/area-picker.wxml](../../../Documents/oneSport/AAAAA-jiangsu-YFY/jsty-mp/packageMatch/yssCommon/components/area-picker/area-picker.wxml) / [month-picker.wxml](../../../Documents/oneSport/AAAAA-jiangsu-YFY/jsty-mp/packageMatch/yssCommon/components/month-picker/month-picker.wxml) / [single-picker.wxml](../../../Documents/oneSport/AAAAA-jiangsu-YFY/jsty-mp/packageMatch/yssCommon/components/single-picker/single-picker.wxml)
> **整理日期**：2026-07-24
> **结论先行**：弹出层（`picker-mask` + `picker-container`）原本作为自定义组件的子节点直接渲染，会受**父级层叠上下文 / `overflow` 裁剪**牵连——遮罩罩不住、层级被压、或被父容器裁掉、或被祖先 `transform` 干扰 fixed 定位。把整个弹出层用 `<root-portal>` "传送"到页面根节点渲染，即可彻底脱离祖先的层叠与裁剪限制。这是这次三个 picker 组件统一改动的内容。

---

## 坑点总览

| # | 坑点 | 类型 | 现象 |
|---|---|---|---|
| 1 | 弹层被父级 `overflow: hidden` 裁剪 | 渲染边界 | 弹层只露一截 / 滚动列表被切断 |
| 2 | 弹层 z-index 不生效 / 被压层级 | 层叠上下文 | 遮罩罩不住、容器被页面其它元素盖住 |
| 3 | 祖先 `transform`/`filter` → fixed 退化 | CSS 包含块 | 弹层定位跑偏、不再相对视口 |
| 4 | mask 与 container 两个 wx:if 分开写 | 状态/渲染 | 显隐时机错位、闪烁、遮罩"先到后走" |

---

## 改动核心（一行看懂）

把弹出层的两兄弟节点（遮罩 + 容器）整体塞进 `<root-portal>`，让它们脱离自定义组件的渲染树，挂到页面根部渲染：

```diff
-  <view class="picker-mask" wx:if="{{showPicker}}" bindtap="cancel"></view>
-  <view class="picker-container {{animationClass}}" wx:if="{{isPickerVisible}}" catch:touchmove="preventScroll">
-    ...
-  </view>
+  <root-portal wx:if="{{showPicker}}">
+    <view class="picker-mask" bindtap="cancel"></view>
+    <view class="picker-container {{animationClass}}" wx:if="{{isPickerVisible}}" catch:touchmove="preventScroll">
+      ...
+    </view>
+  </root-portal>
```

要点：
- `wx:if="{{showPicker}}"` 上移到 `<root-portal>` 上，**显隐入口统一**；容器内部仍保留 `wx:if="{{isPickerVisible}}"` 用来做入场动画的时序。
- `root-portal` 一旦挂载，里面的 mask/container 就脱离组件树，组件祖先的任何 `overflow` / `z-index` / `transform` 都管不到它。

---

## 坑 1 🔴：弹层被父级 `overflow: hidden` 裁剪

### 现象
picker 放在某个滚动的卡片 / 带圆角裁切的容器里时，弹出层只露出一截、或滚动列表（`scroll-view` / `picker-view`）被切断，遮罩也盖不满全屏。

### 根因
自定义组件虽然样式有隔离，但**渲染位置仍嵌在父 DOM 树里**。任一祖先设了 `overflow: hidden|auto|scroll` 或 `clip-path`，绝对/固定定位的后代若超界就会被裁掉。组件里 fixed 元素并不能跳出祖先的 `overflow`（这点和浏览器一致）。

### 影响（本项目）
area-picker / month-picker / single-picker 被嵌进表单页的滚动容器时，弹层和遮罩可能被卡片裁切，表现为"弹层像被框住"。

### 规避（本项目已做）
- 用 `<root-portal>` 把弹层传送到页面根，**物理上脱离祖先的 `overflow`**，这是最干净的解法。
- 不要靠给祖先去掉 `overflow` 来"修"——会破坏页面布局。

---

## 坑 2 🔴：弹层 z-index 不生效 / 被压层级（层叠上下文）

### 现象
明明 `picker-mask` / `picker-container` 的 `z-index` 很高，但遮罩罩不住页面上的 header、tab、或其它组件；甚至同一页面多个弹层互相打架。

### 根因
`z-index` 只在**同一个层叠上下文**里比较。自定义组件若被某个创建了新层叠上下文的祖先包住（`position: relative` + `z-index`、`opacity < 1`、`transform`、`filter`、`will-change` 等都会创建），组件内弹层的 `z-index: 9999` 也只能在那个祖先的"框"里比，照样会被框外的元素盖住。

### 影响（本项目）
弹层在某些页面里盖不住顶部 header / 自定义导航栏，或被同级兄弟组件压住。

### 规避（本项目已做）
- `<root-portal>` 把弹层挂到页面真正的根部，**新建一个与所有业务节点平级的层叠上下文**，`z-index` 重新全局生效。
- 这是比"无脑调大 z-index"更根本的修法。

---

## 坑 3 🟠：祖先 `transform`/`filter` → fixed 退化（包含块陷阱）

### 现象
弹层定位跑偏：不再相对屏幕视口，而是相对某个祖先；页面滚动时跟着滚，或整体错位。

### 根因
按 CSS 包含块规范，`position: fixed` 默认相对视口；但**任一祖先有 `transform` / `filter` / `perspective` / `will-change: transform` 时，包含块会变成那个祖先**，fixed 退化成"相对该祖先"。原生小程序里很多入场动画、吸顶吸底效果都用 `transform`，极易把弹层包进去。

> 与本目录 [iOS-fixed定位兼容性坑点.md](iOS-fixed定位兼容性坑点.md) 的"坑 2"是同一条 CSS 规范，只是这里是小程序场景、解法用 `root-portal`。

### 影响（本项目）
picker 所在页面若做了 `transform` 动画 / 容器位移，弹层可能整体偏移。

### 规避（本项目已做）
- `<root-portal>` 让弹层脱离任何带 `transform` 的祖先，包含块回到视口，定位恢复正常。
- 排查口诀：fixed 元素定位异常，先沿祖先链查 `transform`/`filter`。

---

## 坑 4 🟡：mask 与 container 用两个独立 wx:if → 显隐错位 / 闪烁

### 现象
遮罩和容器分别 `wx:if` 控制，容易出现"遮罩先出现、容器后滑入"或"容器先收起、遮罩还亮着"的错位/闪烁；某些机型上还会因为两者渲染时机不同步导致一帧穿帮。

### 根因
两个平级 `wx:if` 各自独立判断，渲染时机由各自数据驱动；`showPicker`（遮罩）和 `isPickerVisible`（容器）通常用一前一后的延时来配合入场动画，分开写很容易让时序耦合到模板里、难维护。

### 规避（本项目已做）
- 把 `<root-portal wx:if="{{showPicker}}">` 作为**统一显隐入口**：portal 整体挂载/卸载由 `showPicker` 决定。
- 容器内部再保留 `wx:if="{{isPickerVisible}}"` 仅服务于滑入/滑出动画时序。
- 这样"传送"和"动画"职责分离：portal 管脱离祖先 + 整体显隐，container 管动画。

---

## 通用建议（本项目开发守则）

1. **自定义组件里的弹层（mask + 容器）一律用 `<root-portal>` 包裹**：从根上避免祖先 `overflow` 裁剪、z-index 压层级、`transform` 退化定位三类问题。这是 packageMatch 下三个 picker 的统一做法，新弹层照搬。
2. **显隐入口统一在 `<root-portal>` 的 `wx:if`**；容器内部若需做入场动画，再用第二个 `wx:if` 控制时序。
3. **`root-portal` 内的事件正常工作**：`bindtap`/`catch:touchmove` 等照常写，传送不影响事件绑定（`preventScroll` 阻断背景滚动仍然有效）。
4. **不要无脑调大 z-index** 来"修"层级问题——多半是层叠上下文被祖先限制，调再大也没用，根治是 `root-portal`。
5. **真机回归**：开发者工具对层叠上下文 / `overflow` 裁剪的渲染与真机有差异，弹层一定要真机（含 iOS）验证。

---

## 相关
- 同类坑点（CSS 规范层面，uni-app/iOS 场景）：[iOS-fixed定位兼容性坑点.md](iOS-fixed定位兼容性坑点.md)
- 改动提交：`77ae8a6e1c6ace104844d6ed0b63f55bfa26e32c` `fix: 弹出层兼容性问题`
- 官方文档：`<root-portal>` 微信开放文档（基础库 2.25.0+，低版本需确认兼容）
