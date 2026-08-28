# Form 表单

> 来源：[官方文档](https://element-plus.org/zh-CN/component/form.html)

表单包含 `input`、`radio`、`select`、`checkbox` 等需要用户输入的组件。 使用表单，您可以收集、验证和提交数据。

TIP

Form 组件已经从 2. x 的 Float 布局升级为 Flex 布局。

## 典型表单 
最基础的表单包括各种输入表单项，比如`input`、`select`、`radio`、`checkbox`等。

在每一个 `form` 组件中，你需要一个 `form-item` 字段作为输入项的容器，用于获取值与验证值。

Activity name

Activity zone

please select your zone

Activity time

\-

Instant delivery

Activity type

 Online activities Promotion activities  Offline activities  Simple brand exposure

Resources

SponsorVenue

Activity form

CreateCancel

_

```vue
<template>
  <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item label="Activity name">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="Activity zone">
      <el-select v-model="form.region" placeholder="please select your zone">
        <el-option label="Zone one" value="shanghai" />
        <el-option label="Zone two" value="beijing" />
      </el-select>
    </el-form-item>
    <el-form-item label="Activity time">
      <el-col :span="11">
        <el-date-picker
          v-model="form.date1"
          type="date"
          placeholder="Pick a date"
          style="width: 100%"
        />
      </el-col>
      <el-col :span="2" class="text-center">
        <span class="text-gray-500">-</span>
      </el-col>
      <el-col :span="11">
        <el-time-picker
          v-model="form.date2"
          placeholder="Pick a time"
          style="width: 100%"
        />
      </el-col>
    </el-form-item>
    <el-form-item label="Instant delivery">
      <el-switch v-model="form.delivery" />
    </el-form-item>
    <el-form-item label="Activity type">
      <el-checkbox-group v-model="form.type">
        <el-checkbox value="Online activities" name="type">
          Online activities
        </el-checkbox>
        <el-checkbox value="Promotion activities" name="type">
          Promotion activities
        </el-checkbox>
        <el-checkbox value="Offline activities" name="type">
          Offline activities
        </el-checkbox>
        <el-checkbox value="Simple brand exposure" name="type">
          Simple brand exposure
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="Resources">
      <el-radio-group v-model="form.resource">
        <el-radio value="Sponsor">Sponsor</el-radio>
        <el-radio value="Venue">Venue</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Activity form">
      <el-input v-model="form.desc" type="textarea" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">Create</el-button>
      <el-button>Cancel</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

// do not use same name with ref
const form = reactive
const onSubmit = () => {
  console.log
}
</script>
```

隐藏源代码

TIP

[W3C](https://www.w3.org/MarkUp/html-spec/html-spec_8.html#SEC8.2) 标准定义：

> _当一个表单中只有一个单行文本输入字段时， 浏览器应当将在此字段中按下 Enter （回车键）的行为视为提交表单的请求。_ 如果希望阻止这一默认行为，可以在 `<el-form>` 标签上添加 `@submit.prevent`。

## 行内表单 
当垂直方向空间受限且表单较简单时，可以在一行内放置表单。

通过设置 `inline` 属性为 `true` 可以让表单域变为行内的表单域。

Approved by

Activity zone

Activity zone

Activity time

Query

_

```vue
<template>
  <el-form :inline="true" :model="formInline" class="demo-form-inline">
    <el-form-item label="Approved by">
      <el-input v-model="formInline.user" placeholder="Approved by" clearable />
    </el-form-item>
    <el-form-item label="Activity zone">
      <el-select
        v-model="formInline.region"
        placeholder="Activity zone"
        clearable
      >
        <el-option label="Zone one" value="shanghai" />
        <el-option label="Zone two" value="beijing" />
      </el-select>
    </el-form-item>
    <el-form-item label="Activity time">
      <el-date-picker
        v-model="formInline.date"
        type="date"
        placeholder="Pick a date"
        clearable
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">Query</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const formInline = reactive
const onSubmit = () => {
  console.log
}
</script>

<style>
.demo-form-inline .el-input {
  --el-input-width: 220px;
}

.demo-form-inline .el-select {
  --el-select-width: 220px;
}
</style>
```

隐藏源代码

## 对齐方式 
根据你们的设计情况，来选择最佳的标签对齐方式。

您可以分别设置 `el-form-item` 的`label-position` 2.7.7. 如果值为空, 则会使用 `el-form`的`label-position`。

通过设置 `label-position` 属性可以改变表单域标签的位置，可选值为 `top`、`left`, 当设为 `top` 时标签会置于表单域的顶部

Form Align

LeftRightTop

Form Item Align

EmptyLeftRightTop

Name

Activity zone

Activity form

_

```vue
<template>
  <el-form
    :label-position="labelPosition"
    label-width="auto"
    :model="formLabelAlign"
    style="max-width: 600px"
  >
    <el-form-item label="Form Align" label-position="right">
      <el-radio-group v-model="labelPosition" aria-label="label position">
        <el-radio-button value="left">Left</el-radio-button>
        <el-radio-button value="right">Right</el-radio-button>
        <el-radio-button value="top">Top</el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Form Item Align" label-position="right">
      <el-radio-group
        v-model="itemLabelPosition"
        aria-label="item label position"
      >
        <el-radio-button value="">Empty</el-radio-button>
        <el-radio-button value="left">Left</el-radio-button>
        <el-radio-button value="right">Right</el-radio-button>
        <el-radio-button value="top">Top</el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Name" :label-position="itemLabelPosition">
      <el-input v-model="formLabelAlign.name" />
    </el-form-item>
    <el-form-item label="Activity zone" :label-position="itemLabelPosition">
      <el-input v-model="formLabelAlign.region" />
    </el-form-item>
    <el-form-item label="Activity form" :label-position="itemLabelPosition">
      <el-input v-model="formLabelAlign.type" />
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { FormItemProps, FormProps } from 'element-plus'

const labelPosition = ref<FormProps['labelPosition']>
const itemLabelPosition = ref<FormItemProps['labelPosition']>
const formLabelAlign = reactive
</script>
```

隐藏源代码

## 表单校验 
Form 组件允许你验证用户的输入是否符合规范，来帮助你找到和纠正错误。

`Form` 组件提供了表单验证的功能，只需为 `rules` 属性传入约定的验证规则，并将 `form-Item` 的 `prop` 属性设置为需要验证的特殊键值即可。 校验规则参见 [async-validator
Activity name

Activity zone

Activity zone

Activity count

Activity count

Activity time

\-

Instant delivery

Activity location

Home

Company

School

Activity type

 Online activities Promotion activities  Offline activities  Simple brand exposure

Resources

SponsorshipVenue

Activity form

Create Reset

_

```vue
<template>
  <el-form
    ref="ruleFormRef"
    style="max-width: 600px"
    :model="ruleForm"
    :rules="rules"
    label-width="auto"
  >
    <el-form-item label="Activity name" prop="name">
      <el-input v-model="ruleForm.name" />
    </el-form-item>
    <el-form-item label="Activity zone" prop="region">
      <el-select v-model="ruleForm.region" placeholder="Activity zone">
        <el-option label="Zone one" value="shanghai" />
        <el-option label="Zone two" value="beijing" />
      </el-select>
    </el-form-item>
    <el-form-item label="Activity count" prop="count">
      <el-select-v2
        v-model="ruleForm.count"
        placeholder="Activity count"
        :options="options"
      />
    </el-form-item>
    <el-form-item label="Activity time" required>
      <el-col :span="11">
        <el-form-item prop="date1">
          <el-date-picker
            v-model="ruleForm.date1"
            type="date"
            aria-label="Pick a date"
            placeholder="Pick a date"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col class="text-center" :span="2">
        <span class="text-gray-500">-</span>
      </el-col>
      <el-col :span="11">
        <el-form-item prop="date2">
          <el-time-picker
            v-model="ruleForm.date2"
            aria-label="Pick a time"
            placeholder="Pick a time"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-form-item>
    <el-form-item label="Instant delivery" prop="delivery">
      <el-switch v-model="ruleForm.delivery" />
    </el-form-item>
    <el-form-item label="Activity location" prop="location">
      <el-segmented v-model="ruleForm.location" :options="locationOptions" />
    </el-form-item>
    <el-form-item label="Activity type" prop="type">
      <el-checkbox-group v-model="ruleForm.type">
        <el-checkbox value="Online activities" name="type">
          Online activities
        </el-checkbox>
        <el-checkbox value="Promotion activities" name="type">
          Promotion activities
        </el-checkbox>
        <el-checkbox value="Offline activities" name="type">
          Offline activities
        </el-checkbox>
        <el-checkbox value="Simple brand exposure" name="type">
          Simple brand exposure
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="Resources" prop="resource">
      <el-radio-group v-model="ruleForm.resource">
        <el-radio value="Sponsorship">Sponsorship</el-radio>
        <el-radio value="Venue">Venue</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Activity form" prop="desc">
      <el-input v-model="ruleForm.desc" type="textarea" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm(ruleFormRef)">
        Create
      </el-button>
      <el-button @click="resetForm(ruleFormRef)">Reset</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { FormInstance, FormRules } from 'element-plus'

interface RuleForm {
  name: string
  region: string
  count: string
  date1: string
  date2: string
  delivery: boolean
  location: string
  type: string[]
  resource: string
  desc: string
}

const ruleFormRef = ref<FormInstance>
const ruleForm = reactive<RuleForm>
const locationOptions = ['Home', 'Company', 'School']

const rules = reactive<FormRules<RuleForm>>
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      console.log
    } else {
      console.log
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields
}

const options = Array.from({ length: 10000 }).map((_, idx) => 
}))
</script>
```

隐藏源代码

## 自定义校验规则 
这个例子中展示了如何使用自定义验证规则来完成密码的二次验证。

本例还使用`status-icon`属性为输入框添加了表示校验结果的反馈图标。

Password

Confirm

Age

Submit Reset

_

```vue
<template>
  <el-form
    ref="ruleFormRef"
    style="max-width: 600px"
    :model="ruleForm"
    status-icon
    :rules="rules"
    label-width="auto"
    class="demo-ruleForm"
  >
    <el-form-item label="Password" prop="pass">
      <el-input v-model="ruleForm.pass" type="password" autocomplete="off" />
    </el-form-item>
    <el-form-item label="Confirm" prop="checkPass">
      <el-input
        v-model="ruleForm.checkPass"
        type="password"
        autocomplete="off"
      />
    </el-form-item>
    <el-form-item label="Age" prop="age">
      <el-input v-model.number="ruleForm.age" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm(ruleFormRef)">
        Submit
      </el-button>
      <el-button @click="resetForm(ruleFormRef)">Reset</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { FormInstance, FormRules } from 'element-plus'

const ruleFormRef = ref<FormInstance>
const checkAge = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error('Please input the age'))
  }
  setTimeout(() => {
    if (!Number.isInteger(value)) {
      callback(new Error('Please input digits'))
    } else {
      if (value < 18) {
        callback(new Error('Age must be greater than 18'))
      } else {
        callback
      }
    }
  }, 1000)
}

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please input the password'))
  } else {
    if (ruleForm.checkPass !== '') {
      if (!ruleFormRef.value) return
      ruleFormRef.value.validateField
    }
    callback
  }
}
const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please input the password again'))
  } else if (value !== ruleForm.pass) {
    callback(new Error("Two inputs don't match!"))
  } else {
    callback
  }
}

const ruleForm = reactive
const rules = reactive<FormRules<typeof ruleForm>>
const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      console.log
    } else {
      console.log
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields
}
</script>
```

隐藏源代码

TIP

自定义的校验回调函数必须被调用。 校验规则参见 [async-validator
## 添加/删除表单项 
除了一次通过表单组件上的所有验证规则外. 您也可以动态地通过验证规则或删除单个表单字段的规则。

Email

Domain0

Delete

SubmitNew domainReset

_

```vue
<template>
  <el-form
    ref="formRef"
    style="max-width: 600px"
    :model="dynamicValidateForm"
    label-width="auto"
    class="demo-dynamic"
  >
    <el-form-item
      prop="email"
      label="Email"
      :rules="[
        {
          required: true,
          message: 'Please input email address',
          trigger: 'blur',
        },
        {
          type: 'email',
          message: 'Please input correct email address',
          trigger: ['blur', 'change'],
        },
      ]"
    >
      <el-input v-model="dynamicValidateForm.email" />
    </el-form-item>
    <el-form-item
      v-for="(domain, index) in dynamicValidateForm.domains"
      :key="domain.key"
      :label="'Domain' + index"
      :prop="'domains.' + index + '.value'"
      :rules="{
        required: true,
        message: 'domain can not be null',
        trigger: 'blur',
      }"
    >
      <el-input v-model="domain.value" />
      <el-button class="mt-2" @click.prevent="removeDomain(domain)">
        Delete
      </el-button>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm(formRef)">Submit</el-button>
      <el-button @click="addDomain">New domain</el-button>
      <el-button @click="resetForm(formRef)">Reset</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { FormInstance } from 'element-plus'

const formRef = ref<FormInstance>
const dynamicValidateForm = reactive<{
  domains: DomainItem[]
  email: string
}>
interface DomainItem {
  key: number
  value: string
}

const removeDomain = (item: DomainItem) => {
  const index = dynamicValidateForm.domains.indexOf
  if (index !== -1) {
    dynamicValidateForm.domains.splice
  }
}

const addDomain = () => {
  dynamicValidateForm.domains.push
    key: Date.now(),
    value: '',
  })
}

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      console.log
    } else {
      console.log
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields
}
</script>
```

隐藏源代码

## 数字类型验证 
数字类型的验证需要在 `v-model` 处加上 `.number` 的修饰符，这是 Vue 自身提供的用于将绑定值转化为 number 类型的修饰符。

age

SubmitReset

_

```vue
<template>
  <el-form
    ref="formRef"
    style="max-width: 600px"
    :model="numberValidateForm"
    label-width="auto"
    class="demo-ruleForm"
  >
    <el-form-item
      label="age"
      prop="age"
      :rules="[
        { required: true, message: 'age is required' },
        { type: 'number', message: 'age must be a number' },
      ]"
    >
      <el-input
        v-model.number="numberValidateForm.age"
        type="text"
        autocomplete="off"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm(formRef)">Submit</el-button>
      <el-button @click="resetForm(formRef)">Reset</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { FormInstance } from 'element-plus'

const formRef = ref<FormInstance>
const numberValidateForm = reactive
const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      console.log
    } else {
      console.log
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields
}
</script>
```

隐藏源代码

TIP

当一个 `el-form-item` 嵌套在另一个 `el-form-item` 中时，其标签宽度将为 `0`。 如果需要可以为 `el-form-item` 单独设置 `label-width` 属性。

## 尺寸控制 
表单中的所有子组件都继承了该表单的 `size` 属性。 同样，form-item 也有一个 `size` 属性。

如果希望某个表单项或某个表单组件的尺寸不同于 Form 上的 `size` 属性，直接为这个表单项或表单组件设置自己的 size 属性即可。

largedefaultsmall

LeftRightTop

Activity name

Activity zone

please select your zone

Activity time

\-

Activity type

 Online activities Promotion activities

Resources

SponsorVenue

CreateCancel

_

```vue
<template>
  <div>
    <el-radio-group v-model="size" aria-label="size control">
      <el-radio-button value="large">large</el-radio-button>
      <el-radio-button value="default">default</el-radio-button>
      <el-radio-button value="small">small</el-radio-button>
    </el-radio-group>
    <el-radio-group v-model="labelPosition" aria-label="position control">
      <el-radio-button value="left">Left</el-radio-button>
      <el-radio-button value="right">Right</el-radio-button>
      <el-radio-button value="top">Top</el-radio-button>
    </el-radio-group>
  </div>
  <br />
  <el-form
    style="max-width: 600px"
    :model="sizeForm"
    label-width="auto"
    :label-position="labelPosition"
    :size="size"
  >
    <el-form-item label="Activity name">
      <el-input v-model="sizeForm.name" />
    </el-form-item>
    <el-form-item label="Activity zone">
      <el-select
        v-model="sizeForm.region"
        placeholder="please select your zone"
      >
        <el-option label="Zone one" value="shanghai" />
        <el-option label="Zone two" value="beijing" />
      </el-select>
    </el-form-item>
    <el-form-item label="Activity time">
      <el-col :span="11">
        <el-date-picker
          v-model="sizeForm.date1"
          type="date"
          aria-label="Pick a date"
          placeholder="Pick a date"
          style="width: 100%"
        />
      </el-col>
      <el-col class="text-center" :span="1" style="margin: 0 0.5rem">-</el-col>
      <el-col :span="11">
        <el-time-picker
          v-model="sizeForm.date2"
          aria-label="Pick a time"
          placeholder="Pick a time"
          style="width: 100%"
        />
      </el-col>
    </el-form-item>
    <el-form-item label="Activity type">
      <el-checkbox-group v-model="sizeForm.type">
        <el-checkbox-button value="Online activities" name="type">
          Online activities
        </el-checkbox-button>
        <el-checkbox-button value="Promotion activities" name="type">
          Promotion activities
        </el-checkbox-button>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item label="Resources">
      <el-radio-group v-model="sizeForm.resource">
        <el-radio border value="Sponsor">Sponsor</el-radio>
        <el-radio border value="Venue">Venue</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">Create</el-button>
      <el-button>Cancel</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { ComponentSize, FormProps } from 'element-plus'

const size = ref<ComponentSize>
const labelPosition = ref<FormProps['labelPosition']>
const sizeForm = reactive
function onSubmit() {
  console.log
}
</script>

<style>
.el-radio-group {
  margin-right: 12px;
}
</style>
```

隐藏源代码

## 无障碍 
当在 `el-form-item` 内只有一个输入框（或相关的控制部件，如选择或复选框），表单项的标签将自动附加在那个输入框上。 如果 `el-form-item`内有多个 input，则表单项会被设置成 [WAI-ARIA](https://www.w3.org/WAI/standards-guidelines/aria/) [组](https://www.w3.org/TR/wai-aria/#group) 的 role。 在这种情况下，需要手动给每个 input 指定访问标签。

"Full Name" label is automatically attached to the input:

Full Name

"Your Information" serves as a label for the group of inputs. You must specify labels on the individal inputs. Placeholders are not replacements for using the "label" attribute.

Your Information

_

```vue
<template>
  <el-form label-position="left" label-width="auto" style="max-width: 600px">
    <el-space fill>
      <el-alert type="info" show-icon :closable="false">
        <p>"Full Name" label is automatically attached to the input:</p>
      </el-alert>
      <el-form-item label="Full Name">
        <el-input v-model="formAccessibility.fullName" />
      </el-form-item>
    </el-space>
    <el-space fill>
      <el-alert type="info" show-icon :closable="false">
        <p>
          "Your Information" serves as a label for the group of inputs. <br />
          You must specify labels on the individal inputs. Placeholders are not
          replacements for using the "label" attribute.
        </p>
      </el-alert>
      <el-form-item label="Your Information">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-input
              v-model="formAccessibility.firstName"
              aria-label="First Name"
              placeholder="First Name"
            />
          </el-col>
          <el-col :span="12">
            <el-input
              v-model="formAccessibility.lastName"
              aria-label="Last Name"
              placeholder="Last Name"
            />
          </el-col>
        </el-row>
      </el-form-item>
    </el-space>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const formAccessibility = reactive
</script>
```

隐藏源代码

## Form API 
### Form Attributes 
属性名

说明

类型

默认值

model

表单数据对象

`object`

—

rules

表单验证规则

`object`

—

inline

行内表单模式

`boolean`

false

label-position

表单域标签的位置， 当设置为 `left` 或 `right` 时，则也需要设置 `label-width` 属性

`enum`

right

label-width

标签的长度，例如 `'50px'`。 作为 Form 直接子元素的 form-item 会继承该值。 可以使用 `auto`。

`string` / `number`

''

label-suffix

表单域标签的后缀

`string`

''

hide-required-asterisk

是否隐藏必填字段标签旁边的红色星号。

`boolean`

false

require-asterisk-position

星号的位置。

`enum`

left

show-message

是否显示校验错误信息

`boolean`

true

inline-message

是否以行内形式展示校验信息

`boolean`

false

status-icon

是否在输入框中显示校验结果反馈图标

`boolean`

false

validate-on-rule-change

是否在 `rules` 属性改变后立即触发一次验证

`boolean`

true

size

用于控制该表单内组件的尺寸

`enum`

—

disabled

是否禁用该表单内的所有组件。 在 2.12.0 以前，如果设置为 `true`，它将覆盖内部组件的 `disabled` 属性。 在 2.12.0 之后，内部组件的配置优先。

`boolean`

false

scroll-to-error

当校验失败时，滚动到第一个错误表单项

`boolean`

false

scroll-into-view-options 2.3.2

当校验有失败结果时，滚动到第一个失败的表单项目 可通过 [scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) 配置

`object` / `boolean`

true

### Form Events 
名称

说明

类型

validate

任一表单项被校验后触发

`Function`

### Form Slots 
插槽名

说明

子标签

default

自定义默认内容

FormItem

### Form Exposes 
名称

说明

类型

validate

对整个表单的内容进行验证。 接收一个回调函数，或返回 `Promise`。

`Function`

validateField

验证具体的某个字段。

`Function`

resetFields

重置该表单项，将其值重置为初始值，并移除校验结果

`Function`

scrollToField

滚动到指定的字段

`Function`

clearValidate

清理某个字段的表单验证信息。

`Function`

fields 2.7.3

获取所有字段的 context

`array`

getField 2.10.2

获取字段的 context

`Function`

setInitialValues 2.13.1

设置表单字段的初始值。 当调用 `resetFields` 时，字段将重置为这些值。

`Function`

## FormItem API 
### FormItem Attributes 
属性名

说明

类型

Default

prop

`model` 的键名。 它可以是属性的路径（如 `a.b.0` 或 `['a', 'b', '0']`）。 在使用了 `validate`、`resetFields` 的方法时，该属性是必填的。

`string` / `string[]`

—

label

标签文本

`string`

—

label-position 2.7.7

表单域标签的位置， 当设置为 `left` 或 `right` 时，则也需要设置 `label-width` 属性 默认会继承 `Form`的`label-position`

`enum`

''

label-width

标签宽度，例如 `'50px'`。 可以使用 `auto`。

`string` / `number`

—

required

是否为必填项，如不设置，则会根据校验规则确认

`boolean`

—

rules

表单验证规则, 具体配置见[下表](#formitemrule), 更多内容可以参考[async-validator
`object`

—

error

表单域验证错误时的提示信息。设置该值会导致表单验证状态变为 error，并显示该错误信息。

`string`

—

show-message

是否显示校验错误信息

`boolean`

true

inline-message

是否在行内显示校验信息

`boolean`

false

size

用于控制该表单域下组件的默认尺寸

`enum`

—

for

和原生标签相同能力

`string`

—

validate-status

formitem 校验的状态

`enum`

—

#### FormItemRule 
名称

说明

类型

默认值

trigger

验证逻辑的触发方式

`enum`

—

TIP

如果您不想根据输入事件触发验证器， 在相应的输入类型组件上设置 `validate-event` 属性为 `false` (`<el-input>`, `<el-radio>`, `<el-select>`, . ……).

### FormItem Slots 
插槽名

说明

类型

default

表单的内容。

—

label

标签位置显示的内容

`object`

error

验证错误信息的显示内容

`object`

### FormItem Exposes 
名称

说明

类型

size

表单项大小

`object`

validateMessage

校验消息

`object`

validateState

校验状态

`object`

validate

验证表单项

`Function`

resetField

对该表单项进行重置，将其值重置为初始值并移除校验结果

`Function`

clearValidate

移除该表单项的校验结果

`Function`

setInitialValue 2.13.1

设置表单字段的初始值。 当调用 `resetFields` 时，字段将重置为这些值。

`Function`

## 类型声明 
显示类型声明

ts

```
type Arrayable<T> = T | T[]

type FormValidationResult = Promise<boolean>

// ValidateFieldsError: see [async-validator
type FormValidateCallback = 
) => Promise<void> | void

// RuleItem: see [async-validator
interface FormItemRule extends RuleItem {
  trigger?: Arrayable<string>
}

type Primitive = null | undefined | string | number | boolean | symbol | bigint
type BrowserNativeObject = Date | FileList | File | Blob | RegExp
type IsTuple<T extends ReadonlyArray<any>> = number extends T['length']
  ? false
  : true
type ArrayMethodKey = keyof any[]
type TupleKey<T extends ReadonlyArray<any>> = Exclude<keyof T, ArrayMethodKey>
type ArrayKey = number
type PathImpl<K extends string | number, V> = V extends
  Primitive | BrowserNativeObject
  ? `${K}`
  : `${K}` | `${K}.${Path<V>}`
type Path<T> =
  T extends ReadonlyArray<infer V>
    ? IsTuple<T> extends true
      ? {
          [K in TupleKey<T>]-?: PathImpl<Exclude<K, symbol>, T[K]>
        }[TupleKey<T>]
      : PathImpl<ArrayKey, V>
    : {
        [K in keyof T]-?: PathImpl<Exclude<K, symbol>, T[K]>
      }[keyof T]
type FieldPath<T> = T extends object ? Path<T> : never
// MaybeRef: see [@vueuse/core
// UnwrapRef: see [vue
type FormRules<T extends MaybeRef<Record<string, any> | string> = string> =
  Partial<
    Record<
      UnwrapRef<T> extends string ? UnwrapRef<T> : FieldPath<UnwrapRef<T>>,
      Arrayable<FormItemRule>
    >
  >

type FormItemValidateState = (typeof formItemValidateStates)[number]
type FormItemProps = ExtractPropTypes<typeof formItemProps>

type FormItemContext = FormItemProps & {
  $el: HTMLDivElement | undefined
  size: ComponentSize
  validateMessage: string
  validateState: FormItemValidateState
  isGroup: boolean
  labelId: string
  inputIds: string[]
  hasLabel: boolean
  fieldValue: any
  propString: string
  addInputId: (id: string) => void
  removeInputId: (id: string) => void
  validate: 
  ) => FormValidationResult
  resetField(): void
  clearValidate(): void
  setInitialValue: (value: any) => void
}
```

## 源代码 
[组件](https://github.com/element-plus/element-plus/tree/dev/packages/components/form) • [样式](https://github.com/element-plus/element-plus/tree/dev/packages/theme-chalk/src/form.scss) • [文档
## 贡献者 
[![](https://avatars.githubusercontent.com/u/6481596?v=4&size=64)](https://github.com/sxzz)[![](https://avatars.githubusercontent.com/u/24516654?v=4&size=64)](https://github.com/btea)[![](https://avatars.githubusercontent.com/u/15975785?v=4&size=64)](https://github.com/jw-foss)[![](https://avatars.githubusercontent.com/u/25154432?v=4&size=64)](https://github.com/YunYouJun)[![](https://avatars.githubusercontent.com/u/45450994?v=4&size=64)](https://github.com/warmthsea)[![](https://avatars.githubusercontent.com/u/38392315?v=4&size=64)](https://github.com/kooriookami)[![](https://avatars.githubusercontent.com/u/23313167?v=4&size=64)](https://github.com/tolking)[![](https://avatars.githubusercontent.com/u/91417411?v=4&size=64)](https://github.com/Dsaquel)[![](https://avatars.githubusercontent.com/u/58726932?v=4&size=64)](https://github.com/rzzf)[![](https://avatars.githubusercontent.com/u/93767616?v=4&size=64)](https://github.com/makedopamine)[![](https://avatars.githubusercontent.com/u/27342882?v=4&size=64)](https://github.com/ryuhangyeong)[![](https://avatars.githubusercontent.com/u/23251408?v=4&size=64)](https://github.com/chenxch)[![](https://avatars.githubusercontent.com/u/144010?v=4&size=64)](https://github.com/purepear)[![](https://avatars.githubusercontent.com/u/26672484?v=4&size=64)](https://github.com/msidolphin)[![](https://avatars.githubusercontent.com/u/53589602?v=4&size=64)](https://github.com/l246804)[![](https://avatars.githubusercontent.com/u/109521682?v=4&size=64)](https://github.com/snowbitx)[![](https://avatars.githubusercontent.com/u/75473409?v=4&size=64)](https://github.com/lxKylin)[![](https://avatars.githubusercontent.com/u/46493087?v=4&size=64)](https://github.com/FrontEndDog)[![](https://avatars.githubusercontent.com/u/61937205?v=4&size=64)](https://github.com/keeplearning66)[![](https://avatars.githubusercontent.com/u/24290011?v=4&size=64)](https://github.com/xingyixiang)[![](https://avatars.githubusercontent.com/u/34408516?v=4&size=64)](https://github.com/betavs)[![](https://avatars.githubusercontent.com/u/57785259?v=4&size=64)](https://github.com/w2xi)[![](https://avatars.githubusercontent.com/u/56016153?v=4&size=64)](https://github.com/zzjiaxiang)[![](https://avatars.githubusercontent.com/u/31850793?v=4&size=64)](https://github.com/ModyQyW)[![](https://avatars.githubusercontent.com/u/23100055?v=4&size=64)](https://github.com/holazz)[![](https://avatars.githubusercontent.com/u/26999792?v=4&size=64)](https://github.com/plainheart)[![](https://avatars.githubusercontent.com/u/32354856?v=4&size=64)](https://github.com/baiwusanyu-c)[![](https://avatars.githubusercontent.com/u/30518686?v=4&size=64)](https://github.com/emojiiii)[![](https://avatars.githubusercontent.com/u/20052395?v=4&size=64)](https://github.com/guizoxxv)[![](https://avatars.githubusercontent.com/u/29560987?v=4&size=64)](https://github.com/adaex)[![](https://avatars.githubusercontent.com/u/52363975?v=4&size=64)](https://github.com/wangbincyzj)[![](https://avatars.githubusercontent.com/u/7877834?v=4&size=64)](https://github.com/921)[![](https://avatars.githubusercontent.com/u/20501725?v=4&size=64)](https://github.com/lazerg)[![](https://avatars.githubusercontent.com/u/179441993?v=4&size=64)](https://github.com/lw56777)[![](https://avatars.githubusercontent.com/u/29867660?v=4&size=64)](https://github.com/yuhengshen)[![](https://avatars.githubusercontent.com/u/74746021?v=4&size=64)](https://github.com/xing403)[![](https://avatars.githubusercontent.com/u/35091020?v=4&size=64)](https://github.com/zzh948498)[![](https://avatars.githubusercontent.com/u/3362033?v=4&size=64)](https://github.com/cloudcome)[![](https://avatars.githubusercontent.com/u/47593280?v=4&size=64)](https://github.com/Xaw-xu)[![](https://avatars.githubusercontent.com/u/28420052?v=4&size=64)](https://github.com/Jackie-llv)[![](https://avatars.githubusercontent.com/u/46640919?v=4&size=64)](https://github.com/tiansQAQ)[![](https://avatars.githubusercontent.com/u/69044080?v=4&size=64)](https://github.com/wzc520pyfm)[![](https://avatars.githubusercontent.com/u/45762373?v=4&size=64)](https://github.com/koalaniu)[![](https://avatars.githubusercontent.com/u/1744129?v=4&size=64)](https://github.com/hminghe)[![](https://avatars.githubusercontent.com/u/10278227?v=4&size=64)](https://github.com/HeftyKoo)[![](https://avatars.githubusercontent.com/u/57385187?v=4&size=64)](https://github.com/opengraphica)[![](https://avatars.githubusercontent.com/u/17268607?v=4&size=64)](https://github.com/LYlanfeng)[![](https://avatars.githubusercontent.com/u/22659150?v=4&size=64)](https://github.com/ntnyq)[![](https://avatars.githubusercontent.com/u/83811542?v=4&size=64)](https://github.com/duyidao)[![](https://avatars.githubusercontent.com/u/57179957?v=4&size=64)](https://github.com/yeonjulee1005)[![](https://avatars.githubusercontent.com/u/39730999?v=4&size=64)](https://github.com/buqiyuan)[![](https://avatars.githubusercontent.com/u/33176053?v=4&size=64)](https://github.com/Ryan2128)[![](https://avatars.githubusercontent.com/u/21104054?v=4&size=64)](https://github.com/Alanscut)[![](https://avatars.githubusercontent.com/u/18051955?v=4&size=64)](https://github.com/qige2016)[![](https://avatars.githubusercontent.com/u/10802869?v=4&size=64)](https://github.com/Chris-Kin)[![](https://avatars.githubusercontent.com/u/12124478?v=4&size=64)](https://github.com/Hades-li)[![](https://avatars.githubusercontent.com/u/113576575?v=4&size=64)](https://github.com/lkdhy)[![](https://avatars.githubusercontent.com/u/54520846?v=4&size=64)](https://github.com/manyuemeiquqi)[![](https://avatars.githubusercontent.com/u/38113445?v=4&size=64)](https://github.com/assasin0076)[![](https://avatars.githubusercontent.com/u/19164948?v=4&size=64)](https://github.com/achin797)[![](https://avatars.githubusercontent.com/u/44761321?v=4&size=64)](https://github.com/xiaoxian521)[![](https://avatars.githubusercontent.com/u/28811207?v=4&size=64)](https://github.com/fanhefeng)[![](https://avatars.githubusercontent.com/u/121680374?v=4&size=64)](https://github.com/kaine0923)[![](https://avatars.githubusercontent.com/u/13634675?v=4&size=64)](https://github.com/virgosoy)[![](https://avatars.githubusercontent.com/u/9958583?v=4&size=64)](https://github.com/Otto-J)[![](https://avatars.githubusercontent.com/u/20987775?v=4&size=64)](https://github.com/cbbfcd)[![](https://avatars.githubusercontent.com/u/2883231?v=4&size=64)](https://github.com/HerringtonDarkholme)[![](https://avatars.githubusercontent.com/u/293591?v=4&size=64)](https://github.com/digitalkaoz)[![](https://avatars.githubusercontent.com/u/23303044?v=4&size=64)](https://github.com/imswk)[![](https://avatars.githubusercontent.com/u/9622779?v=4&size=64)
[DateTime Picker 日期时间选择器
[Input 输入框](https://element-plus.org/zh-CN/component/input)
