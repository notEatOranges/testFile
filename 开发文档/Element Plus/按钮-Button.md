# Button 按钮

> 来源：[官方文档](https://element-plus.org/zh-CN/component/button.html)

常用的操作按钮。

## 基础用法

使用 `type`, `plain`, `round`, `dashed` 和 `circle` 来定义按钮的样式。

```vue
<el-button>Default</el-button>
<el-button type="primary">Primary</el-button>
<el-button type="success">Success</el-button>
<el-button type="info">Info</el-button>
<el-button type="warning">Warning</el-button>
<el-button type="danger">Danger</el-button>

<el-button plain>Plain</el-button>
<el-button type="primary" plain>Primary</el-button>
<el-button type="round">Round</el-button>
<el-button type="dashed">Dashed</el-button>
```

## 禁用状态

你可以使用 `disabled` 属性来定义按钮是否被禁用。该属性接受一个 `Boolean` 类型的值。

## 链接按钮

WARNING：`type="text"` 已被 **废弃**，将于版本 3.0.0 时 **移除**，请考虑切换至新的 API。

新的 API `link` 于 2.2.1 版本时添加，你可以使用 `type` API 设置链接按钮的主题样式。

## 文字按钮

没有边框和背景色的按钮。通过 `text: boolean` API 控制文字按钮。如果您想要使用老版样式的按钮，可以考虑使用 Link 组件。

## 图标按钮

使用图标为按钮添加更多的含义。使用 `icon` 属性来为按钮添加图标，您可以在 Icon 组件中找到所需图标。

## 按钮组

以按钮组的方式出现，常用于多项类似操作。使用 `<el-button-group>` 对多个按钮分组。在 2.11.9 中，您可以使用 `direction` 属性。

## 加载状态按钮

点击按钮来加载数据，并向用户反馈加载状态。通过设置 `loading` 属性为 `true` 来显示加载中状态。

您可以使用 `loading` 插槽或 `loadingIcon` 属性自定义您的 loading 图标（`loading` 插槽优先级高于 `loadingIcon` 属性）。

## 调整尺寸

按钮组件提供了几种额外的尺寸可供选择。使用 `size` 属性额外配置尺寸，可使用 `large` 和 `small` 两种值。

## 自定义元素标签 
您可以自定义元素标签。例如，button、div、路由链接、nuxt 链接。

## 自定义颜色 
您可以自定义按钮的颜色，我们将自动计算按钮处于 hover 和 active 状态时的颜色。自 2.13.7 起，`color` 属性也适用于 `link` 和 `text` 按钮。`dark` 属性可自动设置 `color` 为 dark 模式的颜色。

## Button API

### Button Attributes

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| size | 尺寸 | `enum` | — |
| type | 按钮类型，在设置 `color` 时，后者优先 | `enum` | — |
| plain | 是否为朴素按钮 | `boolean` | false |
| text (2.2.0) | 是否为文字按钮 | `boolean` | false |
| bg (2.2.0) | 是否显示文字按钮背景颜色 | `boolean` | false |
| link (2.2.1) | 是否为链接按钮 | `boolean` | false |
| round | 是否为圆角按钮 | `boolean` | false |
| circle | 是否为圆形按钮 | `boolean` | false |
| dashed (2.13.3) | 是否是虚线按钮 | `boolean` | false |
| loading | 是否为加载中状态 | `boolean` | false |
| loading-icon | 自定义加载中状态图标组件 | `string` / `Component` | Loading |
| disabled | 按钮是否为禁用状态 | `boolean` | false |
| icon | 图标组件 | `string` / `Component` | — |
| autofocus | 原生 `autofocus` 属性 | `boolean` | false |
| native-type | 原生 type 属性 | `enum` | button |
| auto-insert-space | 两个中文字符之间自动插入空格（仅当文本长度为 2 且所有字符均为中文时才生效） | `boolean` | false |
| color | 自定义按钮颜色，并自动计算 `hover` 和 `active` 触发后的颜色；自 2.13.7 起支持 `link`/`text` 按钮 | `string` | — |
| dark | dark 模式，意味着自动设置 `color` 为 dark 模式的颜色 | `boolean` | false |
| tag (2.3.4) | 自定义元素标签 | `string` / `Component` | button |

### Button Slots

| 插槽名 | 说明 |
| --- | --- |
| default | 自定义默认内容 |
| loading | 自定义加载中组件 |
| icon | 自定义图标组件 |

### Button Exposes

| 属性名 | 说明 | 类型 |
| --- | --- | --- |
| ref | 按钮 html 元素 | `object` |
| size | 按钮尺寸 | `object` |
| type | 按钮类型 | `object` |
| disabled | 按钮已禁用 | `object` |
| shouldAddSpace | 是否在两个字符之间插入空格 | `object` |

## ButtonGroup API

### ButtonGroup Attributes

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| size | 用于控制该按钮组内按钮的大小 | `enum` | — |
| type | 用于控制该按钮组内按钮的类型 | `enum` | — |
| direction (2.11.9) | 展示的方向 | `enum` | horizontal |

### ButtonGroup Slots

| 插槽名 | 说明 | 子标签 |
| --- | --- | --- |
| default | 自定义按钮组内容 | Button |
