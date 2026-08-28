# Element Plus 相邻 el-button 自动 margin-left → circle 图标按钮在窄容器重叠 坑点

## 现象
表格行/列表项里放两个 `el-button circle :icon`（如 +/- 增删按钮），用一个固定宽度的 div 包裹（如 `width:56px`）。结果两个圆形按钮**重叠/挤压变形**，而非并排。

## 根本原因
Element Plus 全局样式：`.el-button + .el-button { margin-left: 12px }`——相邻 el-button 自动加 12px 左间距。
两个 24px(small) circle 按钮 + 12px = 60px。若包裹 div 固定宽 < 60px（如 56px，还可能被外层 flex 压到更小），装不下，两个按钮 inline 排列时第二个被挤、与第一个重叠（测量表现为 `btn2.left < btn1.right`）。

叠加陷阱：用 `style="padding:4px"` 缩小 circle 按钮是非标准写法，反而可能让按钮撑成 default(32px)，更装不下。正确缩小方式是 `size="small"`。

## 通用规则（红线）
- 多个 el-button 放固定宽容器前，算总宽：`按钮数 × 按钮宽 + (按钮数−1) × 12px`，容器宽必须 ≥ 此值。
- circle 图标按钮用 `size="small"`（24px）控制大小，**不要用** `style="padding:4px"`。
- 若要紧凑自定义间距，给包裹 div `display:flex; gap:8px`，并覆盖 `.el-button + .el-button { margin-left: 0 }`，用 gap 统一间距。
- 排查：`getBoundingClientRect()` 比较相邻按钮的 `right` 与下一个的 `left`，若 `next.left < prev.right` 即重叠。

## 修复模板
```html
<!-- 容器宽度 ≥ 按钮总宽(60px)；或直接去掉固定 width 自适应 -->
<div style="width: 66px; margin-left: 10px">
  <el-button :icon="Minus" circle size="small" />
  <el-button :icon="Plus" circle size="small" />
</div>
```

## 本项目实例
- 项目：**青少年智能培训管理系统 (Qsntypx-q)**（Vue3 + Element Plus）
- 文件：`src/pages/comp-manage/project-manage/components/site.vue`
- 位置：「设置培训点」弹框 → 表格「教学负责人和电话」列里的 +/- circle 按钮。
- 问题：包裹 div 原 `width:56px`；两按钮 + EP 自动 12px 间距 = 60px 重叠；且 `style="padding:4px"` 让按钮变 32px(default) 更装不下，视觉「变形/丑」。
- 修复：按钮改 `size="small"`（24px 正圆）；包裹 div `width` 放大到 `66px`。两按钮并排不重叠。
- 关联坑点：[[ElementPlus-el-descriptions-插槽放块级元素致label与content上下换行坑点]]（同项目另一处 Element Plus 布局细节）。
