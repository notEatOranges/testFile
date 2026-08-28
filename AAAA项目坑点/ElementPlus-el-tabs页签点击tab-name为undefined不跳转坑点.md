# Element Plus el-tabs 页签点击 tab.name 为 undefined 不跳转坑点

## 现象
Vue2 + Element UI 迁移到 Vue3 + Element Plus 后，`el-tabs` 的 `@tab-click` 回调里用 `tab.name` 取被点击标签的 name，结果**恒为 `undefined`**。常见后果：
- 页签栏点击切换页面**不生效**：`router.push({ path: tab.name })` → `router.push({ path: undefined })`，vue-router 把无 path/name/location 的对象当作"导航到当前位置"，返回 NavigationDuplicated 被忽略，URL 与页面都不变。因为无报错，极易误判成"部署环境路由/base 配置问题"。
- 依赖 `tab.name` 做取值的逻辑拿到 undefined：如 `bizTypeObj[tab.name]` → undefined。

## 根因（与 Element UI v2 的 API 差异，迁移遗漏）
- **Element UI v2**：`tab-click` 回调第一个参数是 **TabPane 组件实例**（Options API），`name` 是实例属性，`tab.name` 直接可取。
- **Element Plus**：`tab-click` 回调第一个参数是 **`TabsPaneContext`**（一个 reactive 上下文对象），暴露的字段是 `uid / props / paneName / active / index / isClosable / isFocusInsidePane`，**没有 `name`**。name 要从 `tab.props.name` 取（或 `tab.paneName`）。

### element-plus 源码证据（2.14.x）
- `tabs/src/tabs.mjs`：
  ```js
  const handleTabClick = (tab, tabName, event) => {
    if (tab.props.disabled) return
    emit("tabClick", tab, event)   // 第一个参数是 pane 上下文对象，不是 name 字符串
    setCurrentName(tabName, true)
  }
  ```
- `tabs/src/tab-pane.vue`：
  ```js
  const paneName = computed(() => props.name ?? index.value)
  const pane = reactive({ uid, getVnode, slots, props, paneName, active, index, isClosable, isFocusInsidePane })
  // 无 name 字段
  ```

## 排查方法（最快定位）
hook vue-router 的 `push` 打印参数，再点一次页签：
```js
const app = document.querySelector('#app').__vue_app__
const router = app.config.globalProperties.$router
const orig = router.push.bind(router)
router.push = function (to) { console.log('push =>', to); return orig(to) }
```
若打印出 `{ query: {} }`（缺 path），即 `tab.name` 为 undefined，命中本坑。

二分验证：手动 `router.push('/xxx')` 能正常跳转，说明 router/base/守卫都正常，问题只在回调取值。

## 修复
`tab.name` → `tab.props.name`（推荐，最直接）；`tab.paneName` 也可（computed，reactive 已 unwrap）。

## 注意：tab-remove 事件不同
`emit("tabRemove", pane.props.name)` —— `@tab-remove` 回调第一个参数**直接是 name 字符串**，不是 pane 对象。迁移时若原有 `@tab-remove="handler(name)"`，**不要**也改成 `name.props.name`，那会出错。只有 `@tab-click` 需要改。

## 本项目实例
- 项目：Qsntypx-q（青少年智能培训管理系统），Vue2+ElementUI → Vue3+ElementPlus 迁移项目
- `src/components/HeaderTabbar/index.vue` 的 `goUrl(tab)`：用 `tab.name` 做 `router.push`，导致顶部页签栏点击切换不跳转（已修复为 `tab?.props?.name`）
- 同类遗漏（待确认修复）：`src/pages/sys-manage/role-manage/components/edit.vue` 与 `auth.vue` 的 `tabClick(tab)`，用 `tab.name` 取 `bizTypeObj[tab.name]` 与 `activeTab.value = tab.name`
