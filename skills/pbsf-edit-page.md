# pbsf-edit-page

生成全页面式新增/编辑页面（非弹窗模式）。适用于新增和编辑共用同一页面，通过 `route.query.id` 区分模式。

参考文件: `packages/app-twrh/views/cultivate/edit.vue`

用法: `/skill pbsf-edit-page "{中文功能名}"`

## 完整模板

```vue
<template>
  <page-wrapper>
    <el-card v-loading="viewLoading" shadow="never" class="app-card has-footer-bar is-full">
      <div v-if="!viewLoading" class="app-group">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
          <!-- 分组标题（可选，按需复制） -->
          <div class="app-group__header">
            <div class="app-group__title">{分组标题}</div>
            <div class="app-group__spacing" />
          </div>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="{字段A}" prop="{fieldA}">
                <el-input v-model.trim="form.{fieldA}" maxlength="50" show-word-limit placeholder="请输入{字段A}" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="{字段B}" prop="{fieldB}">
                <el-select v-model="form.{fieldB}" clearable placeholder="请选择{字段B}" style="width: 100%">
                  <el-option v-for="dict in {dictName}" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="{日期字段}" prop="{dateField}">
                <el-date-picker v-model="form.{dateField}" value-format="YYYY-MM-DD" type="date"
                  placeholder="请选择{日期字段}" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="{备注}" prop="remark">
                <el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit
                  placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <footer-toolbar>
          <el-button type="primary" :loading="saveLoading" @click="handleConfirm">保 存</el-button>
          <el-button @click="handleBack(true)">关 闭</el-button>
        </footer-toolbar>
      </div>
    </el-card>
  </page-wrapper>
</template>

<script setup>
import useDict from '@/hooks/useDict';
import useBTitle from '@/hooks/useBTitle';
import { useEventBus } from '@vueuse/core';
import { findPage as getDetail, cultivateAdd as addApi, cultivateEdit as editApi } from '@pbsf/app-twrh/api/{moduleName}';
import modal from '@/utils/modal';
import tab from '@/utils/tab';

defineOptions({ name: '{PageName}' });

const route = useRoute();
const router = useRouter();
const title = useBTitle();

// ===== 字典 =====
const { {dictName} } = useDict('{dict_type}');

// ===== 表单 =====
const formRef = ref();
const form = reactive({
  id: undefined,
  {fieldA}: undefined,
  {fieldB}: undefined,
  {dateField}: undefined,
  remark: undefined,
});

const rules = reactive({
  {fieldA}: [{ required: true, message: '{字段A}不能为空', trigger: 'blur' }],
  {fieldB}: [{ required: true, message: '{字段B}不能为空', trigger: 'change' }],
});

// ===== 编辑模式: 加载数据 =====
const viewLoading = ref(false);

async function getData() {
  viewLoading.value = true;
  try {
    const res = await getDetail({ id: route.query.id });
    Object.assign(form, res.data);
  } catch (error) {
    console.error(error);
  } finally {
    viewLoading.value = false;
  }
}

if (route.query.id) {
  title.value = '编辑{功能名}';
  getData();
} else {
  title.value = '新增{功能名}';
}

// ===== 保存 =====
const saveLoading = ref(false);

async function handleConfirm() {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  saveLoading.value = true;
  try {
    const api = route.query.id ? editApi : addApi;
    await api(form);
    modal.msgSuccess('保存成功');
    // 通知列表页刷新
    const bus = useEventBus('/{moduleName}/{routePath}/index');
    bus.emit(route.query.id ? 'EDIT' : 'ADD');
    handleBack();
  } catch (error) {
    console.error(error);
  } finally {
    saveLoading.value = false;
  }
}

// ===== 关闭页面 =====
async function handleBack(flag) {
  if (flag) {
    try {
      await modal.confirm('关闭后数据将不会被保存，请确认是否关闭', '提示');
    } catch {
      return;
    }
  }
  tab.closePage(route);
  router.back();
}
</script>
```

## 文件位置

`packages/app-twrh/views/{moduleName}/{routePath}/edit.vue`

## 列表页跳转到编辑页

列表页中的跳转方式：
```js
function handleAdd(row) {
  // row 存在 = 编辑, 不存在 = 新增
  router.push({ path: './edit', query: row?.id ? { id: row.id } : {} });
}
```

列表页路由文件 `index.vue` 中注册 EventBus 监听：
```js
const bus = useEventBus('/{moduleName}/{routePath}/index');
bus.on((event) => {
  switch (event) {
    case 'ADD': resetQuery(); break;
    case 'EDIT': getList(); break;
  }
});
```

## 表单字段参考

各字段类型的模板代码见 `/skill pbsf-form-snippets`
表单验证器见 `/skill pbsf-validator`
字典用法见 `/skill pbsf-dict-tag-useDict`

## 分组标题样式

多个表单分组时使用：
```vue
<div class="app-group__header">
  <div class="app-group__title">基本信息</div>
  <div class="app-group__spacing" />
</div>
<!-- 该分组的字段 -->
<div class="app-group__header">
  <div class="app-group__title">其他信息</div>
  <div class="app-group__spacing" />
</div>
<!-- 其他分组的字段 -->
```

## 未保存离开拦截（可选）

当表单复杂、填写成本高时，添加离开拦截：
```js
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';

const { setUnsavedChanges, clearUnsavedChanges } = useUnsavedChangesGuard({
  onSave: async () => {
    await handleConfirm();
    return true;
  },
});

// 在表单字段 watch 中调用 setUnsavedChanges()
// 在 handleConfirm 成功后调用 clearUnsavedChanges()
// handleBack 改为使用 useUnsavedChangesGuard 返回的 handleBack
```

## 关键约定

1. 用 `defineOptions({ name: '{PageName}' })` 声明组件名（大驼峰）。注意：`<script setup name="...">` 这种标签属性写法需要 `vite-plugin-vue-setup-extend` 插件，本项目未安装，必须用 `defineOptions` 宏（Vue 3.3+ 原生支持，无需插件）
2. 使用 async/await，不用 .then 链
3. 使用 `modal` 不用 `ElMessage`
4. 编辑页与新增页共用，通过 `route.query.id` 区分
5. `v-loading="viewLoading"` 在 el-card 上，`v-if="!viewLoading"` 在内容上（防止数据未到时闪烁）
6. `<footer-toolbar>` 固定底部按钮栏
7. `tab.closePage(route)` 关闭标签页 + `router.back()` 返回
8. EventBus 路径与列表页路由路径一致，确保通知送达
