# mp-weixin · uni.request 响应 header 大小写不匹配，success 抛错致 promise 卡死、页面不渲染坑点

> **项目**：翼动同行（school-parent-mp）—— uni-app (Vue 3) 微信小程序
> **整理日期**：2026-07-29
> **结论先行**：封装的 `request` 在 success 回调里 `res.header[contentTypeKey].includes('text/plain')` 判断响应类型，**没做 null 安全**。mp-weixin 下响应头 key 大小写**随后端**（`Content-Type` 或 `content-type`），取不到时 `res.header[key]` 为 `undefined`，`.includes()` 抛 **TypeError**，**中断整个 success 回调 → `resolve` 永不执行 → Promise 永远 pending → `await` 卡死 → 页面数据永不渲染**。极隐蔽：`complete` 回调独立执行、照常打印 `200`，看起来请求成功，实际卡死且无任何报错。**修复：header 取值用可选链 + 大小写都试一遍。**

---

## 现象

- 某个接口（如 `sportOverview`）进页面后数据**全 `—` 不渲染**。
- Network / `[req]` complete 日志显示 `200 200`（HTTP 200 + 业务 code 200），像成功。
- 但 `await requestFn()` **之后的代码不执行**（后面加的 `console.log` 不出现），也没进 catch。
- 安卓、iOS 真机都复现（只要后端该接口响应头 key 大小写与前端取法不一致）。

## 根因

success 回调（修复前）：
```js
success(res) {
  let contentTypeKey = deviceType === 'web' ? 'content-type' : 'Content-Type';
  if (res.header[contentTypeKey].includes('text/plain')) {  // undefined.includes() → TypeError
    res.data = JSON.parse(res.data);
  }
  if (res.data?.code === 200 || res.data?.code === 0) {
    resolve(res);   // 抛错后永远到不了
  } else { ...reject(res); }
}
```

- mp-weixin 下 `contentTypeKey = 'Content-Type'`（大写）。
- 后端响应头若为 `content-type`（小写）或缺失 → `res.header['Content-Type']` = `undefined` → `.includes()` 抛 TypeError。
- success 回调被中断，`resolve` 不执行，Promise 永远 pending，`await` 卡死。
- `uni.request` 的 `success`/`fail`/`complete` 是独立回调，success 里抛错被运行时吞掉，**complete 照常执行**（仍打印 `[req] 200 200`）→ 极具迷惑性。

> 为什么有的接口正常、有的卡死：取决于**该接口后端响应头的 Content-Type key 大小写**。同一前端、不同后端服务/接口，header 大小写可能不同，于是「有的接口好、有的接口页面空白」。

## 修复

header 取值加可选链 + 大小写兼容：
```js
const contentType =
  res.header?.[contentTypeKey] || res.header?.['content-type'] || res.header?.['Content-Type'];
if (contentType && contentType.includes('text/plain')) {
  res.data = JSON.parse(res.data);
}
```

## 诊断方法（重点：怎么定位「promise 卡死」）

1. 现象：接口 `[req]` 日志显示 `200`，但页面数据空。
2. 在 `await requestFn()` **前后**各加一行 `console.log`：
   - 前面打印、**后面不打印** → `await` 卡住 → promise 没 settle → success 回调抛错中断。
3. 回 success 回调逐行查可能抛错的表达式（`.includes` / `[key]` / `JSON.parse`），加 null 安全。
4. 判据：**「200 但不渲染 + await 后无日志」= promise 卡死**，与「200 但 data 字段不匹配」（await 后有日志、res.data 有值但字段名不对）区分开。

## 通用建议（守则）

1. **请求封装的 success 回调里，一切 `.x()` / `[key]` 都要先防空**：响应头、响应体结构都不可信，`res.header?.[key]`、`res.data?.code`。
2. **响应头 key 大小写不敏感地取**：HTTP header 大小写不敏感，但 JS 对象 key 敏感，封装层要 `Content-Type` / `content-type` 都试。
3. **success 回调抛错 = 灾难**：会让 promise 永远 pending（不 resolve 也不 reject），调用方 `await` 卡死、页面不渲染且无报错。success 里不要有「可能抛错的裸表达式」。
4. **complete 日志会骗人**：它独立执行，success 抛错时 complete 仍打印成功状态。定位时以「await 后的日志是否执行」为准，别只看 complete。

## 本项目实例

- `packageMine/student-report/index.vue`：`sportOverview` 接口页面全 `—`，定位到 `common/request.js` success 回调 `res.header[contentTypeKey].includes(...)` 抛 TypeError。
- 修复 `common/request.js` 后，sportOverview 正常 resolve、页面渲染。该修复惠及所有接口。

## 相关

- 项目内 gotchas：`docs/gotchas/mp-weixin-request-header-nullsafe.md`
- 同库 hideLoading 坑（也是「无报错但异常」类）：`mp-weixin-showLoading关掉showToast坑点.md`
