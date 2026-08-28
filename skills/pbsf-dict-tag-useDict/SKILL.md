---
name: pbsf-dict-tag-useDict
description: PBSF 字典组件 pbsf-dict-tag 与 useDict hook 用法。状态/字典字段必须用 pbsf-dict-tag 或字典翻译,禁止硬编码。当字段涉及状态、类型、字典编码、需要展示标签或翻译字典值时使用。
---

# pbsf-dict-tag and useDict

Dictionary display component and hook for pbsf project.

## ⚠️ 渲染约定（状态/字典字段，重要）

凡是值来自字典的字段（状态、类型、级别等，如 `certStatus`、`status`、`type`），**必须**走以下两种方式之一渲染，**禁止**手写 `<span>` + 写死的中文标签 + 硬编码 CSS class：

1. **首选：`pbsf-dict-tag` 组件**（标签样式由字典的 `elTagType` 驱动，统一风格）
   ```vue
   <el-table-column prop="certStatus" label="当前证书状态" align="center">
     <template #default="{ row }">
       <pbsf-dict-tag :options="certificate_status" :value="String(row.certStatus)" />
     </template>
   </el-table-column>
   ```
2. **次选：字典翻译函数**（需要纯文本、不想要标签样式时，例如详情页段落里嵌一句）
   ```javascript
   function statusLabel(v) {
     const found = certificate_status.value?.find((d) => String(d.value) === String(v));
     return found?.label || '-';
   }
   ```

**反例（不要这样写）**：
```vue
<!-- ❌ 硬编码标签 + 手写样式 class -->
<span class="cert-status" :class="`cert-status--${statusKey(row.certStatus)}`">
  {{ statusLabel(row.certStatus) }}
</span>
```
> 这种写法把「值→文案→颜色」三件事都写死在前端，字典一改就失效，且每个页面各搞一套样式。统一交给 `pbsf-dict-tag` 处理。

> 注意：详情/操作按钮里若需要按状态判断逻辑（如 `v-if="isValid(row.certStatus)"`），保留状态常量判断函数即可，这与「展示层用 pbsf-dict-tag」互不冲突。

## Usage

```bash
/skill pbsf-dict-tag-useDict
```

## useDict Hook

Import and use the hook to get dictionary options:

```javascript
import useDict from '@/hooks/useDict';

// Get dictionary data
const { dict_type } = useDict('dict_type');
const { venue_category, operational_status } = useDict('venue_category', 'operational_status');
```

The returned dictionary is an array of objects with `value` and `label` properties:

```javascript
// Example: dict_type = [
//   { value: '0', label: '正常' },
//   { value: '1', label: '停用' }
// ]
```

## pbsf-dict-tag Component

### In Table Column

```vue
<el-table-column prop="status" min-width="100" label="状态" align="center">
  <template #default="{ row }">
    <pbsf-dict-tag :options="dict_type" :value="String(row.status)" />
  </template>
</el-table-column>
```

### In Detail Dialog (el-descriptions)

```vue
<el-descriptions-item label-class-name="my-label" label="状态：">
  <pbsf-dict-tag :options="dict_type" :value="form.status" />
</el-descriptions-item>
```

### Using with Props (passing dict from parent)

```javascript
// Child component (detailDialog.vue)
const props = defineProps({
  dictOptions: {
    type: Array,
    default: () => [],
  },
});
```

```vue
<!-- Parent component -->
<DetailDialog :dict-options="dict_type" />
```

## Key Points

1. **Import**: `import useDict from '@/hooks/useDict';`
2. **Usage**: `const { dict_type } = useDict('dict_type');`
3. **Component**: `<pbsf-dict-tag :options="dict_type" :value="value" />`
4. **String conversion**: Use `String(value)` for numeric dict values
5. **Multiple dicts**: `const { dict1, dict2 } = useDict('dict1', 'dict2');`
6. **Dict options structure**: `{ value: string, label: string }[]`

## Complete Example

```vue
<template>
  <el-table :data="tableList">
    <el-table-column prop="status" label="状态" align="center">
      <template #default="{ row }">
        <pbsf-dict-tag :options="sys_normal_disable" :value="String(row.status)" />
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import useDict from '@/hooks/useDict';

const { sys_normal_disable } = useDict('sys_normal_disable');
</script>
```
