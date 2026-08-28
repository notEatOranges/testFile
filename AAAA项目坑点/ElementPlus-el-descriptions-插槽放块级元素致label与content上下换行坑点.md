# Element Plus el-descriptions content 插槽放块级元素 → label 与 content 上下换行 坑点

## 现象
el-descriptions / el-descriptions-item 在默认（非 border）模式下，某一项的 content 插槽里放了块级元素（`<div>`、`<el-image>` 容器、根为 div 的自定义组件等），该行的 label 和 content **没有左右同行**，而是 label 在上、content 换到下一行。其它项（content 是纯文本）则正常左右同行。

## 根本原因
Element Plus el-descriptions（非 border 模式）每个 item 渲染成一个 `<td>`，内部是两个 inline `<span>`：
```html
<td class="el-descriptions__cell" [colspan]>
  <span class="el-descriptions__label">标签：</span>
  <span class="el-descriptions__content">...插槽...</span>
</td>
```
label 与 content 是兄弟 inline span，默认左右同行。但 content span 内若插入**块级元素**（div 等），块级元素强制换行，把自身顶到 label 下方，视觉上 label/content 变成上下。content 是纯文本/inline 元素时不受影响。

## 通用规则（红线）
- el-descriptions-item 的 content 插槽里**不要直接放块级元素**（div、`display:block/flex` 的组件）。需要复杂结构时，给根元素用 `display: inline-flex` / `inline-block` 让它 inline 化，label 才会和它同行。
- 需要 flex 布局的自定义 content，用 `display: inline-flex`（保留 flex 能力 + inline 级），并加 `vertical-align: middle/top` 与 label 文字对齐。
- 排查看 DOM：cell 内是 `<span class="el-descriptions__label">` + `<span class="el-descriptions__content">`，若 content span 第一个子元素是 div/block，即此坑。

## 修复模板
```css
/* content 插槽根元素：flex → inline-flex，避免强制换行 */
.rest {
  display: inline-flex;       /* 原来是 display: flex（块级，会换行） */
  vertical-align: middle;     /* 与 label 文字垂直对齐 */
  width: 500px;
}
```

## 排查步骤
1. 看 DOM：el-descriptions cell 内 label/content 是否两个 inline span；content span 第一个子元素是否块级。
2. 对比正常 item（content 纯文本同行）与异常 item（content 是组件/div 上下换行）。
3. 把异常 content 根元素 `display` 改 `inline-flex`/`inline-block`，比较 label 与 content 的 `getBoundingClientRect().top` 是否一致（同行）。

## 本项目实例
- 项目：**青少年智能培训管理系统 (Qsntypx-q)**（Vue3 + Element Plus）
- 文件：`src/pages/comp-manage/course-manage/components/dialog.detail.vue`
- 现象：「课程查看」弹框里「备注」一项，label「备注：」和内容上下排列（label 一行、内容下一行），而非期望的左右同行。
- 根因：备注 content 插槽放了 `<div class="rest">`（`display:flex`，块级），在 inline 的 content span 内强制换行。同弹框「活动类型」等 content 是纯文本，正常同行。
- 修复：`.rest` 从 `display: flex` 改 `display: inline-flex` + `vertical-align: middle`，label 与内容即同行。
- 关联：同弹框「课程图片」content 是 `el-image`（inline-block），label 与图片垂直对齐靠 el-image 自身 `vertical-align`（默认 `baseline` 偏位，需显式设 `middle`）。
- 关联坑点：[[前端表单-展开提交多传字段污染DTO须白名单对齐坑点]]（同项目的另一处 Element Plus / Vue 细节）。
