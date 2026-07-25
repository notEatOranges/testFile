# useActionColumnWidth — 操作列自适应宽度

el-table 操作列宽度自动测量的 hook。按钮数量动态变化（v-if 控制显隐）或按钮文案长度不一时，无需手写固定宽度，自动测量出最合适的列宽。

## Usage

```bash
/skill pbsf-action-column-width
```

## Hook 用法

```javascript
import useActionColumnWidth from '@/hooks/useActionColumnWidth';

const { actionColWidth, setActionRef } = useActionColumnWidth();
// 可选参数: useActionColumnWidth({ padding: 32 })  // padding=额外内边距(px)，默认 32
```

- `actionColWidth` — `ref<string>`，计算后的列宽（如 `'168'`），绑定到 `el-table-column` 的 `:width`
- `setActionRef` — 绑定到 `pbsf-table-action` 组件的 `:ref`，**绑定即自动测量，无需手动调用**

## 模板写法

`:ref="setActionRef"` 直接放在 `pbsf-table-action` 上，**不需要额外包 div**：

```vue
<el-table-column label="操作" :width="actionColWidth" align="center" fixed="right">
  <template #default="{ row }">
    <pbsf-table-action :ref="setActionRef" :show-num="4">
      <pbsf-table-action-item @click="handleView(row)">查看</pbsf-table-action-item>
      <pbsf-table-action-item v-if="row.status === '0'" @click="handleEdit(row)">编辑</pbsf-table-action-item>
      <pbsf-table-action-item @click="handleDelete(row)">删除</pbsf-table-action-item>
    </pbsf-table-action>
  </template>
</el-table-column>
```

## 从固定宽度迁移

如果原代码是写死的固定宽度（常见于 `pbsf-list-page` 模板默认的 `width="200"`）：

```diff
- <el-table-column label="操作" align="center" width="200" fixed="right">
+ <el-table-column label="操作" align="center" :width="actionColWidth" fixed="right">
    <template #default="{ row }">
-     <pbsf-table-action :show-num="3">
+     <pbsf-table-action :ref="setActionRef" :show-num="3">
        ...
      </pbsf-table-action>
    </template>
  </el-table-column>
```

并在 `<script setup>` 中引入 hook：

```javascript
import useActionColumnWidth from '@/hooks/useActionColumnWidth';
const { actionColWidth, setActionRef } = useActionColumnWidth();
```

## Key Points (重要!)

1. **`:ref="setActionRef"` 必须放在 `pbsf-table-action` 上**，不要放在 `pbsf-table-action-item` 或额外包裹的 div 上
2. **`:width="actionColWidth"` 必须用 `:width` 绑定**（动态），不能用 `width=""`（静态字符串）
3. **`actionColWidth` 默认值是空字符串 `''`**，首次渲染前操作列会自适应；测量完成后（下一事件循环）更新为精确宽度
4. **无需手动触发测量**：`setActionRef` 内部延迟到 DOM 挂载后自动执行，v-if 按钮显隐后重新挂载时也会重测
5. **padding 参数**：默认 32px，用于补偿边距/留白；若实测偏窄导致按钮被截断，调大该值，如 `useActionColumnWidth({ padding: 48 })`
6. **结果稳定**：测量前临时设 `white-space: nowrap` 防止换行，测量后还原；多次查询不会让宽度累积增长

## 工作原理

`setActionRef(vm)` 接到组件实例后，延迟到下一个事件循环（`setTimeout` 确保 DOM 已挂载到文档），从组件 `$el` 向上查找父级 `.cell`，测量内部所有 `.el-link` + `.el-divider` 的 `offsetWidth + 左右 margin` 求和，再加 `padding` 得到列宽。

适用场景：
- 操作列按钮用 `v-if` 动态显隐（不同行/不同状态下按钮数不同）
- 同一组件复用到多个页面，按钮文案长度不一致
- 不想为每个页面手调固定宽度

## Complete Example

```vue
<template>
  <el-table ref="tableRef" v-loading="loading" :data="tableList" :height="tableHeight" border>
    <el-table-column prop="name" label="名称" min-width="150" align="center" />
    <el-table-column label="操作" :width="actionColWidth" align="center" fixed="right">
      <template #default="{ row }">
        <pbsf-table-action :ref="setActionRef" :show-num="4">
          <pbsf-table-action-item @click="handleView(row)">查看</pbsf-table-action-item>
          <pbsf-table-action-item v-if="row.status === '0'" @click="handleEdit(row)">编辑</pbsf-table-action-item>
          <pbsf-table-action-item @click="handleDelete(row)">删除</pbsf-table-action-item>
          <pbsf-table-action-item @click="handleRecord(row)">审核记录</pbsf-table-action-item>
        </pbsf-table-action>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref } from 'vue';
import useTable from '@/hooks/useTable';
import useActionColumnWidth from '@/hooks/useActionColumnWidth';

defineOptions({ name: 'DemoList' });

const tableRef = ref(null);
const loading = ref(false);
const tableList = ref([]);
const { tableHeight, calcTableHeight } = useTable(tableRef, 'withPagination');
const { actionColWidth, setActionRef } = useActionColumnWidth();

function handleView(row) {}
function handleEdit(row) {}
function handleDelete(row) {}
function handleRecord(row) {}
</script>
```
