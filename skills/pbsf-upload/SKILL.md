---
name: pbsf-upload
description: 公共附件上传和图片上传组件使用规范。当用户提到附件上传、文件上传、图片上传、el-upload、upload、文件选择、上传组件时触发。也包括需要创建或修改带有上传功能的表单弹窗（addDialog）时。务必使用此 skill，不要用原生 el-upload。
---

# PBSF 公共上传组件使用规范

本项目 `@pbsf/components` 提供了三个上传相关组件，通过 `PBSFResolver` 自动注册，**无需手动 import**。

## 组件一览

| 组件 | 标签 | 用途 |
|------|------|------|
| PbsfFileUpload | `<pbsf-file-upload>` | 通用文件附件上传（doc/pdf/xls 等） |
| PbsfImageUpload | `<pbsf-image-upload>` | 图片上传（png/jpg/jpeg） |
| PbsfFileList | `<pbsf-file-list>` | 只读文件列表展示（查看/下载） |

## 数据结构

所有上传组件的 v-model 绑定值类型为 `PBSFUploadFile[]`：

```ts
interface PBSFUploadFile {
  id: number;       // OSS 文件 ID（服务端返回）
  name: string;     // 文件名
  originUrl: string; // 文件原始 URL
}
```

## PbsfFileUpload（公共附件上传）

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | PBSFUploadFile[] | [] | v-model 绑定 |
| readOnly | boolean | false | 只读模式（禁用上传和删除） |
| disabled | boolean | false | 禁用上传按钮 |
| drag | boolean | false | 拖拽上传 |
| limit | number | 5 | 最大文件数 |
| fileSize | number | 5 | 单文件大小上限（MB） |
| fileType | string[] | ["doc","xls","ppt","txt","pdf"] | 允许的扩展名，传 `[]` 不限制 |
| isShowTip | boolean | true | 显示格式提示 |
| tip | string | "" | 自定义提示文字 |

### 暴露方法（通过 ref 调用）

- `reset()` — 清空已上传文件列表
- `isUploaded()` — 是否全部上传完成

### 上传地址

由 `src/layout/index.vue` 中的 `PbsfConfigProvider` 统一配置：
- 地址：`VITE_APP_BASE_API + VITE_APP_SYSTEM_NAME + /api/file/uploadFile`
- 鉴权：自动携带 Bearer Token

## PbsfImageUpload（公共图片上传）

标签 `<pbsf-image-upload>`，与 PbsfFileUpload 相同的 Props，默认 fileType 为 `['png','jpg','jpeg']`。

## PbsfFileList（公共文件列表展示）

只读文件列表，带查看和下载按钮。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | PBSFUploadFile[] | [] | 要展示的文件数组 |

## 在表单弹窗中的标准用法

### 模板部分

```html
<el-form-item label="附件" prop="attachmentList">
  <pbsf-file-upload
    ref="uploadRef"
    v-model="form.attachmentList"
    :limit="1"
    :file-size="10"
    :file-type="['pdf', 'docx', 'doc', 'xlsx', 'jpg', 'pptx']"
  />
</el-form-item>
```

### Script 部分

```js
const uploadRef = ref(null);

// 表单默认值 —— 必须是数组
const defaultForm = {
  attachmentList: [],
  attachment: undefined,  // 提交给后端的 URL 字段
};

// 校验规则 —— 用 type:"array" + min:1
const rules = reactive({
  attachmentList: [
    { required: true, type: "array", min: 1, message: "请上传附件", trigger: "change" },
  ],
});
```

### 编辑回显

从服务端拿到数据后，将 URL 字段转为组件需要的数组格式：

```js
async function getDetail(row) {
  const res = await getById({ id: row.id });
  const data = res.data || res;
  Object.assign(form, data);
  // 回显：把后端的 attachment URL 转为组件所需的数组格式
  if (!form.attachmentList?.length && form.attachment) {
    form.attachmentList = [{ id: undefined, name: "附件", originUrl: form.attachment }];
  }
}
```

### 提交时提取 URL

```js
async function handleSubmit() {
  const submitData = { ...form };
  // 提取附件 URL 传给后端
  if (submitData.attachmentList?.length) {
    submitData.attachment = submitData.attachmentList[0].originUrl;
  }
  const res = form.id ? await update(submitData) : await add(submitData);
  // ...
}
```

### 弹窗关闭时清空

```js
function handleClosed() {
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(form, { ...defaultForm });
  uploadRef.value?.reset(); // 清空上传组件状态
}
```

### 详情页只读展示

```html
<!-- 方式一：使用上传组件只读模式 -->
<pbsf-file-upload v-model="detail.attachmentList" read-only />

<!-- 方式二：使用文件列表表格 -->
<pbsf-file-list :value="detail.attachmentList" />
```

## 关键规则

1. **禁止使用原生 `<el-upload>`**，必须使用 `<pbsf-file-upload>` 或 `<pbsf-image-upload>`
2. v-model 绑定的表单字段必须是**数组**（`[]`），不能是字符串或 undefined
3. 弹窗关闭时调用 `uploadRef.value?.reset()` 清空上传状态
4. 校验规则用 `type: "array", min: 1` 判断是否已上传
5. 提交给后端时，从 `attachmentList[0].originUrl` 提取 URL
6. 图片上传场景用 `<pbsf-image-upload>`，文件附件用 `<pbsf-file-upload>`
7. 不传 `fileType` 时走组件默认值，传 `[]` 表示不限格式
