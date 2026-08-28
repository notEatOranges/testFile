---
name: pbsf-list-page
description: PBSF 列表页生成规范。当需要写列表页、查询表格页、带搜索+表格+分页的页面时使用。生成含 pbsf-table-search 搜索区、el-table 表格、分页的 index.vue,自动应用表格列宽、操作列宽度、页面 name 等规范。
---

# pbsf-list-page

Generate a list page component following pbsf project conventions with pbsf-table-search.

## Usage

```bash
/skill pbsf-list-page "{中文功能名}"
```

Example:
```bash
/skill pbsf-list-page "车辆信息"
```

## Template Output

```vue
<template>
  <page-wrapper content-full-height>
    <pbsf-table-search
      ref="queryRef"
      :model="queryParams"
      label-width="100px"
      @search="handleQuery"
      @clear="resetQuery"
      @change="calcTableHeight"
    >
      <pbsf-table-search-col>
        <el-form-item label="{字段A}" prop="fieldA">
          <el-input
            v-model.trim="queryParams.fieldA"
            clearable
            placeholder="请输入{字段A}"
            maxlength="100"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
      </pbsf-table-search-col>
      <pbsf-table-search-col>
        <el-form-item label="{字段B}" prop="fieldB">
          <el-input
            v-model.trim="queryParams.fieldB"
            clearable
            placeholder="请输入{字段B}"
            maxlength="100"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
      </pbsf-table-search-col>
      <pbsf-table-search-col>
        <el-form-item label="{字段C}" prop="fieldC">
          <el-input
            v-model.trim="queryParams.fieldC"
            clearable
            placeholder="请输入{字段C}"
            maxlength="50"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
      </pbsf-table-search-col>
      <pbsf-table-search-col>
        <el-form-item label="{日期字段}" prop="dateRange">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="handleQuery"
          />
        </el-form-item>
      </pbsf-table-search-col>
    </pbsf-table-search>

    <el-card shadow="never" class="app-card">
      <el-row justify="space-between" class="app-func">
        <el-col :span="1.5" />
        <el-col :span="1.5">
          <el-button plain @click="handleAdd"> 新增 </el-button>
        </el-col>
      </el-row>

      <el-table
        ref="tableRef"
        v-loading="loading"
        border
        row-key="id"
        class="app-table"
        :data="tableList"
        :height="tableHeight"
      >
        <el-table-column label="序号" width="55" type="index" align="center" />
        <el-table-column
          prop="fieldA"
          min-width="150"
          label="{字段A}"
          :show-overflow-tooltip="true"
          align="center"
        />
        <el-table-column prop="fieldB" min-width="120" label="{字段B}" align="center" />
        <el-table-column
          prop="dateField"
          min-width="160"
          label="{日期字段}"
          :show-overflow-tooltip="true"
          align="center"
        />
        <el-table-column prop="fieldC" min-width="100" label="{字段C}" align="center" />
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="scope">
            <pbsf-table-action :show-num="3">
              <pbsf-table-action-item @click="handleView(scope.row)">查看</pbsf-table-action-item>
              <pbsf-table-action-item @click="handleEdit(scope.row)">编辑</pbsf-table-action-item>
              <pbsf-table-action-item @click="handleDelete(scope.row)">删除</pbsf-table-action-item>
            </pbsf-table-action>
          </template>
        </el-table-column>
      </el-table>
      <pbsf-pagination
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :page-sizes="[15, 30, 50]"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <AddDialog ref="addDialogRef" @change="getList" />
    <DetailDialog ref="detailDialogRef" />
  </page-wrapper>
</template>

<script setup>
import useTable from '@/hooks/useTable';
import AddDialog from './components/addDialog.vue';
import DetailDialog from './components/detailDialog.vue';
import { pageList, deleteById } from '@pbsf/app-bs-manage/api/{moduleName}/{featureName}';
import modal from '@/utils/modal';

const queryParams = reactive({
  pageNum: 1,
  pageSize: 15,
  fieldA: undefined,
  fieldB: undefined,
  fieldC: undefined,
  dateRange: [],
});

const total = ref(0);
const tableRef = ref(null);
const loading = ref(false);
const tableList = ref([]);
const { tableHeight, calcTableHeight } = useTable(tableRef, 'withPagination');

async function getList() {
  try {
    loading.value = true;
    const params = {
      ...queryParams,
      fieldA: queryParams.fieldA || undefined,
      fieldB: queryParams.fieldB || undefined,
      fieldC: queryParams.fieldC || undefined,
      dateRangeStart: queryParams.dateRange?.[0] || undefined,
      dateRangeEnd: queryParams.dateRange?.[1] || undefined,
    };
    delete params.dateRange;
    const res = await pageList(params);
    tableList.value = res.data?.records || res.records || res.rows || [];
    total.value = res.data?.total || res.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  queryParams.pageNum = 1;
  queryParams.fieldA = undefined;
  queryParams.fieldB = undefined;
  queryParams.fieldC = undefined;
  queryParams.dateRange = [];
  getList();
}

const addDialogRef = ref();
function handleAdd() {
  addDialogRef.value?.openDialog();
}

function handleEdit(row) {
  addDialogRef.value?.openDialog(row);
}

const detailDialogRef = ref();
function handleView(row) {
  detailDialogRef.value?.openDialog(row);
}

async function handleDelete(row) {
  try {
    await modal.confirm('是否确认删除该记录？');
    const res = await deleteById({ id: row.id });
    if (res.code === 200) {
      modal.msgSuccess('删除成功');
      getList();
    }
  } catch {
    // 用户取消或删除失败
  }
}

onMounted(() => {
  getList();
});
</script>
```

