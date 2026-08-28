---
name: pbsf-page-name
description: PBSF 页面/组件 name 声明规范。生成任何页面或弹窗组件时必读。规范何时需要用 defineOptions 声明 name、避免旧的 <script setup name> 写法。
---

# pbsf-page-name

页面/组件是否需要声明 `name` 的规范。**生成任何页面/弹窗组件时必读**。

## 默认：不写 name

**绝大多数情况都不需要写 `name`**。直接用：

```vue
<script setup>
import { ref } from 'vue';
import useTable from '@/hooks/useTable';

const tableRef = ref(null);
</script>
```

不要写 `<script setup name="Xxx">`，也不需要 `defineOptions({ name })`。

## 为什么不需要

### 路由页面（动态路由加载的 .vue）

`src/store/modules/permission.js` 的 `loadView` 在加载组件时会**强制覆盖**组件 name：

```js
res = async () => {
  const cpn = await modules[path]();
  cpn.default.name = name;   // name = 后端菜单返回的 route.name
  return cpn;
};
```

SFC 里写的 name 会被 `route.name`（后端菜单配置）覆盖，**写了等于没写**。keep-alive 缓存（`src/store/modules/tagsView.js` 的 `cachedViews` 存的是 `route.name`）也由 loadView 注入的 name 兜底，与 SFC name 无关，正常工作。

→ 路由页：**不写 name**。

### 局部子组件（弹窗、业务组件）

不经 `loadView`，name 退化为文件名（如 `index`、`addDialog`）。但弹窗/业务组件通常不 keep-alive、不递归引用自身，devtools 显示文件名也能接受。

→ 子组件：**默认也不写 name**。

## ❌ 永远不要用 `<script setup name="Xxx">`

```vue
<!-- 错误！本项目不生效 -->
<script setup name="CertificateManage">
```

这种「在 `<script setup>` 标签上写 name 属性」的语法由 `vite-plugin-vue-setup-extend` 插件提供，**Vue 官方从未原生支持**。本项目未安装该插件，编译器直接忽略 name 属性。看到旧代码这样写，迁移时顺手删掉 name 即可。

## 极少数需要 name 的情况

只有以下场景才用 `defineOptions({ name: 'Xxx' })`（Vue 3.3+ 编译器宏，无需 import）：

1. **递归组件**：组件在自身模板里按 name 引用自己
2. **需要对弹窗/组件做 keep-alive**：且 `:include` 按组件 name 匹配（罕见）

```vue
<script setup>
import { ref } from 'vue';

defineOptions({ name: 'RecursiveTree' });   // 放在所有 import 之后
</script>
```

命名用大驼峰（PascalCase）。除这两种情况外，**不要加 name**。

## 快速自查

| 场景 | 做法 |
|---|---|
| 新建路由页/弹窗/业务组件 | `<script setup>`，不写 name |
| 看到 `<script setup name="Xxx">` | 删掉 name（旧代码可能存在） |
| 递归组件 / 需要 keep-alive 的组件 | `<script setup>` + `defineOptions({ name: 'Xxx' })` |
