# chrome-devtools MCP 操作 Element Plus 弹窗组件坑点

## 通用规则

用 chrome-devtools MCP（take_snapshot / click / evaluate_script）自动化操作 Vue3 + Element Plus 页面时，以下三类问题反复出现，写脚本前先看。

### 1. el-dialog append-to-body 关闭后 DOM 残留——querySelectorAll 会误点隐藏弹窗的按钮（最坑）

`append-to-body` 的 `el-dialog` 在 `v-model=false` 关闭后 **DOM 不会销毁**（只是 display:none），仍留在 `<body>` 下。用 `document.querySelectorAll('.el-dialog__footer .el-button')` 找按钮时，会把**历史上打开过的所有弹窗**的按钮都匹配进来，`.find()` 第一个往往属于更早 append 的隐藏弹窗——点击它会在不可见状态下触发完整提交流程（表单校验弹红、甚至提交脏数据）。

```js
// ❌ 会匹配到隐藏弹窗的保存按钮
const save = [...document.querySelectorAll('.el-dialog__footer .el-button')]
  .find(b => b.textContent.trim() === '保存');

// ✅ 必须过滤可见性
const save = [...document.querySelectorAll('.el-dialog__footer .el-button')]
  .filter(b => b.offsetParent !== null)
  .find(b => b.textContent.trim() === '保存');
```

同理适用于 el-select 下拉、el-date-picker 面板、el-message 等一切 popper/teleport 组件：**先 `filter(el => el.offsetParent !== null)` 再取目标**。

### 2. a11y 快照里"看得见但点不动"的元素——改用 evaluate_script 点 DOM

- `el-transfer` 的 checkbox：快照里有 uid，但 MCP `click` 报 "did not become interactive"。
- `el-select` 展开后：快照 listbox 是空壳，选项（`.el-select-dropdown__item`）不在 a11y 树里。
- `el-date-picker` 的日历格：类名随月份切换，直接按 class 找不到。

统一解法：用 `evaluate_script` 直接 `.click()` 真实 DOM（`.el-checkbox`、`.el-select-dropdown__item`、`.el-date-table td.available`、`.el-year-table td .cell`），配合第 1 条的可见性过滤。

### 3. take_screenshot 返回外链 URL——模型根本看不到图

某些环境下截图结果是 `{ type: "image", source: { type: "url", url: "https://..." } }` 而非内联图片，模型无法读取像素内容。验证码识别、看图断言都不可行。
替代手段：用 `take_snapshot`（a11y 文本树）做断言；需要读图片内容时把图存文件后用文件读取工具按图像打开。

## 本项目实例

- 项目：maoming-backend-q（pbsf 框架）
- 场景：2026-08-26 验证 sportsEventManage 综合赛事管理页面时，脚本点"保存"误中了已关闭的 addDialog 的保存按钮，弹出一个带红色校验错误的空"新建赛事"弹窗，设置项目弹窗的保存则没点中。按第 1 条加 `offsetParent` 过滤后解决。
