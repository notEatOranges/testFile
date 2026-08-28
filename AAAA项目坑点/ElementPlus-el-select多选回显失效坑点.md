# Element Plus el-select 多选回显失效坑点（value 类型严格匹配）

## 现象
`el-select`（`multiple`）编辑回显时，后端明明返回了已选 id，但下拉框一个都没勾选，且无任何报错。

## 根本原因
Element Plus（Vue3）的 `el-select` 在多选回显匹配时，使用**严格相等 `===`** 比较 `el-option` 的 `:value` 与 `v-model` 数组里的每个元素。**类型不一致（字符串 vs 数字）→ 永不匹配 → 不回显。**

而 Element UI（Vue2）用的是宽松比较 `==`，类型不同也能回显。因此 **Vue2 → Vue3 升级后，原本能正常回显的写法会突然失效**，非常隐蔽。

## 通用规则（红线）
- `el-option` 的 `:value` 类型，必须与回显时 `v-model` 数组元素的类型**严格一致**（都用 `number`，或都用 `string`，严禁混用）。
- RuoYi 等后端返回的 id 数组一般是 `number`，所以 option 的 `:value` **不要**套 `String()` / `.toString()` 等转换。
- 若后端返回的是字符串，反过来在赋值时统一转成字符串（`form.x = res.x`），保持两侧一致。
- 同理 `:label`、单选回显同理；`el-checkbox-group`、`el-radio-group` 也走严格匹配，升级后一并排查。

## 排查步骤
1. 打开编辑弹框，看 Network 里接口返回的 ids 数组，确认元素类型（`number`/`string`）。
2. 看模板里 `el-option` 的 `:value` 绑定表达式，确认其类型。
3. 两侧类型不一致即根因；统一成同一类型即可修复。

## 本项目实例
- 项目：**Tyzxyy-q**（RuoYi-Vue，Vue2→Vue3 升级）
- 文件：`src/views/system/user/index.vue`
- 问题写法：角色 select 的 `:value="String(item.roleId)"`（字符串）与编辑回显赋值 `form.value.roleIds = response.roleIds`（后端返回 number 数组）类型不一致 → 编辑用户时角色不回显。
- 修复：去掉 `String()`，改为 `:value="item.roleId"`，与后端 number 类型一致。
- 反向印证：同文件岗位 select 用 `:value="item.postId"`（number，无 String），本可正常回显。
