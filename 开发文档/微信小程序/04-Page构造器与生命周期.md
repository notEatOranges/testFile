# Page 构造器与生命周期

> 来源：[官方文档](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)

注册小程序中的一个页面。它接受一个 `Object` 类型参数，其指定页面的初始数据、生命周期回调、事件处理函数等。

相关高级内容，可参考 [组件脚本](https://developers.weixin.qq.com/miniprogram/dev/framework/component-framework/scripting) 。

##  参数

####  Object object

属性

类型

默认值

必填

说明

[data
Object

页面的初始数据

options

Object

页面的组件选项，同 `Component` 构造器的 `options` ，需要基础库版本 [2.10.1
[behaviors
String Array

同 `Component` 构造器的 [behaviors](Behavior)，需要基础库版本 [2.9.2
[onLoad
function

生命周期回调—监听页面加载

[onShow
function

生命周期回调—监听页面显示

[onReady
function

生命周期回调—监听页面初次渲染完成

[onHide
function

生命周期回调—监听页面隐藏

[onUnload
function

生命周期回调—监听页面卸载

[onRouteDone
function

生命周期回调—监听路由动画完成

[onPullDownRefresh
function

监听用户下拉动作

[onReachBottom
function

页面上拉触底事件的处理函数

[onShareAppMessage
function

用户点击右上角转发

[onShareTimeline
function

用户点击右上角转发到朋友圈

[onAddToFavorites
function

用户点击右上角收藏

[onPageScroll
function

页面滚动触发事件的处理函数

[onResize
function

页面尺寸改变时触发，详见 [响应显示区域变化
[onTabItemTap
function

当前是 tab 页时，点击 tab 时触发

[onSaveExitState
function

页面销毁前保留状态回调

其他

any

开发者可以添加任意的函数或数据到 `Object` 参数中，在页面的函数中用 `this` 可以访问。这部分属性会在页面实例创建时进行一次深拷贝。**不推荐使用**

##  示例代码

```
//index.js
Page
  onLoad: function(options) {
    // Do some initialize when page load.
  },
  onShow: function() {
    // Do something when page show.
  },
  onReady: function() {
    // Do something when page ready.
  },
  onHide: function() {
    // Do something when page hide.
  },
  onUnload: function() {
    // Do something when page close.
  },
  onPullDownRefresh: function() {
    // Do something when pull down.
  },
  onReachBottom: function() {
    // Do something when page reach bottom.
  },
  onShareAppMessage: function () {
    // return custom share data when user share.
  },
  onPageScroll: function() {
    // Do something when page scroll
  },
  onResize: function() {
    // Do something when page resize
  },
  onTabItemTap(item) {
    console.log
    console.log
    console.log
  },
  // Event handler.
  viewTap: function() {
    this.setData
  },
  customData: {
    hi: 'MINA'
  }
})
```

在上例中，`data` 表示组件的数据，`setData` 表示对数据的更新。它们与 [`Component` 构造器](https://developers.weixin.qq.com/miniprogram/dev/framework/component-framework/scripting) 中对应的项目一致。

##  生命周期回调函数

生命周期的触发以及页面的路由方式详见 [页面路由](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route) 。

这些方法可以放在 `Page` 构造器中，也可以放在 `Component` 构造器的 `methods` 导出方法中。

###  onLoad
页面加载时触发。一个页面只会调用一次，可以在 onLoad 的参数中获取打开当前页面路径中的参数。

**参数：**

名称

类型

说明

query

Object

打开当前页面路径中的参数

###  onShow
页面显示/切入前台时触发。

####  onReady
页面初次渲染完成时触发。一个页面只会调用一次，代表页面已经准备妥当，可以和视图层进行交互。

注意：对界面内容进行设置的 API 如[wx.setNavigationBarTitle](https://developers.weixin.qq.com/miniprogram/dev/api/ui/navigation-bar/wx.setNavigationBarTitle.html)，请在`onReady`之后进行。详见[生命周期
###  onHide
页面隐藏/切入后台时触发。 如 [wx.navigateTo](https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html) 或底部 `tab` 切换到其他页面，小程序切入后台等。

###  onUnload
页面卸载时触发。如[wx.redirectTo](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.redirectTo.html)或[wx.navigateBack](https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateBackMiniProgram.html)到其他页面时。

###  onRouteDone
路由动画完成时触发。如 [wx.navigateTo](https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html) 页面完全推入后 或 [wx.navigateBack](https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateBackMiniProgram.html) 页面完全恢复时。

##  页面事件处理函数

###  onPullDownRefresh
监听用户下拉刷新事件。

-   需要在`app.json`的[`window`](../configuration/app#window)选项中或[页面配置](../configuration/page)中开启`enablePullDownRefresh`。
-   可以通过[wx.startPullDownRefresh](https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.startPullDownRefresh.html)触发下拉刷新，调用后触发下拉刷新动画，效果与用户手动下拉刷新一致。
-   当处理完数据刷新后，[wx.stopPullDownRefresh](https://developers.weixin.qq.com/miniprogram/dev/api/ui/pull-down-refresh/wx.stopPullDownRefresh.html)可以停止当前页面的下拉刷新。

###  onReachBottom
监听用户上拉触底事件。

-   可以在`app.json`的[`window`](../configuration/app#window)选项中或[页面配置](../configuration/page)中设置触发距离`onReachBottomDistance`。
-   在触发距离内滑动期间，本事件只会被触发一次。

###  onPageScroll
监听用户滑动页面事件。

**参数 Object object**:

属性

类型

说明

scrollTop

Number

页面在垂直方向已滚动的距离（单位px）

**注意：请只在需要的时候才在 page 中定义此方法，不要定义空方法。以减少不必要的事件派发对渲染层-逻辑层通信的影响。** **注意：请避免在 onPageScroll 中过于频繁的执行 `setData` 等引起[逻辑层-渲染层通信](https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips)的操作。尤其是每次传输大量数据，会影响通信耗时。**

###  onAddToFavorites
> 本接口为 Beta 版本，安卓 7.0.15 版本起支持，暂只在安卓平台支持

监听用户点击右上角菜单“收藏”按钮的行为，并自定义收藏内容。

**参数 Object object**:

参数

类型

说明

webViewUrl

String

页面中包含[web-view](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)组件时，返回当前[web-view](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)的url

此事件处理函数需要 return 一个 Object，用于自定义收藏内容：

字段

说明

默认值

title

自定义标题

页面标题或账号名称

imageUrl

自定义图片，显示图片长宽比为 1:1

页面截图

query

自定义query字段

当前页面的query

**示例代码**

```
Page
  onAddToFavorites(res) {
    // webview 页面返回 webViewUrl
    console.log
    return {
      title: '自定义标题',
      imageUrl: 'http://demo.png',
      query: 'name=xxx&age=xxx',
    }
  }
})
```

###  onShareAppMessage
监听用户点击页面内转发按钮（[button](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html) 组件 `open-type="share"`）或右上角菜单“转发”按钮的行为，并自定义转发内容。

**注意：只有定义了此事件处理函数，右上角菜单才会显示“转发”按钮**

**参数 Object object**:

参数

类型

说明

最低版本

from

String

转发事件来源。 `button`：页面内转发按钮； `menu`：右上角转发菜单

[1.2.4
target

Object

如果 `from` 值是 `button`，则 `target` 是触发这次转发事件的 `button`，否则为 `undefined`

[1.2.4
webViewUrl

String

页面中包含[web-view](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)组件时，返回当前[web-view](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)的url

[1.6.4
此事件处理函数需要 return 一个 Object，用于自定义转发内容，返回内容如下：

**自定义转发内容** 基础库 [2.8.1](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility) 起，分享图支持云图片。

字段

说明

默认值

最低版本

title

转发标题

当前小程序名称

path

转发路径

当前页面 path ，必须是以 / 开头的完整路径

imageUrl

自定义图片路径，可以是本地文件路径、代码包文件路径或者网络图片路径。支持PNG及JPG。显示图片长宽比是 5:4。

使用默认截图

[1.5.0
promise

如果该参数存在，则以 resolve 结果为准，如果三秒内不 resolve，分享会使用上面传入的默认参数

[2.12.0
**示例代码**

[在开发者工具中预览效果
```
Page
  onShareAppMessage() {
    const promise = new Promise
      setTimeout(() => {
        resolve
      }, 2000)
    })
    return {
      title: '自定义转发标题',
      path: '/page/user?id=123',
      promise 
    }
  }
})
```

###  onShareTimeline
> 基础库 2.11.3 开始支持，低版本需做[兼容处理](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility)。

> 详见[分享到朋友圈
监听右上角菜单“分享到朋友圈”按钮的行为，并自定义分享内容。

**注意：只有定义了此事件处理函数，右上角菜单才会显示“分享到朋友圈”按钮**

**自定义转发内容**

事件处理函数返回一个 Object，用于自定义分享内容，不支持自定义页面路径，返回内容如下：

字段

说明

默认值

最低版本

title

自定义标题，即朋友圈列表页上显示的标题

当前小程序名称

query

自定义页面路径中携带的参数，如 path?a=1&b=2 的 “?” 后面部分

当前页面路径携带的参数

imageUrl

自定义图片路径，可以是本地文件或者网络图片。支持 PNG 及 JPG，显示图片长宽比是 1:1。

默认使用小程序 Logo

promise

如果该参数存在，则以 resolve 结果为准，如果三秒内不 resolve，分享会使用上面传入的默认参数

[3.12.0
**示例代码**

```
Page
  onShareTimeline() {
    const promise = new Promise
      setTimeout(() => {
        resolve
      }, 2000)
    })
    return {
      title: '自定义转发标题',
      query: 'id=123',
      imageUrl: '/images/share.png',
      promise
    }
  }
})
```

###  onResize
> 基础库 2.4.0 开始支持，低版本需做[兼容处理](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility)。

页面尺寸改变时触发。详见 [响应显示区域变化
###  onTabItemTap
> 基础库 1.9.0 开始支持，低版本需做[兼容处理](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility)。

点击 tab 时触发

**Object 参数说明：**

参数

类型

说明

最低版本

index

String

被点击tabItem的序号，从0开始

[1.9.0
pagePath

String

被点击tabItem的页面路径

[1.9.0
text

String

被点击tabItem的按钮文字

[1.9.0
**示例代码：**

```
Page
  onTabItemTap(item) {
    console.log
    console.log
    console.log
  }
})
```

###  onSaveExitState
> 基础库 2.7.4 开始支持，低版本需做[兼容处理](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility)。

每当小程序可能被销毁之前，页面回调函数 `onSaveExitState` 会被调用，可以进行[退出状态](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism#_4-%E9%80%80%E5%87%BA%E7%8A%B6%E6%80%81)的保存。

 and are for reference only. In case of any inconsistency and discrepancy between the Chinese version and the English version, the Chinese version shall prevail.Incorrect translation. [Tap to report.](javascript:;)
