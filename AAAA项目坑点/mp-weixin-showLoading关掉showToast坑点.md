# mp-weixin · `hideLoading` 会把 `showToast` 一起关掉（报错提示被 loading 吞掉）坑点

> **项目**：翼动同行（school-parent-mp）—— 校园体育家长端，孩子绑定/管理
> **技术栈**：uni-app (Vue 3 `<script setup>`) + scss(rpx)
> **目标平台**：mp-weixin（AppID `wxbb6aae22a430cde4`）
> **构建方式**：HBuilderX 工程（无 uni CLI / 无 vite 脚本）
> **整理日期**：2026-07-29
> **结论先行**：mp-weixin 里 `showToast` / `showLoading` / `hideLoading` **共用同一个原生提示层**。页面 `showLoading` 后发请求，接口报错时请求封装（request.js）按惯例「先 `hideLoading` 关 loading、再 `showToast` 弹错误」并 `reject`——**这一切是对的**；但页面 `catch` 里习惯性又补一刀 `hideLoading()`，就会**把刚弹出来的错误 toast 一并关掉**，真机上表现为「loading 一消失，报错提示也跟着没了，根本看不到为什么失败」。
>
> ⚠️ **一句话规则**：**`showToast` 之后不要再调 `hideLoading`**。loading 的关闭必须发生在 `showToast` **之前**（同一个同步序列里），且不重复关。

---

## 现象

绑定学生场景：
1. 点「确认关联」→ 页面 `showLoading({ title: '关联中...', mask: true })`，loading 转圈。
2. 接口返回业务错误（如学号不存在 / 已绑定）。
3. 真机上：**loading 转完一关，错误 toast 也跟着一起没了**，用户只看到 loading 消失、页面停在原地，**完全不知道发生了什么错误**。
4. 但在微信开发者工具 / 部分安卓机型上偶尔能看到 toast 一闪而过，极易误判为「时序偶发问题」。

## 导致什么结果

- 用户操作失败却收不到任何反馈，以为程序卡死 / bug，反复乱点。
- 隐蔽性高：报错逻辑（request.js 的 `showToast`）明明写了，DevTools 网络面板也能看到错误码，但真机表现就是「没提示」，排查方向容易被带偏到「是不是 toast 没调 / icon 不支持 / position 问题」。

## 根因（mp-weixin 原生提示层机制）

1. mp-weixin 的 `wx.showToast` 和 `wx.showLoading` 在原生层是**同一个提示组件**（都是 `wx.showToast` 的封装，`showLoading` 等价于 `icon: 'loading'` 的 toast），**后调的覆盖先调的**，二者互斥。
2. `wx.hideLoading` 的行为不是「只关 loading」，而是**关闭当前这个原生提示层**——所以**如果此刻显示的是 toast，`hideLoading` 会把 toast 关掉**（iOS 上尤其干脆，安卓部分版本 toast 还能撑住一会儿，造成「机型差异」假象）。
3. 这与 Web / 浏览器里「loading 是一个 DOM、toast 是另一个 DOM，互不影响」的心智模型完全不同，是迁移到小程序最常踩的交互坑之一。

### 出问题的时序（以本项目为例）

```
页面 doSubmit:
  showLoading()                      // ① loading 显示
  await bindStudent()                // ② 发请求
      └─ request.js success(业务错误):
           hideLoading()             // ③ 关掉 loading  ✅ 正确
           showToast({ 错误 msg })    // ④ 弹错误 toast  ✅ 正确，此刻 toast 是显示的
           reject(res)               // ⑤ await 抛出
  catch (e):
       hideLoading()                 // ⑥ 又调一次 hideLoading ❌ 把 ④ 的 toast 关掉了！
```

第 ⑥ 步是元凶：开发者本能「我开了 loading，catch 里得兜底关 loading」，但 request.js 已经在第 ③ 步关过了，第 ⑥ 步纯属多余，且正好落在 toast 显示期间 → 吞掉报错提示。

## 怎么避免（标准写法）

**铁律：`showToast` 之后不要再 `hideLoading`。**

### 规则一：请求封装统一「先关 loading、再弹 toast」，且 `reject` 前完成

```js
// request.js ✅ 正确：hideLoading 永远在 showToast 之前，reject 之前
success(res) {
  if (res.data?.code === 200 || res.data?.code === 0) {
    resolve(res);
  } else {
    if (showError) {
      uni.hideLoading();                      // 先关 loading
      uni.showToast({ title: res.data.msg, icon: 'none', position: 'bottom' }); // 再弹 toast
    }
    reject(res);                              // reject 在 toast 之后
  }
}
```

### 规则二：页面 `catch` 里不要再补 `hideLoading`

