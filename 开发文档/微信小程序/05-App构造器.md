# App 构造器与全局逻辑

> 来源：[官方文档](https://developers.weixin.qq.com/miniprogram/dev/reference/api/App.html)

注册小程序。接受一个 `Object` 参数，其指定小程序的生命周期回调等。

`App()` 必须在 `app.js` 中调用，必须调用且只能调用一次。

现在并不推荐使用 `App()` 中的参数，而是使用对应的 `wx` 调用来代替。

##  参数

####  Object object

属性

类型

默认值

必填

说明

最低版本

[onLaunch
function

否

生命周期回调——监听小程序初始化。

[onShow
function

否

生命周期回调——监听小程序启动或切前台。

[onHide
function

否

生命周期回调——监听小程序切后台。

[onError
function

否

错误监听函数。

[onPageNotFound
function

否

页面不存在监听函数。

[1.9.90
[onUnhandledRejection
function

否

未处理的 Promise 拒绝事件监听函数。

[2.10.0
[onThemeChange
function

否

监听系统主题变化

[2.11.0
其他

any

否

开发者可以添加任意的函数或数据变量到 `Object` 参数中，用 `this` 可以访问（不推荐，应改用 [模块化](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/module) 的方式）

> 关于小程序前后台的定义和小程序的运行机制，请参考[运行机制](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism)章节。

###  onLaunch
小程序初始化完成时触发，全局只触发一次。参数也可以使用 [wx.getLaunchOptionsSync](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getLaunchOptionsSync.html) 获取。

**参数**：与 [wx.getLaunchOptionsSync](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getLaunchOptionsSync.html) 一致

###  onShow
小程序启动，或从后台进入前台显示时触发。也可以使用 [wx.onAppShow](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppShow.html) 绑定监听。

**参数**：与 [wx.onAppShow](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppShow.html) 一致

###  onHide
小程序从前台进入后台时触发。也可以使用 [wx.onAppHide](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppHide.html) 绑定监听。

**参数**：与 [wx.onAppHide](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppHide.html) 一致

###  onError
小程序发生脚本错误或 API 调用报错时触发。也可以使用 [wx.onError](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onError.html) 绑定监听。

**参数**：与 [wx.onError](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onError.html) 一致

###  onPageNotFound
> 基础库 1.9.90 开始支持，低版本需做[兼容处理](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility)。

小程序要打开的页面不存在时触发。也可以使用 [wx.onPageNotFound](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onPageNotFound.html) 绑定监听。注意事项请参考 [wx.onPageNotFound](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onPageNotFound.html)。

**参数**：与 [wx.onPageNotFound](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onPageNotFound.html) 一致

**示例代码：**

```
App
  onPageNotFound(res) {
    wx.redirectTo
    }) // 如果是 tabbar 页面，请使用 wx.switchTab
  }
})
```

###  onUnhandledRejection
> 基础库 2.10.0 开始支持，低版本需做[兼容处理](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility)。

小程序有未处理的 Promise 拒绝时触发。也可以使用 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html) 绑定监听。注意事项请参考 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html)。

**参数**：与 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html) 一致

###  onThemeChange
> 基础库 2.11.0 开始支持，低版本需做[兼容处理](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility)。

系统切换主题时触发。也可以使用 [wx.onThemeChange](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onThemeChange.html) 绑定监听。

**参数**：与 [wx.onThemeChange](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onThemeChange.html) 一致

##  示例代码

```
// 不推荐的写法
App
  onLaunch(options) {
    // 在启动时执行
  },
  onError(msg) {
    // 发生脚本错误时执行
    console.log
  },
})
```

```
// 推荐的写法
App
wx.onError(function () {
  // 发生脚本错误时执行
  console.log
})

// 在启动时执行
var options = wx.getLaunchOptionsSync
```

 and are for reference only. In case of any inconsistency and discrepancy between the Chinese version and the English version, the Chinese version shall prevail.Incorrect translation. [Tap to report.](javascript:;)
