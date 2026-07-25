# pbsf-add-dialog

Generate an add/edit dialog component following pbsf project conventions.

## Usage

```bash
/skill pbsf-add-dialog "{中文功能名}"
```

Example:
```bash
/skill pbsf-add-dialog "车辆信息"
```

## Template Output

```vue
<template>
  <el-dialog
    v-model="open"
    width="700px"
    :title="form.id ? '编辑{功能名}' : '新增{功能名}'"
    append-to-body
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      v-loading="viewLoading"
      :model="form"
      :rules="rules"
      label-width="120px"
      :validate-on-rule-change="false"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="{字段A}" prop="fieldA">
            <el-input
              v-model.trim="form.fieldA"
              placeholder="请输入{字段A}"
              maxlength="100"
              show-word-limit
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="{字段B}" prop="fieldB">
            <el-input-number
              v-model="form.fieldB"
              :min="0"
              :max="999999"
              step-strictly
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="{字段C}" prop="fieldC">
            <el-select v-model="form.fieldC" placeholder="请选择{字段C}" clearable style="width: 100%">
              <el-option
                v-for="dict in dict_type"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="{日期字段}" prop="dateField">
            <el-date-picker
              v-model="form.dateField"
              type="date"
              placeholder="请选择{日期字段}"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="{日期时间字段}" prop="datetimeField">
            <el-date-picker
              v-model="form.datetimeField"
              type="datetime"
              placeholder="请选择{日期时间字段}"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="{描述字段}" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请输入{描述字段}"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button :loading="saveLoading" type="primary" @click="handleSubmit">保存</el-button>
        <el-button @click="closeDialog">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { getById, add, update } from '@pbsf/app-bs-manage/api/{moduleName}/{featureName}';
import modal from '@/utils/modal';
import useDict from '@/hooks/useDict';

defineOptions({ name: 'AddDialog' });

// Optional: Get dictionary data
// const { dict_type } = useDict('dict_type');

const emit = defineEmits(['change']);

const open = ref(false);
const formRef = ref(null);
const viewLoading = ref(false);
const saveLoading = ref(false);

// Default form data
const defaultForm = {
  id: undefined,
  fieldA: undefined,
  fieldB: undefined,
  fieldC: undefined,
  dateField: undefined,
  datetimeField: undefined,
  description: undefined,
};

const form = reactive({ ...defaultForm });

const rules = reactive({
  fieldA: [{ required: true, message: '请输入{字段A}', trigger: 'blur' }],
  fieldB: [{ required: true, message: '请输入{字段B}', trigger: 'blur' }],
  fieldC: [{ required: true, message: '请选择{字段C}', trigger: 'change' }],
  dateField: [{ required: true, message: '请选择{日期字段}', trigger: 'change' }],
  datetimeField: [{ required: true, message: '请选择{日期时间字段}', trigger: 'change' }],
  description: [{ required: true, message: '请输入{描述字段}', trigger: 'blur' }],
});

function openDialog(row) {
  // Reset form and validation
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(form, defaultForm);
  if (row?.id) {
    viewLoading.value = true; // 编辑回显：open 前先 loading，避免 transition 期间 loading 闪过
  }
  open.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
  if (row?.id) {
    getDetail(row);
  }
}

function closeDialog() {
  if (saveLoading.value) return;
  open.value = false;
}

async function getDetail(row) {
  try {
    viewLoading.value = true;
    const res = await getById(row.id);
    const data = res.data || res;
    Object.assign(form, data);
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  } catch {
    // 获取详情失败
  } finally {
    viewLoading.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
  } catch {
    // 表单验证未通过
    return;
  }
  try {
    saveLoading.value = true;
    const submitData = { ...form };
    const apiFunc = form.id ? update : add;
    const res = await apiFunc(submitData);
    if (res.code === 200) {
      modal.msgSuccess('保存成功');
      open.value = false;
      emit('change');
    }
  } catch {
    // 保存失败
  } finally {
    saveLoading.value = false;
  }
}

function handleClosed() {
  // Delete all fields first (including id) to prevent residual API fields
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(form, defaultForm);
  // Reset form validation
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

defineExpose({ openDialog });
</script>
```