## Search Field Components

### el-input (Text Search)

**REQUIRED props:**
- `v-model.trim` - Auto trim whitespace
- `clearable` - Show clear button
- `maxlength` - Max character length (50/100/200)
- `placeholder` - Hint text
- `@keyup.enter="handleQuery"` - Search on Enter

```vue
<el-input
  v-model.trim="queryParams.fieldName"
  clearable
  placeholder="请输入字段名"
  maxlength="100"
  @keyup.enter="handleQuery"
/>
```

### el-select (Dropdown Search)

**REQUIRED props:**
- `v-model` - Binding value
- `clearable` - Show clear button
- `placeholder` - Hint text
- `filterable` - Enable search (for long lists)
- `style="width: 100%"` - Full width
- `@change="handleQuery"` - Search on change

```vue
<el-select
  v-model="queryParams.typeId"
  clearable
  placeholder="请选择类型"
  filterable
  style="width: 100%"
  @change="handleQuery"
>
  <el-option
    v-for="item in typeList"
    :key="item.id"
    :label="item.name"
    :value="item.id"
  />
</el-select>
```

### el-date-picker (Date Range)

**REQUIRED props:**
- `v-model` - Binding value (array)
- `type="daterange"` - Range picker
- `range-separator="-"` - Separator
- `start-placeholder` / `end-placeholder` - Placeholders
- `value-format="YYYY-MM-DD"` - Format
- `style="width: 100%"` - Full width
- `@change="handleQuery"` - Search on change

```vue
<el-date-picker
  v-model="queryParams.dateRange"
  type="daterange"
  range-separator="-"
  start-placeholder="开始日期"
  end-placeholder="结束日期"
  value-format="YYYY-MM-DD"
  style="width: 100%"
  @change="handleQuery"
/>
```

**For single date:**
```vue
<el-date-picker
  v-model="queryParams.queryTime"
  type="date"
  placeholder="请选择查询时间"
  format="YYYY-MM-DD"
  value-format="YYYY-MM-DD"
  style="width: 100%"
  @change="handleQuery"
/>
```

## Date Range Parameter Handling

When using date range picker, convert the array to separate parameters:

```js
// In queryParams
dateRange: [],

// In getList
const params = {
  ...queryParams,
  dateRangeStart: queryParams.dateRange?.[0] || undefined,
  dateRangeEnd: queryParams.dateRange?.[1] || undefined,
};
delete params.dateRange;
```

## Common Search Field maxlength Values

| Field Type | maxlength |
|------------|-----------|
| Name/Title | 100 |
| Code/ID | 50 |
| Status | 50 |
| Description | 200 |

## Key Points

1. **Wrapper**: `<page-wrapper content-full-height>`
2. **Search**: `pbsf-table-search` with `ref="queryRef"`, `:model="queryParams"`
3. **Search fields**: Use `pbsf-table-search-col` wrapper
4. **Input props**: `v-model.trim`, `clearable`, `maxlength`, `@keyup.enter="handleQuery"`
5. **Select props**: Add `filterable`, `@change="handleQuery"`
6. **Date picker**: Add `@change="handleQuery"`
7. **Card**: `class="app-card"`
8. **Toolbar**: `class="app-func"` with `justify="space-between"`
9. **Table**: `class="app-table"`, `:height="tableHeight"`
10. **Table row-key**: Use primary key field name (e.g., `row-key="id"`)
11. **Data extraction**: `res.data?.records || res.records || res.rows || []`
12. **Total extraction**: `res.data?.total || res.total || 0`
13. **Delete API**: Pass object `deleteById({ id: row.id })`
14. **Pagination sizes**: `[15, 30, 50]`
15. **Actions**: `pbsf-table-action` with `pbsf-table-action-item`
16. **Dynamic height**: Import and use `useTable` hook
17. **Modal**: Import `modal` from `@/utils/modal`
18. **Import API** from `@pbsf/app-bs-manage/api/{moduleName}/{featureName}`
19. **表格列对齐**: 所有列默认 `align="center"` 居中（序号/账号/姓名/地址/状态/时间/操作等统一居中）。不要按设计稿用 `left`，项目规范是居中

## ⚠️ MANDATORY Coding Rules

- **必须使用 async/await**，禁止使用 `.then()/.catch()/.finally()`（ESLint: `promise/prefer-await-to-then`）
- **禁止 console.log / console.error / console.warn**（ESLint: `no-console`）
- catch 块为空时必须加注释说明（避免 `no-empty` 报错）
- 只从 `useDict` 解构模板中实际使用的字典变量（ESLint: `no-unused-vars`）

## Function Naming Conventions

| Purpose | Function Name |
|---------|---------------|
| Get list | `getList` |
| Search | `handleQuery` |
| Reset | `resetQuery` |
| Add | `handleAdd` |
| Edit | `handleEdit` |
| View | `handleView` |
| Delete | `handleDelete` |
| Calc height | `calcTableHeight` |

## Dialog Method Naming

Dialog components should expose `openDialog` method:

```js
// In dialog component
defineExpose({ openDialog });

// In list component - call it
addDialogRef.value?.openDialog();      // Add
addDialogRef.value?.openDialog(row);   // Edit
detailDialogRef.value?.openDialog(row); // View
```

## File Location

Place list page at:
```
packages/app-bs-manage/views/{moduleName}/{featureName}/list.vue
```
