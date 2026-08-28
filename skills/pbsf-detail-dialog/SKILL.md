---
name: pbsf-detail-dialog
description: PBSF 弹窗式详情查看组件生成规范。当需要写详情弹窗、detailDialog、在列表页用弹窗查看详情时使用。生成 el-descriptions 去边框、label 带中文冒号、字典翻译的只读弹窗。
---

# pbsf-detail-dialog

Generate a detail dialog component following pbsf project conventions using el-descriptions.

## Usage

```bash
/skill pbsf-detail-dialog "{详情标题}"
```

Example:
```bash
/skill pbsf-detail-dialog "车辆信息详情"
```

## Template Output

```vue
<template>
  <el-dialog
    v-model="open"
    width="700px"
    title="{详情标题}"
    append-to-body
    :close-on-click-modal="false"
  >
    <div v-loading="loading">
      <el-descriptions :column="2" class="app-desc">
        <el-descriptions-item label="{字段A}：" label-class-name="my-label">{{
          detail.fieldA || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="{字段B}：" label-class-name="my-label">{{
          detail.fieldB || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="{字段C}：" label-class-name="my-label">{{
          detail.fieldC ?? '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="{字段D}：" label-class-name="my-label">{{
          detail.fieldD ?? '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="{字段E}：" :span="2" label-class-name="my-label">{{
          detail.fieldE || '-'
        }}</el-descriptions-item>
      </el-descriptions>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { getById } from '@pbsf/app-bs-manage/api/{moduleName}/{featureName}';

const open = ref(false);
const loading = ref(false);
const detail = ref({});

function openDialog(row) {
  loading.value = true; // open 前先 loading，避免 transition 期间 loading 闪过
  open.value = true;
  getDetail(row);
}

function closeDialog() {
  open.value = false;
}

async function getDetail(row) {
  try {
    loading.value = true;
    const res = await getById(row.id);
    detail.value = res.data || res;
  } catch {
    // 获取详情失败
  } finally {
    loading.value = false;
  }
}

defineExpose({ openDialog });
</script>

<style lang="scss" scoped>
:deep(.my-label) {
  width: 120px;
}
</style>
```

## Field Display Pattern

| Field Type    | Display Pattern                                         |
|---------------|---------------------------------------------------------|
| String (text) | `{{ detail.fieldName || '-' }}`                          |
| Number        | `{{ detail.fieldName ?? '-' }}` (use `??` for numbers)   |
| Date          | `{{ detail.fieldName || '-' }}`                          |

## Key Points

1. Dialog width: 700px or 800px
2. `el-descriptions` 用 `:column="2"` + `class="app-desc"`（**不要加 border**）；每个 `el-descriptions-item` 加 `label-class-name="my-label"`（**只能写在 item 上，严禁写在外层 `el-descriptions` 上**——EP 2.14 源码只消费 item 的 `labelClassName`，外层写不生效），且 `label` 文本末尾**必须带中文全角冒号 `：`**（如 `label="统一社会信用代码："`，切勿用英文 `:` 或漏写）
3. **NOT** add `v-loading` to el-descriptions - add to a wrapper div if needed
4. Use `{{ detail.field || '-' }}` for string fields
5. Use `{{ detail.field ?? '-' }}` for number fields (use `??` to handle 0)
6. Use `:span="2"` for full-width fields
7. Import API from `@pbsf/app-bs-manage/api/{moduleName}/{featureName}`
8. Always expose `openDialog` via `defineExpose({ openDialog })`
9. Add `closeDialog` function
10. Add scoped style with `:deep(.my-label)` width 120px
11. **弹窗 loading（时机 + 位置）**:
    - **时机**: `loading = true` 必须在 `open.value = true` **之前**设（el-dialog transition + lazy 渲染，后设会闪过/看不到）。
    - **位置**: 详情弹窗用 `<div v-loading="loading">` 包裹 el-descriptions（el-descriptions 本身不支持 v-loading，**必须**套 wrapper div）。

## ⚠️ MANDATORY Coding Rules

- **每个 `el-descriptions-item` 的 `label` 文本末尾必须带中文全角冒号 `：`**（如 `label="机构名称："`）；不要用英文半角 `:`、也不要漏写冒号
- **必须使用 async/await**，禁止使用 `.then()/.catch()/.finally()`（ESLint: `promise/prefer-await-to-then`）
- **禁止 console.log / console.error / console.warn**（ESLint: `no-console`）
- catch 块为空时必须加注释说明（避免 `no-empty` 报错）
- 只从 `useDict` 解构模板中实际使用的字典变量（ESLint: `no-unused-vars`）

## Common Issues

### Issue: Displaying "0" for number fields

**Incorrect:**

```vue
{{ detail.count || '-' }}
```

When `count` is 0, it will display '-'

**Correct:**

```vue
{{ detail.count ?? '-' }}
```

This will display 0 when the value is 0.

## File Location

Place detail dialog at:

```
packages/app-bs-manage/views/{moduleName}/{featureName}/components/detailDialog.vue
```