## Form Component Conventions

### el-input (Text Input)

**REQUIRED props:**
- `v-model.trim` - Auto trim whitespace
- `maxlength` - Max character length (common: 50, 100, 200, 500)
- `show-word-limit` - Display character count
- `clearable` - Show clear button
- `placeholder` - Hint text

```vue
<el-input
  v-model.trim="form.fieldName"
  placeholder="请输入字段名"
  maxlength="100"
  show-word-limit
  clearable
/>
```

**Textarea variant:**
```vue
<el-input
  v-model="form.description"
  type="textarea"
  :rows="4"
  placeholder="请输入描述"
  maxlength="500"
  show-word-limit
/>
```

### el-input-number (Number Input)

**REQUIRED props:**
- `:min` - Minimum value (usually 0)
- `:max` - Maximum value (common: 9999, 99999, 999999)
- `controls-position="right"` - Button position
- `style="width: 100%"` - Full width

```vue
<el-input-number
  v-model="form.numberField"
  :min="0"
  :max="999999"
  step-strictly
  controls-position="right"
  style="width: 100%"
/>
```

### el-select (Select Dropdown)

```vue
<el-select v-model="form.typeField" placeholder="请选择" clearable style="width: 100%">
  <el-option
    v-for="dict in dict_type"
    :key="dict.value"
    :label="dict.label"
    :value="dict.value"
  />
</el-select>
```

### el-date-picker (Date Picker)

**Date only:**
```vue
<el-date-picker
  v-model="form.dateField"
  type="date"
  placeholder="请选择日期"
  value-format="YYYY-MM-DD"
  style="width: 100%"
/>
```

**Date and time:**
```vue
<el-date-picker
  v-model="form.datetimeField"
  type="datetime"
  placeholder="请选择日期时间"
  format="YYYY-MM-DD HH:mm:ss"
  value-format="YYYY-MM-DD HH:mm:ss"
  style="width: 100%"
/>
```

## Common maxlength Values

| Field Type | maxlength |
|------------|-----------|
| Short text (name, title) | 50 |
| Medium text (description) | 100-200 |
| Long text (textarea) | 500 |
| URL | 500 |

## Key Points

1. Dialog width: 700px or 800px
2. Title: `form.id ? '编辑{功能名}' : '新增{功能名}'`
3. Use `el-row` with `:gutter="20"` and `el-col :span="12"` for grid layout
4. **el-input MUST have:** `v-model.trim`, `maxlength`, `show-word-limit`, `clearable`
5. **el-input-number MUST have:** `:min`, `:max`, `controls-position="right"`, `style="width: 100%"`
6. Import API from `@pbsf/app-bs-manage/api/{moduleName}/{featureName}`
7. Always use `@closed="handleClosed"` to reset form
8. Always use `defineExpose({ openDialog })` to expose openDialog method
9. **弹窗 loading（时机 + 位置，别死板）**:
   - **时机**: `loading/viewLoading = true` 必须在 `open.value = true` **之前**设（el-dialog transition + lazy 渲染，后设会闪过/看不到）。
   - **位置——按弹窗主内容选，直接加到那个元素上，不要套多余的 wrapper div**:
     - 列表弹窗（弹窗里就一个 el-table，如历史记录/设置记录）→ `v-loading` 加 **el-table**
     - 表单弹窗（el-form，如新增/编辑/设置白名单）→ `v-loading` 加 **el-form**
     - 详情弹窗（el-descriptions）→ `v-loading` 加包裹它的 **wrapper div**（el-descriptions 不支持 v-loading）

## ⚠️ MANDATORY Coding Rules

- **必须使用 async/await**，禁止使用 `.then()/.catch()/.finally()`（ESLint: `promise/prefer-await-to-then`）
- **禁止 console.log / console.error / console.warn**（ESLint: `no-console`）
- catch 块为空时必须加注释说明（避免 `no-empty` 报错）
- 只从 `useDict` 解构模板中实际使用的字典变量（ESLint: `no-unused-vars`）

## File Location

Place add/edit dialog at:
```
packages/app-bs-manage/views/{moduleName}/{featureName}/components/addDialog.vue
```
