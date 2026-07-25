# pbsf-hooks-ref

PBSF 项目所有 Hooks 速查。生成页面时参考此文件获取正确的 Hook 用法。

## useTable — 动态表格高度

```js
import useTable from '@/hooks/useTable';

const tableRef = ref(null);
const { tableHeight, calcTableHeight } = useTable(tableRef, 'withPagination');
// 第二个参数: 'withPagination'(底部84px) | 'noPagination'(底部32px) | 数字(自定义px)
// 绑定: <el-table :height="tableHeight">
// 搜索栏展开/收起后调用 calcTableHeight() 重算高度
```

触发 calcTableHeight 的时机：
- `pbsf-table-search` 的 `@change` 事件
- Tab 切换后 `nextTick(() => calcTableHeight())`
- 数据加载完成 `getList().then(() => calcTableHeight())`（仅在高度依赖数据量时）

## useDict — 字典数据

```js
import useDict from '@/hooks/useDict';

// 同时获取多个字典
const { training_type, certificate_status } = useDict('training_type', 'certificate_status');
// 每个变量 = ref([{ value, label, elTagType, sort, remark }])
// 在模板使用: <pbsf-dict-tag :options="training_type" :value="String(row.type)" />
// 或纯文本: {{ selectDictLabel(training_type, row.type) }}
```

注意：数值型字典值必须 `String()` 转换后再传给 `pbsf-dict-tag`。

## useBTitle — 动态标题

```js
import useBTitle from '@/hooks/useBTitle';

const title = useBTitle();
title.value = route.query.id ? '编辑培训信息' : '新增培训信息';
// 自动更新浏览器标签页标题和面包屑
```

## useUnsavedChangesGuard — 未保存离开拦截

```js
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';

const { setUnsavedChanges, clearUnsavedChanges, handleBack } = useUnsavedChangesGuard({
  onSave: async () => {
    // 执行保存逻辑，成功返回 true
    await handleConfirm();
    return true;
  },
  onNotSave: () => {
    // 不保存时的清理
  },
});

// 表单修改后调用:
setUnsavedChanges();
// 保存成功后调用:
clearUnsavedChanges();
// 返回按钮使用 handleBack() 替代 router.back()
```

## useCRoute — 获取当前路由信息

```js
import useCRoute from '@/hooks/useCRoute';

const { getCurrentRoute } = useCRoute();
const currentRoute = getCurrentRoute();
// 从 permission store 的 addRoutes 中获取，包含完整的 meta 信息
```

## useBreadcrumb — 面包屑可见性

```js
import useBreadcrumb from '@/hooks/useBreadcrumb';

const { setVisible } = useBreadcrumb();
setVisible(false); // 隐藏面包屑
```

## useActionColumnWidth — 操作列自适应宽度

```js
import useActionColumnWidth from '@/hooks/useActionColumnWidth';

const { actionColWidth, setActionRef } = useActionColumnWidth();
// 可选参数: useActionColumnWidth({ padding: 32 })
// 无需手动调用，setActionRef 绑定时自动测量

// 模板中（:ref 直接放在 pbsf-table-action 上，无需额外 div）：
// <el-table-column label="操作" :width="actionColWidth" fixed="right">
//   <template #default="{ row }">
//     <pbsf-table-action :ref="setActionRef" :show-num="4">
//       <pbsf-table-action-item @click="handleView(row)">查看</pbsf-table-action-item>
//       ...
//     </pbsf-table-action>
//   </template>
// </el-table-column>
```

原理：`:ref="setActionRef"` 放在 `pbsf-table-action` 上，延迟到 DOM 挂载后从组件 `$el` 向上查找父级 `.cell`，测量内部 `.el-link` + `.el-divider` 的 `offsetWidth + margin` 求和。测量前临时设置 `white-space: nowrap` 防止文字换行。结果稳定，多次查询不会累积增长。

适用场景：操作列按钮数量动态变化（v-if 控制显隐），或复用到不同页面时按钮文本长度不同。

## useEventBus — 跨页面通信（来自 @vueuse/core）

```js
import { useEventBus } from '@vueuse/core';

// 编辑页保存后通知列表页
const bus = useEventBus('/module/path/index');
bus.emit(route.query.id ? 'EDIT' : 'ADD');

// 列表页监听
const bus = useEventBus('/module/path/index');
bus.on((event) => {
  switch (event) {
    case 'ADD': resetQuery(); break;   // 新增后重置查询
    case 'EDIT': getList(); break;     // 编辑后刷新列表
  }
});
```
