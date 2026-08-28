# Element Plus el-input 长度限制写成 max-length 不生效坑点

## 现象
`el-input` 上写 `max-length="20"`，期望限 20 字，实际输入框完全不限长、控制台无任何警告；同文件另一处写 `maxlength="200"` 的却一切正常。

## 根本原因
Element Plus 的 `el-input` 长度限制 prop 是**全小写 `maxlength`**（接受 string / number）。

Vue 运行时会把模板里的 kebab-case 属性 camelize（`max-length` → `maxLength`）再去匹配组件声明的 props；而组件声明的是 `maxlength`（不含大写字母），`maxLength !== maxlength` 匹配不上 → 该属性被当作未声明 attr 透传到原生 `<input>` 上，变成 `max-length="20"` 属性。HTML 原生属性名是 `maxlength`，浏览器不认 `max-length` → 无任何效果。

kebab-case 写法只适用于**声明为 camelCase 的 prop**（如 `show-word-limit` 对应 `showWordLimit`）；对全小写的 prop 不能想当然加连字符。

## 通用规则（红线）
- `el-input` 限制长度必须写 `maxlength="20"` 或 `:maxlength="20"`，**严禁写成 `max-length`**。
- 判断方法：查组件文档里的 prop 原名。全小写 prop（`maxlength` 等）原样写；camelCase prop（`showWordLimit` 等）才可写 kebab-case。
- `maxlength` 只拦"用户敲入/粘贴"，**不拦程序赋值与后端回显**（textarea value 程序设超长不截断）。需要严格限制时，表单 rules 里同时加 `{ max: N }` 校验兜底。
- 排查存量代码：`grep -rn "max-length" src/ packages/`。

## 排查步骤
1. 在输入框里粘贴超限文本，看是否被截断。
2. DevTools 选中该原生 `<input>` 元素，看 Elements 面板：出现 `max-length` 属性（带连字符）即中招；正常时应只有 `maxlength`。

## 本项目实例
- 项目：**hb-rsrc-frontend**（湖北体育人事，Vue3 + Element Plus 2.13）
- 文件：`packages/app-hbrs/views/smsReminder/smsSettings/edit.vue`
- 问题写法：`max-length="20"`（推送主题 L37、推送单位 L111），两个输入框实际无长度限制。
- 同文件 `maxlength="200"`（推送内容 L90）写法正确，可作对照。
- 修复：改为 `maxlength="20"`，并在 rules 中给对应字段补 `{ max }` 校验。
