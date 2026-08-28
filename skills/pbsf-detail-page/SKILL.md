---
name: pbsf-detail-page
description: PBSF 全页面式详情页生成规范(非弹窗)。当需要写独立的详情页 detail.vue、只读展示页时使用。生成 el-descriptions(去 border、label-class-name、label 带中文冒号、:deep 样式)展示数据。
---

# pbsf-detail-page

生成全页面式详情查看页面（非弹窗模式）。使用 `el-descriptions` 展示只读数据。

参考文件: `packages/app-twrh/views/cultivate/detail.vue`

用法: `/skill pbsf-detail-page "{中文功能名}"`

## 完整模板

```vue
<template>
  <page-wrapper>
    <el-card v-loading="viewLoading" shadow="never" class="app-card has-footer-bar is-full">
      <div v-if="!viewLoading" class="app-group">
        <!-- 分组标题（可选） -->
        <div class="app-group__header">
          <div class="app-group__title">基本信息</div>
          <div class="app-group__spacing" />
        </div>

        <el-descriptions class="app-desc" :column="2">
          <el-descriptions-item label-class-name="my-label" label="{字段A}：">
            {{ detailData?.{fieldA} || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label-class-name="my-label" label="{字段B}：">
            <pbsf-dict-tag :options="{dictName}" :value="String(detailData?.{fieldB})" />
          </el-descriptions-item>
          <el-descriptions-item label-class-name="my-label" label="{数字字段}：">
            {{ detailData?.{numberField} ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label-class-name="my-label" label="{日期字段}：">
            {{ detailData?.{dateField} || '-' }}
          </el-descriptions-item>
          <!-- 跨列字段 -->
          <el-descriptions-item label-class-name="my-label" label="{备注}：" :span="2">
            {{ detailData?.remark || '-' }}
          </el-descriptions-item>
          <!-- 文件列表 -->
          <el-descriptions-item label-class-name="my-label" label="{附件}：" :span="2">
            <pbsf-file-list :value="detailData?.{fileField}" />
          </el-descriptions-item>
        </el-descriptions>

        <footer-toolbar>
          <el-button @click="handleBack">关 闭</el-button>
        </footer-toolbar>
      </div>
    </el-card>
  </page-wrapper>
</template>

<script setup>
import useDict from '@/hooks/useDict';
import useBTitle from '@/hooks/useBTitle';
import { getDetil as getDetail } from '@pbsf/app-twrh/api/{moduleName}';

defineOptions({ name: '{PageName}' });

const route = useRoute();
const router = useRouter();
const title = useBTitle();

// ===== 字典 =====
const { {dictName} } = useDict('{dict_type}');

// ===== 数据加载 =====
const viewLoading = ref(false);
const detailData = ref({});

async function getData() {
  viewLoading.value = true;
  try {
    const res = await getDetail({ id: route.query.id });
    detailData.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    viewLoading.value = false;
  }
}

if (route.query.id) {
  title.value = '{功能名}详情';
  getData();
}

// ===== 关闭 =====
function handleBack() {
  tab.closePage(route);
  router.back();
}
</script>

<style scoped>
:deep(.my-label) {
  width: 120px;
}
</style>
```

## 文件位置

`packages/app-twrh/views/{moduleName}/{routePath}/detail.vue`

## 空值显示约定

| 字段类型 | 模板表达式 | 说明 |
|---------|-----------|------|
| 字符串/日期 | `\|\| '-'` | `null`/`undefined`/`''` 显示 `-` |
| 数字 | `?? '-'` | `0` 是有效值，`??` 不会误判为空 |
| 字典 | `<pbsf-dict-tag>` | 组件内部处理空值 |

**为什么数字用 `??` 不用 `||`**：`0 || '-'` 结果是 `'-'`，会错误地把 0 分显示为 `-`。

## 列表页跳转

```js
function handleDetail(row) {
  router.push(`./detail?id=${row.id}`);
}
```

## 多分组布局

当详情内容较多时，用分组标题分隔：

```vue
<div class="app-group__header">
  <div class="app-group__title">基本信息</div>
  <div class="app-group__spacing" />
</div>
<el-descriptions class="app-desc" :column="2">
  <!-- ... -->
</el-descriptions>

<div class="app-group__header">
  <div class="app-group__title">其他信息</div>
  <div class="app-group__spacing" />
</div>
<el-descriptions class="app-desc" :column="2">
  <!-- ... -->
</el-descriptions>
```

## 关键约定

1. `el-descriptions` 固定 `:column="2"` + `class="app-desc"`（**不要加 border**）；每个 `el-descriptions-item` 加 `label-class-name="my-label"`。**`label-class-name` 只能写在 item 上，严禁写在外层 `el-descriptions` 上**——EP 2.14 源码 `descriptions-cell` 只读 item 的 `labelClassName`，外层写不生效，`:deep(.my-label)` 样式会整个落空
2. scoped style 中设置 `:deep(.my-label) { width: 120px; }`
4. 全宽字段用 `:span="2"`
5. 字典值用 `<pbsf-dict-tag>` 并 `String()` 转换
6. 文件/图片用 `<pbsf-file-list>` / `<pbsf-image-preview>` 展示
7. `v-loading` 在 el-card 上，`v-if="!viewLoading"` 在内容上
8. `footer-toolbar` 只有关闭按钮（无保存）

## 与弹窗式详情的区别

| | 全页面 (`pbsf-detail-page`) | 弹窗 (`pbsf-detail-dialog`) |
|---|---|---|
| 适用 | 内容多、字段多、有子模块 | 字段少、快速查看 |
| 路由 | 独立路由 `./detail?id=xxx` | 无路由，弹窗打开 |
| 关闭 | `tab.closePage` + `router.back()` | `open.value = false` |
| 通信 | 通过路由参数 | `defineExpose({ openDialog })` |
