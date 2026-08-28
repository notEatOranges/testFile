# Vue3 迁移坑点：buttonAuth（按钮权限码）迁移后未填充 → 全站按钮被权限过滤光

## 现象（静默失效）
列表页顶部操作按钮（新增/删除/导出等）**整组不显示**，且：
- 控制台零报错
- 不崩页，表格/搜索栏正常
- 肉眼看像「没权限」或「组件没渲染」，实际是 **ButtonWrap 的权限过滤把所有按钮过滤掉了**

## 根因（迁移遗漏，非业务问题）
ButtonWrap（按钮权限组件）在 `checkAuth=true` 时按：
```js
store.buttonAuth.includes(item.code)   // item.code 如 'ADD'/'EXPORT'/'VIEW'
```
过滤按钮。而 Vue2→Vue3 迁移时，登录链路只给 store 写了 `authority/deptInfo/token/dictData`，**漏了把 authority 树里的 buttonCode 递归提取写入 `store.buttonAuth`**。

结果：`store.buttonAuth` 永远是初始空数组 `[]` → `[].includes('ADD')` 恒 false → 所有 `checkAuth !== false` 的按钮全被过滤 → 页面 0 个按钮。

Pinia 持久化 `pick` 列表若也不含 `buttonAuth`，刷新后即使临时填过也会丢。

## 怎么排查（直接读 Pinia 运行时值）
浏览器控制台：
```js
const app = document.querySelector('#app').__vue_app__
const store = app.config.globalProperties.$pinia._s.get('user')
store.buttonAuth        // [] 即中招
store.authority         // 树里有 buttonCode 字段（resourceType="2" 的节点）却没被提取
```
页面 DOM：`document.querySelectorAll('.button-wrap .el-button').length` 为 0。

## 修复方向（恢复等价，非新增逻辑）
补一步：登录成功后（或路由守卫恢复 authority 后），递归遍历 authority 树，收集所有节点的 `buttonCode`（去空），写入 `store.buttonAuth`。
- 必须与原 Vue2 框架的提取逻辑**逐行等价**（原框架大概率在 Vuex action 或登录后做这一步），动手前先核对原框架源码 / 参考项目同框架实现。
- 别忘了把 `buttonAuth` 加入 Pinia persist 的 `pick`（否则刷新丢失，又掉回空）。

## 本项目实例
- 项目：Qzsshd-q，分支 feature/vue3-upgrade
- 文件：`src/components/ButtonWrap/index.vue`（过滤逻辑 :78-87）、`src/pages/login/index.vue`（登录写 store，漏 buttonAuth）、`src/stores/user.js`（buttonAuth 定义在 :18，但持久化 pick :116 不含它）
- 现象：综合赛事页 `<button-wrap>` 的「新增赛事」按钮(code:'ADD')不显示，`renderedBtnCount===0`。
- 运行时佐证：`store.buttonAuth === []`，而 authority 树 children 里确有 `buttonCode:'EXPORT'/'VIEW'` 等节点，只是没被提取。
