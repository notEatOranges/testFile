# Element Plus el-descriptions 非 border 模式 label/content 左右布局（strut 顶换行）坑点

## 现象
el-descriptions **非 border** 模式、`:column="2"`，label 和 content 在同一个 `<td>` 里（两个 inline `<span>`）。长 content（如长地址）会换行到 label **下方**（label 只占第一行，content 后续行从 td 最左开始，视觉上"跑到 label 下面"）。需求：label 左、content 右，长 content 在右侧独立换行、不要 border 边框、两列还要平分。

## 踩过都失败的雷
1. **`table-layout: fixed`**：只解决两列均分（auto 按内容分配会左宽右窄），不解决 label/content 上下。
2. **`content { display:inline-block; width:... }` + label 也 inline-block + `vertical-align:top`**：即使 `label宽 + content宽 < td宽`，content 仍被挤到 label 下方——table-cell 内 inline-block 受 line-box 的 strut 影响，会换行。
3. **`td { display:flex }`**：td 改 flex 破坏 table-cell，**td 宽度塌成 0**，整个表崩。
4. **`label { float:left } + content { overflow:hidden }`**：table-cell 对 float 处理异常，td 也塌成 0。
5. **`border` 模式**：能解决（label/content 分成独立 cell），但带网格边框 + label 灰底，用户常不要。

## 正解
给 td 设 `white-space: nowrap` 强制 label/content 同行（消除 strut 换行），content 内部再 `white-space: normal` 让长文本在自己的 inline-block 里换行：
```css
:deep(.el-descriptions__table) { table-layout: fixed; }        /* 两列均分 */
:deep(.el-descriptions__cell) { white-space: nowrap; }          /* 关键：强制同行，避免 strut 顶换行 */
:deep(.my-label) { display: inline-block; width: 120px; vertical-align: top; }
:deep(.el-descriptions__content) {
  display: inline-block;
  width: calc(100% - 130px);     /* 减 label 宽 + 余量 */
  vertical-align: top;
  white-space: normal;           /* content 内部恢复换行 */
  word-break: break-all;
}
```

## 通用规则（红线）
- table-cell 内想让两个 inline 元素左右分列、且右侧长内容独立换行不跑到左侧下面，关键是**父级 `white-space: nowrap`**（防 strut 换行）+ 右侧元素自身 `white-space: normal`。
- **不要**给 table-cell（td）设 `display: flex` 或里面 `float`——会破坏 table 布局，td 宽度塌成 0。
- el-descriptions 长 content 默认会换行到 label 下方（非 border 的 inline 特性）；要左右布局用上述 CSS，或接受 border 模式。
- 排查：`getBoundingClientRect()` 比较 label.right 和 content.left，若 `content.left < label.right` 即 content 在 label 下方/被挤换行。

## 本项目实例
- 项目：**青少年智能培训管理系统 (Qsntypx-q)**（Vue3 + Element Plus）
- 文件：`src/pages/comp-manage/train-manage/components/detail.vue`（培训季管理 - 查看弹框）
- 问题：「活动地点」长地址 content 跑到 label 下方；同时两列左宽右窄。
- 修复：`table-layout: fixed`（两列平分）+ `td { white-space: nowrap }`（label/content 同行）+ label/content `inline-block` + content `white-space: normal; word-break: break-all`（长地址在右侧独立换行）。
- 关联坑点：[[ElementPlus-el-descriptions-插槽放块级元素致label与content上下换行坑点]]（同为 el-descriptions 非 border 布局问题，那个是 content 放块级 div 强制换行，这个是 inline 长内容被 strut 顶换行）。
