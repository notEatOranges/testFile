# Element Plus 菜单组件名坑点：el-submenu → el-sub-menu（连字符）

## 现象（静默失效，极坑）
Vue2 + Element UI 的 `<el-submenu>`，迁移到 Vue3 + Element Plus 后，**菜单项整组消失**，且：
- **不报错**（Vue3 只在 dev 打一条 `Failed to resolve component: el-submenu` 的 warn，极易被忽略或被 console 配置吞掉）
- 不崩页，页面其他部分正常
- 肉眼看像「权限不对/数据没回来/只有首页」，实际是**组件名没解析**

## 根因
Element UI (Vue2) 组件名 `ElSubmenu`，模板 kebab 写法 `<el-submenu>`（无连字符）。
Element Plus (Vue3) 组件名 `ElSubMenu`，模板 kebab 写法 **`<el-sub-menu>`（中间有连字符）**。
`<el-submenu>` 在 EP3 里**不是已注册组件** → Vue3 当未知自定义元素渲染成空壳 `<el-submenu></el-submenu>`，其 `#title` 插槽、icon、子菜单**全部丢失**。

致命点：`<el-menu>` 和 `<el-menu-item>` 两个名字 Vue2/EP3 完全一致，唯独 `el-submenu` 差一个连字符 → 同一份模板里「菜单容器正常、叶子项正常、只有可展开的目录submenu消失」，极具迷惑性。

## 怎么排查（30 秒确认）
浏览器控制台跑：
```js
document.getElementsByTagName('el-submenu').length   // >0 即中招（应为 0）
document.querySelectorAll('.el-sub-menu').length     // EP3 正确组件，中招时为 0
```
看 `<el-menu>` 直接子节点：若有大量空标签 `<EL-SUBMENU>` 就是它。

## 修复
模板里全局替换：`<el-submenu` → `<el-sub-menu`，`</el-submenu>` → `</el-sub-menu>`（开/闭标签都要）。仅改组件名，业务逻辑不动。

## 本项目实例
- 项目：Qzsshd-q（群众赛事活动智能服务系统），分支 feature/vue3-upgrade
- 文件：`src/components/AppAside/index.vue`
- 现象：左侧导航只剩「首页」一项（且首页有 icon），7 个一级目录全部消失。用户最初反馈「为什么只有首页有 icon」，真相是整组 `<el-submenu>` 渲染成空未知标签。
- 运行时佐证：`store.authority` 数据正常（7 个一级 type:"0"/level:1/children 非空），v-if 三条件全 true，纯组件名未解析。
