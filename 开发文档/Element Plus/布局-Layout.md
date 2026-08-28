# Layout 布局

> 来源：[官方文档](https://element-plus.org/zh-CN/component/layout.html)

通过基础的 24 分栏，迅速简便地创建布局。

TIP

组件默认使用 Flex 布局，不需要手动设置 `type="flex"`。

请注意父容器避免使用 `inline` 相关样式，会导致组件宽度不能撑满。

列的基本单位为1，最多24个，最少0个。

## 基础布局 
使用列创建基础网格布局。

通过 `row` 和 `col` 组件，并通过 col 组件的 `span` 属性我们就可以自由地组合布局。

_

```vue
<template>
  <el-row>
    <el-col :span="24">
      <div class="grid-content ep-bg-purple-dark" />
    </el-col>
  </el-row>
  <el-row>
    <el-col :span="12">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :span="12">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
  </el-row>
  <el-row>
    <el-col :span="8">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :span="8">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
    <el-col :span="8">
      <div class="grid-content ep-bg-purple" />
    </el-col>
  </el-row>
  <el-row>
    <el-col :span="6">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :span="6">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
    <el-col :span="6">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :span="6">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
  </el-row>
  <el-row>
    <el-col :span="4">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :span="4">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
    <el-col :span="4">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :span="4">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
    <el-col :span="4">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :span="4">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
  </el-row>
</template>

<style>
.el-row {
  margin-bottom: 20px;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

隐藏源代码

## 分栏间隔 
支持列间距。

行提供 `gutter` 属性来指定列之间的间距，其默认值为0。

_

```vue
<template>
  <el-row :gutter="20">
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
</template>

<style>
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

隐藏源代码

## 混合布局 
通过基础的 1/24 分栏任意扩展组合形成较为复杂的混合布局。

_

```vue
<template>
  <el-row :gutter="20">
    <el-col :span="16"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="8"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
  <el-row :gutter="20">
    <el-col :span="8"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="8"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="4"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="4"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
  <el-row :gutter="20">
    <el-col :span="4"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="16"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="4"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
</template>

<style>
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

隐藏源代码

## 列偏移 
您可以指定列偏移量。

通过制定 col 组件的 `offset` 属性可以指定分栏偏移的栏数。

_

```vue
<template>
  <el-row :gutter="20">
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6" :offset="6">
      <div class="grid-content ep-bg-purple" />
    </el-col>
  </el-row>
  <el-row :gutter="20">
    <el-col :span="6" :offset="6">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :span="6" :offset="6">
      <div class="grid-content ep-bg-purple" />
    </el-col>
  </el-row>
  <el-row :gutter="20">
    <el-col :span="12" :offset="6">
      <div class="grid-content ep-bg-purple" />
    </el-col>
  </el-row>
</template>

<style>
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

隐藏源代码

## 对齐方式 
默认使用 flex 布局来对分栏进行灵活的对齐。

您可以通过`justify` 属性来定义子元素的排版方式，其取值为start、center、end、space-between、space-around或space-evenly。

_

```vue
<template>
  <el-row class="row-bg">
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple-light" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
  <el-row class="row-bg" justify="center">
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple-light" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
  <el-row class="row-bg" justify="end">
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple-light" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
  <el-row class="row-bg" justify="space-between">
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple-light" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
  <el-row class="row-bg" justify="space-around">
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple-light" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
  <el-row class="row-bg" justify="space-evenly">
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple-light" /></el-col>
    <el-col :span="6"><div class="grid-content ep-bg-purple" /></el-col>
  </el-row>
</template>

<style>
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

隐藏源代码

## 响应式布局 
参照了 Bootstrap 的 响应式设计，预设了五个响应尺寸：xs、sm、md、lg 和 xl。

_

```vue
<template>
  <el-row :gutter="10">
    <el-col :xs="8" :sm="6" :md="4" :lg="3" :xl="1">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :xs="4" :sm="6" :md="8" :lg="9" :xl="11">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
    <el-col :xs="4" :sm="6" :md="8" :lg="9" :xl="11">
      <div class="grid-content ep-bg-purple" />
    </el-col>
    <el-col :xs="8" :sm="6" :md="4" :lg="3" :xl="1">
      <div class="grid-content ep-bg-purple-light" />
    </el-col>
  </el-row>
</template>

<style>
.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

隐藏源代码

## 基于断点的隐藏类 
Element Plus 额外提供了一系列类名，用于在某些条件下隐藏元素。 这些类名可以添加在任何 DOM 元素或自定义组件上。 如果需要，请自行引入以下文件：

js

```
import 'element-plus/theme-chalk/display.css'
```

这些类名为：

-   `hidden-xs-only` - 当视口在 `xs` 尺寸时隐藏
-   `hidden-sm-only` - 当视口在 `sm` 尺寸时隐藏
-   `hidden-sm-and-down` - 当视口在 `sm` 及以下尺寸时隐藏
-   `hidden-sm-and-up` - 当视口在 `sm` 及以上尺寸时隐藏
-   `hidden-md-only` - 当视口在 `md` 尺寸时隐藏
-   `hidden-md-and-down` - 当视口在 `md` 及以下尺寸时隐藏
-   `hidden-md-and-up` - 当视口在 `md` 及以上尺寸时隐藏
-   `hidden-lg-only` - 当视口在 `lg` 尺寸时隐藏
-   `hidden-lg-and-down` - 当视口在 `lg` 及以下尺寸时隐藏
-   `hidden-lg-and-up` - 当视口在 `lg` 及以上尺寸时隐藏
-   `hidden-xl-only` - 当视口在 `xl` 尺寸时隐藏

## Row API 
### Row Attributes 
属性名

说明

类型

默认值

gutter

栅格间隔

`number`

0

justify

flex 布局下的水平排列方式

`enum`

start

align

flex 布局下的垂直排列方式

`enum`

—

tag

自定义元素标签

`string`

div

### Row Slots 
插槽名

说明

子标签

default

自定义默认内容

Col

## Col API 
### Col Attributes 
属性名

说明

类型

默认值

span

栅格占据的列数

`number`

24

offset

栅格左侧的间隔格数

`number`

0

push

栅格向右移动格数

`number`

0

pull

栅格向左移动格数

`number`

0

xs

`<768px` 响应式栅格数或者栅格属性对象

`number` / `object`

—

sm

`≥768px` 响应式栅格数或者栅格属性对象

`number` / `object`

—

md

`≥992px` 响应式栅格数或者栅格属性对象

`number` / `object`

—

lg

`≥1200px` 响应式栅格数或者栅格属性对象

`number` / `object`

—

xl

`≥1920px` 响应式栅格数或者栅格属性对象

`number` / `object`

—

tag

自定义元素标签

`string`

div

### Col Slots 
插槽名

说明

default

自定义默认内容

## 源代码 
[文档
[Icon 图标
[Link 链接](https://element-plus.org/zh-CN/component/link)
