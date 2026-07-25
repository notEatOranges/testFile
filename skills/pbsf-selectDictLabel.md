# pbsf-selectDictLabel

Utility function to get label from dictionary options by value.

## Usage

```bash
/skill pbsf-selectDictLabel
```

## Import

```javascript
import { selectDictLabel } from '@pbsf/utils';
```

## Basic Usage

```javascript
import { selectDictLabel } from '@pbsf/utils';

// Dictionary options
const dictOptions = [
  { value: '0', label: '正常' },
  { value: '1', label: '停用' },
  { value: '2', label: '删除' }
];

// Get label by value
const label = selectDictLabel(dictOptions, '0'); // Returns: '正常'
const label2 = selectDictLabel(dictOptions, '1'); // Returns: '停用'
const label3 = selectDictLabel(dictOptions, '99'); // Returns: '99' (default to value if not found)
```

## In Template

```vue
<template>
  <div>
    <span>状态：{{ selectDictLabel(dictOptions, form.status) }}</span>
  </div>
</template>

<script setup>
import { selectDictLabel } from '@pbsf/utils';
import useDict from '@/hooks/useDict';

const { sys_normal_disable } = useDict('sys_normal_disable');
const form = reactive({ status: '0' });
</script>
```

## With Fallback

```javascript
// If value not found in options, returns the value itself
const label = selectDictLabel(options, 'unknown'); // Returns: 'unknown'
```

## Key Points

1. **Import**: `import { selectDictLabel } from '@pbsf/utils';`
2. **Parameters**: `(options: Array, value: string|number) => string`
3. **Returns**: The label string, or the original value if not found
4. **Options format**: `[{ value: string, label: string }, ...]`

## Common Use Cases

### Displaying dict value in plain text

```vue
<el-descriptions-item label="状态：">
  {{ selectDictLabel(sys_normal_disable, form.status) || '-' }}
</el-descriptions-item>
```

### In computed properties

```javascript
const statusLabel = computed(() => {
  return selectDictLabel(sys_normal_disable.value, form.status);
});
```

### Converting dict values for display

```javascript
// When API returns numeric values but dict uses strings
const displayValue = selectDictLabel(dictOptions, String(row.status));
```
