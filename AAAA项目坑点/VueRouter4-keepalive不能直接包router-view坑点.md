# Vue Router 4 keep-alive 不能直接包 router-view 坑点

## 现象
升级到 Vue Router 4（Vue3）后，页面切换出现：
- 导航后 URL 变了，但视图（组件）不更新 / 停留在旧页面（间歇性）。
- keep-alive 缓存完全失效，所有页面切换都重新加载。
- 控制台告警：`<router-view> can no longer be used directly inside <keep-alive>.`，并连带出现 `TransitionGroup` 收到非法 `mode` 属性的警告。

表现为"点返回没反应""提交成功后不自动返回"等导航类 bug。

## 根本原因
Vue Router 4 中，`<keep-alive>` **不能再直接包裹** `<router-view>`：
```html
<!-- ❌ Vue2 / 旧路由写法，Vue Router 4 下 keep-alive 直接失效 -->
<transition name="fade-transform" mode="out-in">
  <keep-alive :include="cachedViews">
    <router-view :key="key" />
  </keep-alive>
</transition>
```

## 正确写法（Vue Router 4）
用 `v-slot` 拿到 `Component`，再层层包裹：**router-view 最外层 → transition → keep-alive → component**：
```html
<router-view v-slot="{ Component }">
  <transition name="fade-transform" mode="out-in">
    <keep-alive :include="cachedViews">
      <component :is="Component" :key="route.path" />
    </keep-alive>
  </transition>
</router-view>
```

## 规则（红线）
- Vue3 + Vue Router 4 项目，Layout/AppMain 的路由出口必须用 v-slot 插槽写法，禁止 `<keep-alive><router-view/></keep-alive>`。
- `transition` 的 `mode` 属性只对「单根子节点」合法；一旦 keep-alive 失效导致 transition 的子节点变成 fragment，就会触发 `TransitionGroup mode` 警告——**该警告往往是 keep-alive 写法错误的连锁信号**，看到它先去查 AppMain。
- 升级 Vue2→3 时，AppMain 是必查点。

## 排查
1. 控制台搜 `can no longer be used directly inside <keep-alive>` 或 `TransitionGroup` + `mode`。
2. 打开 AppMain.vue 看路由出口结构。
3. 改成 v-slot 写法，刷新验证导航后视图是否切换。

## 本项目实例
- 项目：**Tyzxyy-q**（RuoYi-Vue 升级 Vue3）
- 文件：`src/layout/components/AppMain.vue`
- 问题：原 `<keep-alive><router-view/></keep-alive>` 导致 keep-alive 失效；分配角色页（`src/views/system/user/authRole.vue`）点「返回」/「提交」后，URL 变了但视图不切换，用户以为"没反应"。
- 修复：改成 v-slot 标准写法后，keep-alive 恢复，导航/缓存正常。