只要项目的 request 层保证了「所有 reject 路径都先 `hideLoading + showToast`」（含 401、业务错误、网络 fail 三条路径都覆盖），页面层就**不应该**再调 `hideLoading`。

```js
// 页面 doSubmit ✅ 正确：catch 不调 hideLoading
async function doSubmit() {
  showLoading({ title: '关联中...', mask: true });
  try {
    await bindStudent({ ... });
    hideLoading();                            // 成功路径：关 loading（紧接着的 success toast 之前，OK）
    showToast({ title: '关联成功', icon: 'success' });
  } catch (e) {
    // ⚠️ 切勿再调 hideLoading：request.js 已在 reject 前 hideLoading + showToast，
    //    再调会把刚弹的错误 toast 一并关掉（loading/toast 共用原生层）。
    //    request.js 已 toast 错误，这里什么都不用做。
  }
}
```

> **变体（同样会吞后端提示，易漏）**：catch 里即使**不调 `hideLoading`**、只补一条写死文案的 `showToast({ title: '操作失败，请稍后重试' })`，也会**顶掉 request.js 刚弹的后端 `msg`**——toast 是单例、后调覆盖前调（见根因第 1 点）。若想让后端提示语原样抛出，catch 里就**什么都别再调**，完全依赖 request.js 的 `showError`。典型场景：导出 / 下载这类「接口封装函数」自己包了 try/catch 又顺手写了兜底 toast，结果后端「超限 / 不满足条件」等具体原因被一句万能兜底文案盖掉。实例：翼动同行 `packageMine/utils/exportFile.js` 的 `exportReport`（导出体测报告 PDF）。

> 注意成功路径 `hideLoading()` 紧跟 `showToast()` 是 OK 的——因为 `hideLoading` 在 `showToast` **之前**，toast 会正常显示。坑只在「`showToast` **之后**再 `hideLoading`」。

### 规则三：如果 loading 是页面自己开的、又想自己处理错误（不走 request 的 toast）

那么页面 `catch` 里要自己关 loading，但**顺序必须是「先 hideLoading、后 showToast」**：

```js
} catch (e) {
  hideLoading();                              // 先关
  showToast({ title: '自己处理的错误', icon: 'none' }); // 后弹，顺序不能反
}
```

## 诊断方法

1. **现象判据**：真机上 loading 一消失、报错提示也跟着没了，但 DevTools 里能确认 `showToast` 确实被调用 → 八成本坑。
2. **代码判据**：全局搜 `hideLoading`，重点看「**出现在 `showToast` 之后**」或「**出现在 `catch` 块里、且 request 层已关过 loading**」的调用。
3. **快速验证**：把怀疑的那行 `hideLoading()` 注释掉，真机复现——toast 能正常显示即确诊。
4. **机型差异**：iOS 必现（toast 被瞬间关掉）；部分安卓 toast 能短暂闪现，别因为「安卓偶尔能看到」就排除本坑。

## 本项目实例

- **文件**：`packageMine/relate/index.vue`（绑定学生页，`doSubmit`）
- **出问题的写法**：`catch (e) { hideLoading(); /* 注释说 request.js 已 toast */ }` —— 注释意识到了「不重复 toast」，但没意识到 `hideLoading` 会把 request.js 弹的 toast 关掉。
- **修复**：删掉 `catch` 里的 `hideLoading()`，加注释说明 request.js 契约（reject 前已 `hideLoading + showToast`）。
- **前置依赖**：`common/request.js` 的三条 reject 路径（401 / 业务错误 `else if (showError)` / `fail` 网络异常）**都**已先 `hideLoading` 再 `showToast`，故页面层可安全地不再关 loading。若哪天某接口传了 `showError: false`（页面想自己处理错误），页面需自行在 `showToast` **之前** `hideLoading`。

## 通用建议（守则）

1. **`showToast` 之后禁止再 `hideLoading`**——这是核心铁律，记这一条就够防住 90% 的情况。
2. **loading 关闭统一交给请求封装层**：页面 `showLoading`，request 层在 resolve/reject 前负责 `hideLoading`（且在 toast 之前），页面 `catch` 不再重复关。
3. **顺序敏感**：必须 `hideLoading → showToast`，不能反；成功路径 `hideLoading → showToast(success)` 同理。
4. **别被机型差异骗**：iOS 必现、安卓偶现，看到机型差异反而要高度怀疑本坑。
5. **401 特判**：401 登录过期的 toast 也遵循同样顺序（先 `hideLoading` 后 `showToast`），且通常还要跳登录页，注意 toast 别被紧接着的 `reLaunch` 抢走（必要时延时跳转）。

## 相关

- 项目通用坑点：`测试文件/AAAA项目坑点/体e智慧助手-uni-app微信小程序坑点总结.md`
- 项目内 gotchas：`docs/gotchas/`
