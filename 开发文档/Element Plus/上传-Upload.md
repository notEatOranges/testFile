# Upload 上传

> 来源：[官方文档](https://element-plus.org/zh-CN/component/upload.html)

通过点击或者拖拽上传文件。

## 基础用法 
通过 `slot` 你可以传入自定义的上传按钮类型和文字提示。 可通过设置 `limit` 和 `on-exceed` 来限制上传文件的个数和定义超出限制时的行为。 可通过设置 `before-remove` 来阻止文件移除操作。

Click to upload

jpg/png files with a size less than 500KB.

-   element-plus-logo.svg
    
    _press delete to remove_
-   element-plus-logo2.svg
    
    _press delete to remove_

_

```vue
<template>
  <el-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    multiple
    :on-preview="handlePreview"
    :on-remove="handleRemove"
    :before-remove="beforeRemove"
    :limit="3"
    :on-exceed="handleExceed"
  >
    <el-button type="primary">Click to upload</el-button>
    <template #tip>
      <div class="el-upload__tip">
        jpg/png files with a size less than 500KB.
      </div>
    </template>
  </el-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'

const fileList = ref<UploadUserFile[]>
const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  console.log
}

const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  console.log
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning
}

const beforeRemove: UploadProps['beforeRemove'] = (uploadFile, uploadFiles) => {
  return ElMessageBox.confirm
  ).then
    () => true,
    () => false
  )
}
</script>
```

隐藏源代码

## 覆盖前一个文件 
设置 `limit` 和 `on-exceed` 可以在选中时自动替换上一个文件。

select file

upload to server

limit 1 file, new file will cover the old file

_

```vue
<template>
  <el-upload
    ref="upload"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :limit="1"
    :on-exceed="handleExceed"
    :auto-upload="false"
  >
    <template #trigger>
      <el-button type="primary">select file</el-button>
    </template>
    <el-button class="ml-3" type="success" @click="submitUpload">
      upload to server
    </el-button>
    <template #tip>
      <div class="el-upload__tip text-red">
        limit 1 file, new file will cover the old file
      </div>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { genFileId } from 'element-plus'

import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus'

const upload = ref<UploadInstance>
const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value!.clearFiles
  const file = files[0] as UploadRawFile
  file.uid = genFileId
  upload.value!.handleStart
}

const submitUpload = () => {
  upload.value!.submit
}
</script>
```

隐藏源代码

## 用户头像 
在 `before-upload` 钩子中限制用户上传文件的格式和大小。

_

```vue
<template>
  <el-upload
    class="avatar-uploader"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :show-file-list="false"
    :on-success="handleAvatarSuccess"
    :before-upload="beforeAvatarUpload"
  >
    <img v-if="imageUrl" :src="imageUrl" class="avatar" />
    <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
  </el-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

import type { UploadProps } from 'element-plus'

const imageUrl = ref
const handleAvatarSuccess: UploadProps['onSuccess'] = 
) => {
  imageUrl.value = URL.createObjectURL
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type !== 'image/jpeg') {
    ElMessage.error
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error
    return false
  }
  return true
}
</script>

<style scoped>
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>
```

隐藏源代码

## 照片墙 
使用 `list-type` 属性来设定文件列表的样式。

-   ![](https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100)_press delete to remove_
-   ![](/images/plant-1.png)_press delete to remove_
-   ![](https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100)_press delete to remove_
-   ![](/images/plant-2.png)_press delete to remove_
-   ![](https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100)_press delete to remove_
-   ![](/images/figure-1.png)_press delete to remove_
-   ![](https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100)_press delete to remove_
-   ![](/images/figure-2.png)_press delete to remove_

_

```vue
<template>
  <el-upload
    v-model:file-list="fileList"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    list-type="picture-card"
    :on-preview="handlePictureCardPreview"
    :on-remove="handleRemove"
  >
    <el-icon><Plus /></el-icon>
  </el-upload>

  <el-dialog v-model="dialogVisible">
    <img w-full :src="dialogImageUrl" alt="Preview Image" />
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'

import type { UploadProps, UploadUserFile } from 'element-plus'

const fileList = ref<UploadUserFile[]>
const dialogImageUrl = ref
const dialogVisible = ref
const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log
}

const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url!
  dialogVisible.value = true
}
</script>
```

隐藏源代码

## 自定义缩略图 
使用 `scoped-slot` 属性来改变默认的缩略图模板样式。

_

```vue
<template>
  <el-upload action="#" list-type="picture-card" :auto-upload="false">
    <el-icon><Plus /></el-icon>

    <template #file="{ file }">
      <div>
        <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
        <span class="el-upload-list__item-actions">
          <span
            class="el-upload-list__item-preview"
            @click="handlePictureCardPreview(file)"
          >
            <el-icon><zoom-in /></el-icon>
          </span>
          <span
            v-if="!disabled"
            class="el-upload-list__item-delete"
            @click="handleDownload(file)"
          >
            <el-icon><Download /></el-icon>
          </span>
          <span
            v-if="!disabled"
            class="el-upload-list__item-delete"
            @click="handleRemove(file)"
          >
            <el-icon><Delete /></el-icon>
          </span>
        </span>
      </div>
    </template>
  </el-upload>

  <el-dialog v-model="dialogVisible">
    <img w-full :src="dialogImageUrl" alt="Preview Image" />
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Delete, Download, Plus, ZoomIn } from '@element-plus/icons-vue'

import type { UploadFile } from 'element-plus'

const dialogImageUrl = ref
const dialogVisible = ref
const disabled = ref
const handleRemove = (file: UploadFile) => {
  console.log
}

const handlePictureCardPreview = (file: UploadFile) => {
  dialogImageUrl.value = file.url!
  dialogVisible.value = true
}

const handleDownload = (file: UploadFile) => {
  console.log
}
</script>
```

隐藏源代码

## 图片列表缩略图 
Click to upload

jpg/png files with a size less than 500kb

-   !
    food.jpeg
    
    _press delete to remove_
-   !
    food2.jpeg
    
    _press delete to remove_

_

```vue
<template>
  <el-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :on-preview="handlePreview"
    :on-remove="handleRemove"
    list-type="picture"
  >
    <el-button type="primary">Click to upload</el-button>
    <template #tip>
      <div class="el-upload__tip">
        jpg/png files with a size less than 500kb
      </div>
    </template>
  </el-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { UploadProps, UploadUserFile } from 'element-plus'

const fileList = ref<UploadUserFile[]>
const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log
}

const handlePreview: UploadProps['onPreview'] = (file) => {
  console.log
}
</script>
```

隐藏源代码

## 上传文件列表控制 
通过 `on-change` 钩子函数来对上传文件的列表进行控制。

Click to upload

jpg/png files with a size less than 500kb

-   food.jpeg
    
    _press delete to remove_
-   food2.jpeg
    
    _press delete to remove_

_

```vue
<template>
  <el-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :on-change="handleChange"
  >
    <el-button type="primary">Click to upload</el-button>
    <template #tip>
      <div class="el-upload__tip">
        jpg/png files with a size less than 500kb
      </div>
    </template>
  </el-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { UploadProps, UploadUserFile } from 'element-plus'

const fileList = ref<UploadUserFile[]>
const handleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  fileList.value = fileList.value.slice
}
</script>
```

隐藏源代码

## 拖拽上传 
你可以将文件拖拽到特定区域以进行上传。

Drop file here or _click to upload_

jpg/png files with a size less than 500kb

_

```vue
<template>
  <el-upload
    class="upload-demo"
    drag
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    multiple
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      Drop file here or <em>click to upload</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        jpg/png files with a size less than 500kb
      </div>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'
</script>
```

隐藏源代码

## 上传目录 2.13.1 
通过 `directory` 属性启用文件夹上传。

启用后，只能选择文件夹；选择文件夹后，文件夹内的文件将被扁平化处理。

Drop directory here or _click to upload_

_

```vue
<template>
  <el-upload
    class="upload-demo"
    drag
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    directory
    multiple
    :on-change="handleChange"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      Drop directory here or <em>click to upload</em>
    </div>
  </el-upload>
</template>

<script setup lang="ts">
import { UploadFilled } from '@element-plus/icons-vue'

import type { UploadFile, UploadFiles } from 'element-plus'

const handleChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  console.log
}
</script>
```

隐藏源代码

## 手动上传 
select file

upload to server

jpg/png files with a size less than 500kb

_

```vue
<template>
  <el-upload
    ref="uploadRef"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :auto-upload="false"
  >
    <template #trigger>
      <el-button type="primary">select file</el-button>
    </template>

    <el-button class="ml-3" type="success" @click="submitUpload">
      upload to server
    </el-button>

    <template #tip>
      <div class="el-upload__tip">
        jpg/png files with a size less than 500kb
      </div>
    </template>
  </el-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { UploadInstance } from 'element-plus'

const uploadRef = ref<UploadInstance>
const submitUpload = () => {
  uploadRef.value!.submit
}
</script>
```

隐藏源代码

## API 
### 属性 
名称

描述

类型

默认值

action required

请求 URL

`string`

#

headers

设置上传的请求头部

`object`

—

method

设置上传请求方法

`string`

post

multiple

是否支持多选文件

`boolean`

false

data

上传时附带的额外参数 从 v2.3.13 支持 `Awaitable` 数据，和 `Function`

`object` / `Function`

{}

name

上传的文件字段名

`string`

file

with-credentials

支持发送 cookie 凭证信息

`boolean`

false

show-file-list

是否显示已上传文件列表

`boolean`

true

drag

是否启用拖拽上传

`boolean`

false

accept

接受上传的[文件类型](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-accept)（thumbnail-mode 模式下此参数无效）

`string`

''

crossorigin

原生属性 [crossorigin
`enum`

—

on-preview

点击文件列表中已上传的文件时的钩子

`Function`

—

on-remove

文件列表移除文件时的钩子

`Function`

—

on-success

文件上传成功时的钩子

`Function`

—

on-error

文件上传失败时的钩子

`Function`

—

on-progress

文件上传时的钩子

`Function`

—

on-change

文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用

`Function`

—

on-exceed

当超出限制时，执行的钩子函数

`Function`

—

before-upload

上传文件之前的钩子，参数为上传的文件， 若返回`false`或者返回 `Promise` 且被 reject，则停止上传。

`Function`

—

before-remove

删除文件之前的钩子，参数为上传的文件和文件列表， 若返回 `false` 或者返回 `Promise` 且被 reject，则停止删除。

`Function`

—

file-list / v-model:file-list

默认上传文件

`array`

[]

list-type

文件列表的类型

`enum`

text

auto-upload

是否自动上传文件

`boolean`

true

http-request

覆盖默认的 Xhr 行为，允许自行实现上传文件的请求

`Function`

[请参考ajaxUpload
disabled

是否禁用上传

`boolean`

false

limit

允许上传文件的最大数量

`number`

—

directory 2.13.1

是否支持上传文件夹。 启用后，只能选择文件夹；选择文件夹后，文件夹内的文件将被扁平化处理。

`boolean`

false

### 插槽 
名称

描述

类型

default

自定义默认内容

\-

trigger

触发文件选择框的内容

\-

tip

提示说明文字

\-

file

缩略图模板的内容

`object`

### 外部方法 
名称

描述

类型

abort

取消上传请求。 当指定了文件时，中止相应的待上传文件；当未指定文件时，中止所有待上传文件。

`Function`

submit

手动上传文件列表

`Function`

clearFiles

清空已上传的文件列表（该方法不支持在 `before-upload` 中调用）

`Function`

handleStart

手动选择文件

`Function`

handleRemove

手动移除文件。 `file` 和`rawFile` 已被合并。 `rawFile` 将在 `v2.2.0` 中移除

`Function`

## 类型声明 
显示类型声明

ts

```
type UploadFiles = UploadFile[]

type UploadUserFile = Omit<UploadFile, 'status' | 'uid'> &
  Partial<Pick<UploadFile, 'status' | 'uid'>>

type UploadStatus = 'ready' | 'uploading' | 'success' | 'fail'

type Awaitable<T> = Promise<T> | T

type Mutable<T> = { -readonly [P in keyof T]: T[P] }

interface UploadFile {
  name: string
  percentage?: number
  status: UploadStatus
  size?: number
  response?: unknown
  uid: number
  url?: string
  raw?: UploadRawFile
}

interface UploadProgressEvent extends ProgressEvent {
  percent: number
}

interface UploadRawFile extends File {
  uid: number
  isDirectory?: boolean
}

interface UploadRequestOptions {
  action: string
  method: string
  data: Record<string, string | Blob | [string | Blob, string] | string[]>
  filename: string
  file: UploadRawFile
  headers: Headers | Record<string, string | number | null | undefined>
  onError: (evt: UploadAjaxError) => void
  onProgress: (evt: UploadProgressEvent) => void
  onSuccess: (response: any) => void
  withCredentials: boolean
}
```

## 源代码 
[组件](https://github.com/element-plus/element-plus/tree/dev/packages/components/upload) • [样式](https://github.com/element-plus/element-plus/tree/dev/packages/theme-chalk/src/upload.scss) • [文档
## 贡献者 
[![](https://avatars.githubusercontent.com/u/6481596?v=4&size=64)](https://github.com/sxzz)[![](https://avatars.githubusercontent.com/u/25154432?v=4&size=64)](https://github.com/YunYouJun)[![](https://avatars.githubusercontent.com/u/15975785?v=4&size=64)](https://github.com/jw-foss)[![](https://avatars.githubusercontent.com/u/24516654?v=4&size=64)](https://github.com/btea)[![](https://avatars.githubusercontent.com/u/58726932?v=4&size=64)](https://github.com/rzzf)[![](https://avatars.githubusercontent.com/u/93767616?v=4&size=64)](https://github.com/makedopamine)[![](https://avatars.githubusercontent.com/u/23313167?v=4&size=64)](https://github.com/tolking)[![](https://avatars.githubusercontent.com/u/45450994?v=4&size=64)](https://github.com/warmthsea)[![](https://avatars.githubusercontent.com/u/30518686?v=4&size=64)](https://github.com/emojiiii)[![](https://avatars.githubusercontent.com/u/27342882?v=4&size=64)](https://github.com/ryuhangyeong)[![](https://avatars.githubusercontent.com/u/26833520?v=4&size=64)](https://github.com/josonho)[![](https://avatars.githubusercontent.com/u/91417411?v=4&size=64)](https://github.com/Dsaquel)[![](https://avatars.githubusercontent.com/u/33646534?v=4&size=64)](https://github.com/SevenDreamYang)[![](https://avatars.githubusercontent.com/u/49601167?v=4&size=64)](https://github.com/jianjunyuu)[![](https://avatars.githubusercontent.com/u/10278227?v=4&size=64)](https://github.com/HeftyKoo)[![](https://avatars.githubusercontent.com/u/23251408?v=4&size=64)](https://github.com/chenxch)[![](https://avatars.githubusercontent.com/u/23100055?v=4&size=64)](https://github.com/holazz)[![](https://avatars.githubusercontent.com/u/21104054?v=4&size=64)](https://github.com/Alanscut)[![](https://avatars.githubusercontent.com/u/29560987?v=4&size=64)](https://github.com/adaex)[![](https://avatars.githubusercontent.com/u/109521682?v=4&size=64)](https://github.com/snowbitx)[![](https://avatars.githubusercontent.com/u/54931083?v=4&size=64)](https://github.com/ShuaiNingZH)[![](https://avatars.githubusercontent.com/u/33254923?v=4&size=64)](https://github.com/yicheny)[![](https://avatars.githubusercontent.com/u/29867660?v=4&size=64)](https://github.com/yuhengshen)[![](https://avatars.githubusercontent.com/u/69418751?v=4&size=64)](https://github.com/selicens)[![](https://avatars.githubusercontent.com/u/186382194?v=4&size=64)](https://github.com/ly-yewu)[![](https://avatars.githubusercontent.com/u/35426360?v=4&size=64)](https://github.com/Jungzl)[![](https://avatars.githubusercontent.com/u/43257608?v=4&size=64)](https://github.com/Liao-js)[![](https://avatars.githubusercontent.com/u/126888254?v=4&size=64)](https://github.com/zhuchaoling)[![](https://avatars.githubusercontent.com/u/62926576?v=4&size=64)](https://github.com/ma-shuo)[![](https://avatars.githubusercontent.com/u/70570907?v=4&size=64)](https://github.com/chouchouji)[![](https://avatars.githubusercontent.com/u/10903843?v=4&size=64)](https://github.com/klren0312)[![](https://avatars.githubusercontent.com/u/63360587?v=4&size=64)](https://github.com/wkasunsampath)[![](https://avatars.githubusercontent.com/u/69044080?v=4&size=64)](https://github.com/wzc520pyfm)[![](https://avatars.githubusercontent.com/u/3642589?v=4&size=64)](https://github.com/youpinyao)[![](https://avatars.githubusercontent.com/u/1442212?v=4&size=64)](https://github.com/hhucqian)[![](https://avatars.githubusercontent.com/u/39689863?v=4&size=64)](https://github.com/GenerQAQ)[![](https://avatars.githubusercontent.com/u/101238421?v=4&size=64)](https://github.com/acyza)[![](https://avatars.githubusercontent.com/u/59350883?v=4&size=64)](https://github.com/init-qy)[![](https://avatars.githubusercontent.com/u/169252980?v=4&size=64)](https://github.com/xiaochenchen-igg-com)[![](https://avatars.githubusercontent.com/u/144010?v=4&size=64)](https://github.com/purepear)[![](https://avatars.githubusercontent.com/u/17268607?v=4&size=64)](https://github.com/LYlanfeng)[![](https://avatars.githubusercontent.com/u/26672484?v=4&size=64)](https://github.com/msidolphin)[![](https://avatars.githubusercontent.com/u/65154?v=4&size=64)](https://github.com/exherb)[![](https://avatars.githubusercontent.com/u/39730999?v=4&size=64)](https://github.com/buqiyuan)[![](https://avatars.githubusercontent.com/u/3841747?v=4&size=64)](https://github.com/sumy7)[![](https://avatars.githubusercontent.com/u/13826607?v=4&size=64)](https://github.com/wxyong)[![](https://avatars.githubusercontent.com/u/17539193?v=4&size=64)](https://github.com/gaoyia)[![](https://avatars.githubusercontent.com/u/44761321?v=4&size=64)](https://github.com/xiaoxian521)[![](https://avatars.githubusercontent.com/u/1181011?v=4&size=64)](https://github.com/qdechochen)[![](https://avatars.githubusercontent.com/u/46493087?v=4&size=64)](https://github.com/FrontEndDog)[![](https://avatars.githubusercontent.com/u/145281501?v=4&size=64)](https://github.com/typed-sigterm)[![](https://avatars.githubusercontent.com/u/34408516?v=4&size=64)](https://github.com/betavs)[![](https://avatars.githubusercontent.com/u/31885971?v=4&size=64)](https://github.com/wonderl17)[![](https://avatars.githubusercontent.com/u/17680888?v=4&size=64)](https://github.com/iamkun)[![](https://avatars.githubusercontent.com/u/28811207?v=4&size=64)](https://github.com/fanhefeng)[![](https://avatars.githubusercontent.com/u/10802869?v=4&size=64)](https://github.com/Chris-Kin)[![](https://avatars.githubusercontent.com/u/12124478?v=4&size=64)](https://github.com/Hades-li)[![](https://avatars.githubusercontent.com/u/37203836?v=4&size=64)](https://github.com/PikiLee)[![](https://avatars.githubusercontent.com/u/226283245?v=4&size=64)](https://github.com/E66Crisp)[![](https://avatars.githubusercontent.com/u/1836701?v=4&size=64)](https://github.com/HADB)[![](https://avatars.githubusercontent.com/u/41336612?v=4&size=64)](https://github.com/liulinboyi)[![](https://avatars.githubusercontent.com/u/33344586?v=4&size=64)](https://github.com/Meglody)[![](https://avatars.githubusercontent.com/u/30743104?v=4&size=64)
[TreeSelect 树形选择
[Avatar 头像](https://element-plus.org/zh-CN/component/avatar)
