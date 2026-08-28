# Element Plus el-upload 上传漏 model/绕过拦截器 → 后端 500「参数类型错误」坑点

## 现象
el-upload 上传图片，后端返回 500「参数类型错误」或类似错误。F12 看上传请求：form-data 缺关键系统参数（如 `model`/系统码），请求头也没有鉴权字段（access_token / X-Sign / sys_code）。

## 根本原因
el-upload 有两种上传路径：
1. **默认**：只配 `:action`，走 Element Plus 自带的 XHR，**完全不经过项目的 axios 实例** → 所有 axios 请求拦截器（注入 token、签名、sys_code、model 等）统统失效。
2. **自定义**：配 `:http-request="fn"`，fn 内用项目封装的 `http.post` → 走 axios 拦截器，参数齐全。

很多后端要求上传 form-data 带 `model=系统码`（决定文件存储目录/租户隔离），并要鉴权头。若 el-upload 没配 `:http-request`（走默认 XHR），或配了但 fn 是**组件内手写**的、漏了 model / 没走 axios，后端就因缺参数报错。

最常见的写法陷阱：在业务组件里**自己写一个 `uploadHttpDefault`**（只 `formData.append('files', file)` 再 `http.post`），看似走了 axios，但**漏了 `append('model', 系统码)`**，同样报错。正确做法是复用公共 composable（如 `useFile`）里那个统一带 model 的 `uploadHttpDefault`。

## 通用规则（红线）
- el-upload 上传**必须**配 `:http-request="uploadHttpDefault"`，且这个 `uploadHttpDefault` 必须是项目公共方法（内部 `formData.append('model', 系统码)` + 走 axios 拦截器），**不要在业务组件里自己手写一份漏 model 的**。
- 公共上传方法模板：
```js
function uploadHttpDefault(option) {
  const formData = new FormData()
  formData.append('model', config.SYSTEM_CODE)                         // 关键：系统码/租户
  formData.append(option.filename, option.file, option.file.name)     // 文件二进制
  http.post(option.action, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(res => res.data.code === 200 ? option.onSuccess(res.data) : option.onError(res))
    .catch(option.onError)
}
```
- 配套坑：绑了 `v-model:file-list` 的 picture-card，on-success 里**别 push 新条目**（el-upload 已自动加 raw file），按 `uid` 回填 `.url`；否则一张图两个预览、提交数据夹 `undefined`。
- 排查：全局搜 `function uploadHttpDefault`（组件内手写 = 嫌疑），对比 `const { uploadHttpDefault } = useFile()`（公共 = 正确）。

## 排查步骤
1. F12 Network → 上传请求 → Payload 看 form-data 有没有 `model`；Headers 看有没有 Authorization / sys_code / X-Sign。缺即此坑。
2. 全局搜 `function uploadHttpDefault`，凡是在业务组件里自定义的（而非从公共 composable 解构），都是漏 model 嫌疑。
3. 改为从公共 composable 解构 `uploadHttpDefault`，删掉本地定义。

## 本项目实例
- 项目：**青少年智能培训管理系统 (Qsntypx-q)**（Vue3 + Element Plus）
- 后端要求：上传 form-data 带 `model=SZTY_ZCXT`（`config.SYSTEM_CODE`），文件落 `/SZTY_ZCXT/...`。
- 公共方法：`src/composables/useFile.js` 的 `uploadHttpDefault`（line 143，`formData.append('model', config.SYSTEM_CODE)`）。
- 漏网文件：`src/pages/order-manage/order-list/components/dropDialog.vue`（退课证明上传）—— 组件内自己写了 `uploadHttpDefault`，只 append `files`、漏 `model`，且 `getAvatar` 用 push 导致重复预览。
- 修复：改用 `useFile().uploadHttpDefault` + `getAvatar` 按 uid 回填。全项目 13 处上传，仅此 1 处漏 model，其余均正确用 useFile。
- 项目内已有详细记录：`docs/pbsf-migration/PROGRESS.md`（A. model 缺失 / B. 预览重复）。
