# WXML 基础语法

> 来源：[官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/)

WXML（WeiXin Markup Language），结合 [基础组件](index)、[事件系统](event)，可以构建出页面的结构。

要完整了解 WXML 语法，请参考 [WXML 语法参考](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/)。

以下是一些常用的 WXML 语法。

##  数据绑定

```vue
<!-- page.wxml -->
<view> {{message}} </view>
```

```
// page.js
Page
```

##  列表渲染

```vue
<!-- page.wxml -->
<view wx:for="{{array}}"> {{item}} </view>
```

```
// page.js
Page
```

##  条件渲染

```vue
<!-- page.wxml-->
<view wx:if="{{view == 'WEBVIEW'}}"> WEBVIEW </view>
<view wx:elif="{{view == 'APP'}}"> APP </view>
<view wx:elif="{{view == 'MINA'}}"> MINA </view>
<view wx:else> UNKNOWN </view>
```

```
// page.js
Page
```

##  模板

```vue
<!-- page.wxml -->
<template name="staffName">
  <view>
    FirstName: {{firstName}}, LastName: {{lastName}}
  </view>
</template>

<template is="staffName" data="{{...staffA}}"></template>
<template is="staffName" data="{{...staffB}}"></template>
<template is="staffName" data="{{...staffC}}"></template>
```

```
// page.js
Page
```
