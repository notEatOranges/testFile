---
name: pbsf-form-snippets
description: PBSF 表单字段代码片段速查。当写编辑页、弹窗表单、需要各种类型表单字段(输入框、下拉、日期、开关、单选等)的标准写法时使用。按字段类型复制对应片段。
---

# pbsf-form-snippets

PBSF 表单字段速查。生成表单时按字段类型复制对应片段，所有片段均遵循项目规范。

## 通用约定

- `<el-form-item label="{中文名}" prop="{fieldName}">`
- 两列布局: `<el-col :span="12">`
- label-width 统一 `"120px"`（标签 4 字以内可用 `"100px"`）

## 文本输入

```vue
<el-input v-model.trim="form.{fieldName}" maxlength="50" show-word-limit placeholder="请输入{中文名}" />
```
maxlength 参考: 短文本 50, 中等 100-200, 长文本/textarea 500

## 多行文本

```vue
<el-input v-model.trim="form.{fieldName}" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入{中文名}" />
```

## 下拉选择

```vue
<el-select v-model="form.{fieldName}" clearable placeholder="请选择{中文名}" style="width: 100%">
  <el-option v-for="dict in {dictName}" :key="dict.value" :label="dict.label" :value="dict.value" />
</el-select>
```
配合: `const { {dictName} } = useDict('{dict_type}');`

## 远程搜索选择

```vue
<el-select v-model="form.{fieldName}" filterable remote reserve-keyword :remote-method="remoteMethod"
  clearable placeholder="请搜索{中文名}" style="width: 100%">
  <el-option v-for="item in {optionsList}" :key="item.id" :label="item.name" :value="item.id" />
</el-select>
```

## 日期选择

```vue
<!-- 日期 -->
<el-date-picker v-model="form.{fieldName}" value-format="YYYY-MM-DD" type="date"
  placeholder="请选择{中文名}" style="width: 100%" />

<!-- 日期时间 -->
<el-date-picker v-model="form.{fieldName}" value-format="YYYY-MM-DD HH:mm:ss" type="datetime"
  placeholder="请选择{中文名}" style="width: 100%" />

<!-- 日期范围 -->
<el-date-picker v-model="form.{dateRange}" value-format="YYYY-MM-DD" type="daterange"
  range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
```
日期范围注意: UI 绑定数组字段，提交时拆为 begin/end 两个字段:
```js
const params = { ...form, dateBegin: form.dateRange?.[0], dateEnd: form.dateRange?.[1], dateRange: undefined };
```

## 数字输入

```vue
<el-input-number v-model="form.{fieldName}" :min="0" :max="9999" :precision="0"
  controls-position="right" placeholder="请输入{中文名}" style="width: 100%" />
```

## 单选 / 多选

```vue
<!-- 单选 -->
<el-radio-group v-model="form.{fieldName}">
  <el-radio v-for="dict in {dictName}" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
</el-radio-group>

<!-- 多选 -->
<el-checkbox-group v-model="form.{fieldName}">
  <el-checkbox v-for="dict in {dictName}" :key="dict.value" :label="dict.value">{{ dict.label }}</el-checkbox>
</el-checkbox-group>
```

## 开关

```vue
<el-switch v-model="form.{fieldName}" active-value="0" inactive-value="1" />
```

## 文件上传

```vue
<!-- 图片上传 -->
<pbsf-image-upload v-model="form.{fieldName}" :limit="5" :file-size="5" />

<!-- 文件上传 -->
<pbsf-file-upload v-model="form.{fieldName}" :limit="10" :file-size="50" />

<!-- 只读文件列表 -->
<pbsf-file-list :value="form.{fieldName}" />
```
file-size 单位: MB。上传组件已通过 `pbsf-config-provider` 全局配置上传地址。

## 富文本编辑器

```vue
<pbsf-wang-editor v-model="form.{fieldName}" placeholder="请输入{中文名}" />
```

## 地图选点

```vue
<pbsf-map-picker v-model="form.{fieldName}" :limit="1" single />
```

## 地区选择

```vue
<pbsf-area-select v-model="form.{fieldName}" :level="3" />
```
level: 1=省, 2=省市, 3=省市区

## 表单校验规则片段

```js
// 必填
{ required: true, message: '{中文名}不能为空', trigger: 'blur' }  // 文本用 blur
{ required: true, message: '{中文名}不能为空', trigger: 'change' } // 选择用 change

// 手机号
{ validator: (rule, value, callback) => {
  if (!value) { callback(); } else if (!isPhone(value)) {
    callback(new Error('请输入正确的手机号'));
  } else { callback(); }
}, trigger: 'blur' }

// 身份证
{ validator: (rule, value, callback) => {
  if (!value) { callback(); } else if (!isIdCard(value)) {
    callback(new Error('请输入正确的身份证号'));
  } else { callback(); }
}, trigger: 'blur' }
```
验证器 import: `import { isPhone, isIdCard } from '@pbsf/validator';`
更多验证器见 `/skill pbsf-validator`
