# mp-weixin · 截屏/录屏防泄漏——能力边界与 API 限制坑点

> **技术栈**：微信原生小程序（非 uni-app，原生 Page + wx API）
> **目标平台**：mp-weixin
> **整理日期**：2026-07-29
> **结论先行**：微信小程序**无法像原生 App（FLAG_SECURE）那样彻底阻止截屏/录屏**，只能「遮罩 + 监听 + 记录」。且**录屏监听是 iOS 独占**，Android 微信完全检测不到录屏；截屏监听只能抓「系统截屏按键」，第三方截屏 App 抓不到。做「禁止截屏录屏」需求前，必须先把这些能力边界对齐预期，否则上线即翻车。
>
> ⚠️ **一句话规则**：**录屏只能 iOS 防；截屏只能抓系统按键；防泄漏靠 `setVisualEffectOnCapture('hidden')` 遮罩 + 监听记录，且遮罩必须在 `onHide` 恢复 `none` 否则污染全小程序所有页面。**

---

## 相关 API 与能力矩阵（官方文档确认）

| 能力 | API | 基础库 | iOS | Android |
| --- | --- | --- | --- | --- |
| 截屏/录屏时**隐藏内容**（变黑遮罩） | `wx.setVisualEffectOnCapture({ visualEffect: 'hidden' })` | 2.21.3 | ✅ | ⚠️ 部分机型不生效 |
| 监听**截屏**（系统截屏键） | `wx.onUserCaptureScreen(cb)` / `offUserCaptureScreen(cb)` | 1.4.0 | ✅ | ✅ |
| **主动查询**当前是否录屏 | `wx.getScreenRecordingState({ success })` | 2.24.0 | ✅ | ❌ 不支持 |
| **监听**录屏开始/结束 | `wx.onScreenRecordingStateChanged(cb)` / `off...` | 2.24.0 | ✅ | ❌ 不支持 |

> 回调参数（踩坑点，字段名容易记错）：
> - `onScreenRecordingStateChanged(cb)` → `res.state` 取值 **`'start'` / `'stop'`**
> - `getScreenRecordingState({success})` → `res.state` 取值 **`'on'` / `'off'`**
> （**两套字段值不一样**，别混用，否则判断永远为假。）

## 现象 / 容易踩的雷

1. **Android 上「防录屏」形同虚设**：`onScreenRecordingStateChanged` / `getScreenRecordingState` 在 Android 微信根本不存在（`wx.onScreenRecordingStateChanged` 为 `undefined`），安卓用户开录屏全程无任何记录、无遮罩（部分机型遮罩也不生效）。需求若写「全平台禁止录屏」，安卓端是做不到的，必须提前和管理方对齐。
2. **遮罩污染其他页面**：`setVisualEffectOnCapture` 是**全局生效**的（设置后整个小程序期间都生效，不随页面）。如果在 A 页面 `onLoad` 设了 `'hidden'` 却没在离开时恢复 `'none'`，用户跳到 B 页面、甚至回到首页，截屏/录屏全都是黑屏。
3. **监听器全局唯一**：`onUserCaptureScreen` 官方写明「只能注册一个监听器」。若在 `onShow` 重复注册且不在 `onHide` 注销，多次进出页面会导致回调错乱 / 内存泄漏 / 多次触发。
4. **抓不到第三方截屏**：`onUserCaptureScreen` 只在系统截屏按键（电源+音量等）触发时回调，用第三方截屏 App / 长截屏工具截的图监听不到。
5. **字段记错**：把 `getScreenRecordingState` 的 `'on'/'off'` 当成 `'start'/'stop'` 来判断，导致「主动查询」分支永远不进。
6. **「进小程序前已开录屏」漏检**：只注册了 `onScreenRecordingStateChanged` 监听（它只在「变化」时触发），用户若是进小程序前就开着录屏，进入页面时不会触发 start 事件 → 漏检。必须额外用 `getScreenRecordingState` **主动查一次**。

## 根因

- 录屏监听依赖系统级能力，Android 微信出于兼容性/隐私策略未开放该能力给小程序，属平台限制，非代码可解。
- `setVisualEffectOnCapture` 是给「整个小程序窗口」打标记，不是页面级样式，所以作用域是全局的。
- `onUserCaptureScreen` 设计为单例监听（与 `onUserCaptureScreen` 文档一致），重复注册以最后一次为准。

## 怎么避免（标准写法）

### 铁律
1. 录屏防泄漏**只保证 iOS**，Android 做不了检测，只能靠遮罩（还不一定生效）——写进需求预期。
2. 遮罩在 `onShow` 开、`onHide`/`onUnload` **必关**（恢复 `'none'`）。
3. 监听器用「handler 引用缓存 + 进注册/出注销」绑定页面可见性，避免重复注册与泄漏。
4. 录屏检测 = **主动查询（覆盖进前已开）+ 监听变化（覆盖进后新开）** 双管齐下。
5. 字段别记错：监听用 `'start'/'stop'`，查询用 `'on'/'off'`。
6. 所有 `wx.*` 调用前先 `if (wx.xxx)` 存在性判断，兼容低基础库 / Android。

### 参考实现（原生 Page）

