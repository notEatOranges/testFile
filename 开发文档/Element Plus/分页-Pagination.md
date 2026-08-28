# Pagination 分页

> 来源：[官方文档](https://element-plus.org/zh-CN/component/pagination.html)

当数据量过多时，使用分页分解数据。

## 基础用法 
设置`layout`，表示需要显示的内容，用逗号分隔，布局元素会依次显示。 分页元素包括：`prev`（跳转到上一页的按钮）、`next`（跳转到下一页的按钮）、`pager`（页码列表）、`jumper`（跳转输入框）、`total`（总条目数）、`sizes`（用于设置每页条数的选择器）以及 `->`（该符号之后的所有元素将被靠右对齐）。

When you have few pages

-   1
-   2
-   3
-   4
-   5

When you have more than 7 pages

-   1
-   2
-   3
-   4
-   5
-   6

-   100

_

```vue
<template>
  <div class="example-pagination-block">
    <div class="example-demonstration">When you have few pages</div>
    <el-pagination layout="prev, pager, next" :total="50" />
  </div>
  <div class="example-pagination-block">
    <div class="example-demonstration">When you have more than 7 pages</div>
    <el-pagination layout="prev, pager, next" :total="1000" />
  </div>
</template>

<style scoped>
.example-pagination-block + .example-pagination-block {
  margin-top: 10px;
}
.example-pagination-block .example-demonstration {
  margin-bottom: 16px;
}
</style>
```

隐藏源代码

## 设置最大页码按钮数 
默认情况下，当总页数超过 7 页时，Pagination 会折叠多余的页码按钮。 通过 `pager-count` 属性可以设置最大页码按钮数。

-   1
-   2
-   3
-   4
-   5
-   6
-   7
-   8
-   9
-   10

-   50

_

```vue
<template>
  <el-pagination
    :page-size="20"
    :pager-count="11"
    layout="prev, pager, next"
    :total="1000"
  />
</template>
```

隐藏源代码

## 带有背景色的分页 
设置`background`属性可以为分页按钮添加背景色。

-   1
-   2
-   3
-   4
-   5
-   6

-   100

_[](https://element-plus.run/#eyJBcHAudnVlIjoiPHRlbXBsYXRlPlxuICA8ZWwtcGFnaW5hdGlvbiBiYWNrZ3JvdW5kIGxheW91dD1cInByZXYsIHBhZ2VyLCBuZXh0XCIgOnRvdGFsPVwiMTAwMFwiIC8+XG48L3RlbXBsYXRlPlxuIn0=)__

```vue
<template>
  <el-pagination background layout="prev, pager, next" :total="1000" />
</template>
```

隐藏源代码

## 小型分页 
在空间有限的情况下，可以使用简单的小型分页。

通过`size`更改大小 这是个 `small`的例子

-   1
-   2
-   3
-   4
-   5

-   1
-   2
-   3
-   4
-   5

_

```vue
<template>
  <el-pagination size="small" layout="prev, pager, next" :total="50" />
  <el-pagination
    size="small"
    background
    layout="prev, pager, next"
    :total="50"
    class="mt-4"
  />
</template>
```

隐藏源代码

## 当只有一页时隐藏分页 
当只有一页时，通过设置 `hide-on-single-page` 属性来隐藏分页。

* * *

-   1

_

```vue
<template>
  <div>
    <el-switch v-model="value" />
    <hr class="my-4" />
    <el-pagination
      :hide-on-single-page="value"
      :total="5"
      layout="prev, pager, next"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref
</script>
```

隐藏源代码

## 附加功能 
根据场景需要，可以添加其他功能模块。

此示例是一个完整的用例。 使用了 `size-change` 和 `current-change` 事件来处理页码大小和当前页变动时候触发的事件。 `page-sizes`接受一个整数类型的数组，数组元素为展示的选择每页显示个数的选项，`[100, 200, 300, 400]` 表示四个选项，每页显示 100 个，200 个，300 个或者 400 个。

defaultlargesmall

background:

disabled:

* * *

Total item count

Total 1000

-   1

-   3
-   4
-   5
-   6
-   7

-   10

Change page size

-   1

-   3
-   4
-   5
-   6
-   7

-   10

Jump to

-   1

-   3
-   4
-   5
-   6
-   7

-   10

Go to

All combined

Total 400

-   1
-   2
-   3
-   4

Go to

_

```vue
<template>
  <div class="flex items-center mb-4">
    <el-radio-group v-model="size" class="mr-4">
      <el-radio-button value="default">default</el-radio-button>
      <el-radio-button value="large">large</el-radio-button>

      <el-radio-button value="small">small</el-radio-button>
    </el-radio-group>
    <div>
      background:
      <el-switch v-model="background" class="ml-2" />
    </div>
    <div class="ml-4">
      disabled: <el-switch v-model="disabled" class="ml-2" />
    </div>
  </div>

  <hr class="my-4" />

  <div class="demo-pagination-block">
    <div class="demonstration">Total item count</div>
    <el-pagination
      v-model:current-page="currentPage1"
      :page-size="100"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="total, prev, pager, next"
      :total="1000"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  <div class="demo-pagination-block">
    <div class="demonstration">Change page size</div>
    <el-pagination
      v-model:current-page="currentPage2"
      v-model:page-size="pageSize2"
      :page-sizes="[100, 200, 300, 400]"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="sizes, prev, pager, next"
      :total="1000"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  <div class="demo-pagination-block">
    <div class="demonstration">Jump to</div>
    <el-pagination
      v-model:current-page="currentPage3"
      v-model:page-size="pageSize3"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="prev, pager, next, jumper"
      :total="1000"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  <div class="demo-pagination-block">
    <div class="demonstration">All combined</div>
    <el-pagination
      v-model:current-page="currentPage4"
      v-model:page-size="pageSize4"
      :page-sizes="[100, 200, 300, 400]"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="400"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { ComponentSize } from 'element-plus'

const currentPage1 = ref
const currentPage2 = ref
const currentPage3 = ref
const currentPage4 = ref
const pageSize2 = ref
const pageSize3 = ref
const pageSize4 = ref
const size = ref<ComponentSize>
const background = ref
const disabled = ref
const handleSizeChange = (val: number) => {
  console.log
}
const handleCurrentChange = (val: number) => {
  console.log
}
</script>

<style scoped>
.demo-pagination-block + .demo-pagination-block {
  margin-top: 10px;
}
.demo-pagination-block .demonstration {
  margin-bottom: 16px;
}
</style>
```

隐藏源代码

## API 
### 属性 
属性名

说明

类型

默认值

size 2.7.6

分页大小

`enum`

'default'

background

是否为分页按钮添加背景色

`boolean`

false

page-size / v-model:page-size

每页显示条目个数

`number`

—

default-page-size

每页默认的条目个数，不设置时默认为10

`number`

—

total

总条目数

`number`

—

page-count

总页数， `total` 和 `page-count` 设置任意一个就可以达到显示页码的功能；如果要支持 `page-sizes` 的更改，则需要使用 `total` 属性

`number`

—

pager-count

设置最大页码按钮数。 页码按钮的数量，当总页数超过该值时会折叠

`number`

7

current-page / v-model:current-page

当前页数

`number`

—

default-current-page

当前页数的默认初始值，不设置时默认为 1

`number`

—

layout

组件布局，子组件名用逗号分隔

`string`

prev, pager, next, jumper, ->, total

page-sizes

每页显示个数选择器的选项设置

`array`

[10, 20, 30, 40, 50, 100]

append-size-to 2.8.4

下拉框挂载到哪个 DOM 元素

`string`

—

popper-class

每页显示个数选择器的下拉框类名

`string`

''

popper-style 2.11.5

每页显示个数选择器的下拉框样式

`string` / `object`

aaa

prev-text

替代图标显示的上一页文字

`string`

''

prev-icon

上一页的图标， 比 `prev-text` 优先级更高

`string` / `Component`

ArrowLeft

next-text

替代图标显示的下一页文字

`string`

''

next-icon

下一页的图标， 比 `next-text` 优先级更低

`string` / `Component`

ArrowRight

disabled

是否禁用分页

`boolean`

false

teleported 2.3.13

是否将下拉菜单teleport至 body

`boolean`

true

hide-on-single-page

只有一页时是否隐藏

`boolean`

false

small deprecated

是否使用小型分页样式

`boolean`

false

WARNING

我们现在会检查一些不合理的用法，如果发现分页器未显示，可以核对是否违反以下情形：

-   `total` 和 `page-count` 必须传一个，不然组件无法判断总页数；优先使用 `page-count`;
-   如果传入了 `current-page`，必须监听 `current-page` 变更的事件（`@update:current-page`），否则分页切换不起作用；
-   如果传入了 `page-size`，且布局包含 page-size 选择器（即 `layout` 包含 `sizes`），必须监听 `page-size` 变更的事件（`@update:page-size`），否则分页大小的变化将不起作用。

### 事件 
名称

说明

类型

size-change

`page-size` 改变时触发

`Function`

current-change

`current-page` 改变时触发

`Function`

change 2.4.4

`current-page` 或 `page-size` 更改时触发

`Function`

prev-click

用户点击上一页按钮改变当前页时触发

`Function`

next-click

用户点击下一页按钮改变当前页时触发

`Function`

WARNING

以上事件不推荐使用（但由于兼容的原因仍然支持，在以后的版本中将会被删除）；如果要监听 current-page 和 page-size 的改变，使用 `v-model` 双向绑定是个更好的选择。

### 插槽 
名称

说明

default

自定义内容 设置文案，需要在 `layout` 中列出 `slot`

## 源代码 
[组件](https://github.com/element-plus/element-plus/tree/dev/packages/components/pagination) • [样式](https://github.com/element-plus/element-plus/tree/dev/packages/theme-chalk/src/pagination.scss) • [文档
## 贡献者 
[![](https://avatars.githubusercontent.com/u/6481596?v=4&size=64)](https://github.com/sxzz)[![](https://avatars.githubusercontent.com/u/25154432?v=4&size=64)](https://github.com/YunYouJun)[![](https://avatars.githubusercontent.com/u/15975785?v=4&size=64)](https://github.com/jw-foss)[![](https://avatars.githubusercontent.com/u/5559812?v=4&size=64)](https://github.com/metanas)[![](https://avatars.githubusercontent.com/u/24516654?v=4&size=64)](https://github.com/btea)[![](https://avatars.githubusercontent.com/u/23313167?v=4&size=64)](https://github.com/tolking)[![](https://avatars.githubusercontent.com/u/27342882?v=4&size=64)](https://github.com/ryuhangyeong)[![](https://avatars.githubusercontent.com/u/93767616?v=4&size=64)](https://github.com/makedopamine)[![](https://avatars.githubusercontent.com/u/45450994?v=4&size=64)](https://github.com/warmthsea)[![](https://avatars.githubusercontent.com/u/38392315?v=4&size=64)](https://github.com/kooriookami)[![](https://avatars.githubusercontent.com/u/26672484?v=4&size=64)](https://github.com/msidolphin)[![](https://avatars.githubusercontent.com/u/58726932?v=4&size=64)](https://github.com/rzzf)[![](https://avatars.githubusercontent.com/u/29560987?v=4&size=64)](https://github.com/adaex)[![](https://avatars.githubusercontent.com/u/23251408?v=4&size=64)](https://github.com/chenxch)[![](https://avatars.githubusercontent.com/u/23100055?v=4&size=64)](https://github.com/holazz)[![](https://avatars.githubusercontent.com/u/30883395?v=4&size=64)](https://github.com/webvs2)[![](https://avatars.githubusercontent.com/u/50739490?v=4&size=64)](https://github.com/Chuck-Lau)[![](https://avatars.githubusercontent.com/u/3898898?v=4&size=64)](https://github.com/ioslh)[![](https://avatars.githubusercontent.com/u/62818957?v=4&size=64)](https://github.com/ZacharyBear)[![](https://avatars.githubusercontent.com/u/61937205?v=4&size=64)](https://github.com/keeplearning66)[![](https://avatars.githubusercontent.com/u/46493087?v=4&size=64)](https://github.com/FrontEndDog)[![](https://avatars.githubusercontent.com/u/29867660?v=4&size=64)](https://github.com/yuhengshen)[![](https://avatars.githubusercontent.com/u/91417411?v=4&size=64)](https://github.com/Dsaquel)[![](https://avatars.githubusercontent.com/u/117748716?v=4&size=64)](https://github.com/thinkasany)[![](https://avatars.githubusercontent.com/u/35400818?v=4&size=64)](https://github.com/ToyCat93)[![](https://avatars.githubusercontent.com/u/56016153?v=4&size=64)](https://github.com/zzjiaxiang)[![](https://avatars.githubusercontent.com/u/108655466?v=4&size=64)](https://github.com/Karolis-Stoncius)[![](https://avatars.githubusercontent.com/u/43257608?v=4&size=64)](https://github.com/Liao-js)[![](https://avatars.githubusercontent.com/u/24290011?v=4&size=64)](https://github.com/xingyixiang)[![](https://avatars.githubusercontent.com/u/37095891?v=4&size=64)](https://github.com/boomboy4)[![](https://avatars.githubusercontent.com/u/69044080?v=4&size=64)](https://github.com/wzc520pyfm)[![](https://avatars.githubusercontent.com/u/20925158?v=4&size=64)](https://github.com/fzq1998)[![](https://avatars.githubusercontent.com/u/144010?v=4&size=64)](https://github.com/purepear)[![](https://avatars.githubusercontent.com/u/11409069?v=4&size=64)](https://github.com/freedomlang)[![](https://avatars.githubusercontent.com/u/39730999?v=4&size=64)](https://github.com/buqiyuan)[![](https://avatars.githubusercontent.com/u/134276765?v=4&size=64)](https://github.com/zwgwf)[![](https://avatars.githubusercontent.com/u/26999792?v=4&size=64)](https://github.com/plainheart)[![](https://avatars.githubusercontent.com/u/33827314?v=4&size=64)](https://github.com/gjfei)[![](https://avatars.githubusercontent.com/u/10475770?v=4&size=64)](https://github.com/DarkHighness)[![](https://avatars.githubusercontent.com/u/21104054?v=4&size=64)](https://github.com/Alanscut)[![](https://avatars.githubusercontent.com/u/20411966?v=4&size=64)](https://github.com/SorrowX)[![](https://avatars.githubusercontent.com/u/10802869?v=4&size=64)](https://github.com/Chris-Kin)[![](https://avatars.githubusercontent.com/u/12124478?v=4&size=64)](https://github.com/Hades-li)[![](https://avatars.githubusercontent.com/u/26358323?v=4&size=64)](https://github.com/wangyuhuiever)[![](https://avatars.githubusercontent.com/u/44761321?v=4&size=64)](https://github.com/xiaoxian521)[![](https://avatars.githubusercontent.com/u/30518686?v=4&size=64)](https://github.com/emojiiii)[![](https://avatars.githubusercontent.com/u/226283245?v=4&size=64)](https://github.com/E66Crisp)[![](https://avatars.githubusercontent.com/u/145281501?v=4&size=64)](https://github.com/typed-sigterm)[![](https://avatars.githubusercontent.com/u/105651386?v=4&size=64)](https://github.com/heappynd)[![](https://avatars.githubusercontent.com/u/35426360?v=4&size=64)
[Infinite Scroll 无限滚动
[Progress 进度条](https://element-plus.org/zh-CN/component/progress)
