# ant-design-vue 1.x Pagination 改 pageSize 不重置页码坑点

## 现象

列表停在第 2 页时，把「每页条数」改大（如 15 → 30），若新分页下第 2 页已不存在，列表变成空白，且分页条也不见了（列表 `v-if="tableData.length"` 时）。用户直觉是：改每页数量应该自动回到第 1 页。

## 根因（ant-design-vue 1.7.x 源码时序）

`vc-pagination` 的 `changePageSize(size)` 内部流程（`node_modules/ant-design-vue/es/vc-pagination/Pagination.js` 约 221-249 行）：

1. 内部计算钳制后的页码（当前页超过新总页数时钳回去），但**不 setState**（因为 `current` 是受控 prop，即 v-model 传入）。
2. 先 `$emit('showSizeChange', current, size)` —— **此刻父组件 v-model 的页码还是旧值**。
3. 若发生钳制，再 `$emit('change.current', current, size)` —— 这是 v-model 事件，只更新父组件数据，**不会再触发 `@change`**。

推论：
- 在 `showSizeChange` 回调里直接发请求，用的是「旧页码 + 新 pageSize」，页码超界就查不到数据。
- 组件事后钳制页码也不会帮你重新请求，页面停在空数据上。

## 通用规则

**在 `showSizeChange`（或任何框架的 pageSize 变更回调）里，必须先把当前页码重置为 1，再发请求。** 不要指望组件的 v-model/受控页码在回调触发时已是新值——事件时序不保证这一点。

```js
// ✅ 正确
showSizeChange (current, size) {
  this.pageSize = size
  this.currPage = 1   // 关键：重置回第 1 页
  this.getListData()
}

// ❌ 错误：旧页码 + 新 pageSize 去请求
showSizeChange (current, size) {
  this.pageSize = size
  this.getListData()  // this.currPage 还是旧页码
}
```

不会引发双重请求：`changePageSize` 只 emit `showSizeChange` 和（钳制时）`change.current`，不 emit `change`，所以重置 `currPage` 不会连带触发页码 change 回调。

## 相关的另一个坑（同组件）

ant-design-vue 1.x 的 a-pagination 内部 `$emit` 的是 **camelCase** 事件名 `showSizeChange`，模板里用 kebab 写法 `@show-size-change` **监听不到**（与 Vue 常规组件事件不同，这里没有做两种写法的兼容）。必须写 `@showSizeChange`，必要时对该行关闭 `vue/v-on-event-hyphenated` lint 规则。

## 本项目实例

- 项目：江苏省体育职称评审申报系统前端（jsty_title_web_frontend，Vue 2 + ant-design-vue 1.7.101）
- 文件：`src/views/declare/index.vue`（`showSizeChange` 方法）
- 修复：2026-08-25，在 `showSizeChange` 中补 `this.currPage = 1`
- 同日排查发现 `src/views/personCenter/myDeclare/index.vue` 两个叠加问题：
  1. 模板写的是 kebab `@show-size-change`，事件根本监听不到 → 切换每页条数**完全无效**（源码确认：a-pagination 包装层 `on: getListeners(this)` 原样透传监听器、不做事件名归一化）。改为 camelCase `@showSizeChange` 修复。
  2. `showSizeChange` 方法同样缺 `currPage = 1` 重置，一并补上。
- 注意：项目自定义 `s-table` 组件（`src/components/Table/index.jsx`，内部用 a-table）不受此坑影响——a-table 的 `handleShowSizeChange` 内部会钳制页码并重新 emit `change`，且有空数据自动退页兜底。