```js
Page({
  onShow() {
    this.doBusiness && this.doBusiness()
    this.startAntiCapture()   // 开遮罩 + 注册监听 + 主动查询录屏
  },
  onHide() { this.stopAntiCapture() },   // 必关遮罩 + 注销监听
  onUnload() { this.stopAntiCapture() },

  startAntiCapture() {
    this._handlers = this._handlers || {}
    // 1. 遮罩（全局生效，离开页要恢复）
    if (wx.setVisualEffectOnCapture) wx.setVisualEffectOnCapture({ visualEffect: 'hidden' })
    // 2. 注册监听（带 handler 缓存，防重复）
    this._register()
    // 3. 主动查一次录屏（覆盖“进小程序前就开着录屏”，仅 iOS）
    if (wx.getScreenRecordingState) {
      wx.getScreenRecordingState({ success: r => { if (r.state === 'on') this._log('recordAlreadyOn') } })
    }
  },
  stopAntiCapture() {
    if (wx.setVisualEffectOnCapture) wx.setVisualEffectOnCapture({ visualEffect: 'none' })
    if (this._handlers?.rec && wx.offScreenRecordingStateChanged) wx.offScreenRecordingStateChanged(this._handlers.rec), this._handlers.rec = null
    if (this._handlers?.shot && wx.offUserCaptureScreen) wx.offUserCaptureScreen(this._handlers.shot), this._handlers.shot = null
  },
  _register() {
    if (wx.onScreenRecordingStateChanged && !this._handlers.rec) {
      const h = r => { if (r.state === 'start') this._log('recordStart'); else if (r.state === 'stop') this._log('recordStop') }
      this._handlers.rec = h; wx.onScreenRecordingStateChanged(h)   // 注意字段 start/stop
    }
    if (wx.onUserCaptureScreen && !this._handlers.shot) {
      const h = () => this._log('screenshot')
      this._handlers.shot = h; wx.onUserCaptureScreen(h)
    }
  },
  _log(type) {
    // 记录：type + 本地时间 + token(截屏人标识,后端可反查) + 设备信息(brand/model/system/platform/SDKVersion)
    console.warn('[防截屏/录屏]', { type, time: new Date(), token, ...device })
    // 如需落库：调后端接口上报（需后端提供）
  }
})
```

### 关于「截屏人」
客户端拿不到明文姓名/手机号，最可靠的标识是**登录 token**（后端可据 token 反查真实用户），辅以 `wx.getSystemInfoSync()` 的 `brand/model/system/platform/SDKVersion` 设备信息辅助定位。真实身份必须后端解析，别在前端硬找 userName。

## 诊断方法

1. **真机分平台验证**：iOS 真机开系统录屏，应触发遮罩（画面变黑）+ 日志；Android 真机开录屏，预期**无任何反应**（属正常平台限制，不是 bug）。
2. **遮罩泄漏自检**：从受保护页跳到首页/其他页，截图看是否变黑——若变黑说明 `onHide` 没恢复 `'none'`。
3. **字段自检**：打印 `getScreenRecordingState` 的 `res.state`，确认是 `'on'/'off'` 而非 `'start'/'stop'`。
4. **重复注册自检**：反复进出页面后截一次屏，看日志是否打印多次——多次说明注销逻辑有问题。

## 本项目实例

- **项目**：江苏体育小程序（jsty-mp，体卫融合模块）
- **文件**：`packageMatch/pages/fieldInvestigation/index.js`（实地考察列表页）
- **实现**：`onShow` 调 `startAntiCapture`（遮罩 hidden + 注册截屏/录屏监听 + `getScreenRecordingState` 主动查询）；`onHide`/`onUnload` 调 `stopAntiCapture`（恢复 none + off 注销）。记录走 `_logCapture`：`console.warn` 打印 + 本地 storage 留痕（`field_capture_logs`，最近 50 条）+ toast 提示用户。
- **已覆盖场景**：①进小程序前已开录屏（iOS，主动查询）②进小程序后开录屏（iOS，监听）③截屏（监听）④离开页面恢复。
- **已知平台限制（已向业务对齐）**：Android 录屏无法检测/记录；截屏仅抓系统按键；遮罩在部分安卓机型不生效。
- **待确认**：是否接入后端落库接口（目前仅 console + 本地 storage，需后端提供上报接口 + token 反查用户）。

## 通用建议（守则）

1. **需求预期先行**：把「iOS 能防录屏、Android 不能」写进需求/测试用例，避免上线被投诉。
2. **遮罩作用域是全局**：开就要配对关（onShow 开 / onHide 关），否则污染全站。
3. **监听器单例 + 引用缓存**：注册/注销用同一个 handler 引用，绑定页面可见性。
4. **录屏检测「查询 + 监听」双保险**：只监听不查询会漏「进前已开」。
5. **字段别混**：监听 `start/stop`，查询 `on/off`。
6. **截屏人用 token**：前端拿不到真名，token + 设备信息走后端反查。
7. **所有能力 API 先 `if (wx.xxx)`**：低基础库 / Android 上这些 API 不存在。

## 相关

- 官方文档：
  - [wx.setVisualEffectOnCapture](https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.setVisualEffectOnCapture.html)
  - [wx.onUserCaptureScreen](https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.onUserCaptureScreen.html)
  - [wx.onScreenRecordingStateChanged](https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.onScreenRecordingStateChanged.html)
  - [wx.getScreenRecordingState](https://developers.weixin.qq.com/miniprogram/dev/api/device/screen/wx.getScreenRecordingState.html)
