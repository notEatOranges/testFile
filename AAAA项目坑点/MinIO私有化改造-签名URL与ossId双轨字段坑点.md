# MinIO 私有化改造 — 签名 URL 与 ossId 双轨字段坑点

## 坑点描述

后端从「公网永久 URL」存储切换为 MinIO 私有化存储后，文件地址变为**1 小时有效的预签名 URL**（带 `X-Amz-Signature` 参数）。前端若沿袭旧习惯——把上传返回的 `url` 当作永久地址存库、或从 `localStorage`/缓存读取图片地址——1 小时后全部裂图。正确做法是**只存 `ossId`，URL 每次查询由后端实时重签**。

同时上传接口的返回结构会变化（`url` 从顶层/`data.url` 变为 `data.url` + 新增 `data.ossId`），头像等旧接口还会从 RuoYi 的「顶层字段」风格（`response.imgUrl`）变为「`data` 包裹」风格（`response.data.imgUrl`），遗漏任何一处取值层级都会拿到 `undefined`。

## 通用规则

1. **存 ID 不存 URL**：上传成功后必须把 `ossId`（或文件对象 `id`）随业务表单提交；URL 仅用于当次预览，禁止持久化到数据库、localStorage、pinia 持久化插件。
2. **检查响应取值层级**：改造涉及的所有上传回调，逐一确认拦截器解包后的取值路径（`res.imgUrl` vs `res.data.imgUrl`），新旧接口风格常混用。
3. **网关前缀变更**：文件服务路由前缀可能整体迁移（如 `/file/oss/upload` → `/bastion-file/oss/upload`）。排查范围要覆盖：全局上传配置（PBSFConfig 的 `upload.action`）、API 封装文件、富文本编辑器内置上传、头像接口、用户导入弹窗。
4. **验证部署链路而不是只改代码**：改完前缀后，用 `curl` 实测各环境网关（新前缀在主域名/上传专用域名/CDN 域名下是否都通了）。实测发现过：新路由在主域名 200，但生产上传专用域名（static.xxx.cn）的 nginx 没配对应 location，直接 404——这类问题编译期完全无感知。
5. **区分 API 路由与对象存储直通路由**：网关根路径的 `/bastion-file/*` 可能直接转发到 MinIO（curl 返回 XML 错误即中招），API 要走网关内前缀（如 `/bastion-api/bastion-file/*`）。签名 URL 的 host 指向的是对象存储直通域名，与 API 域名不是一回事，不要混用。
6. **上传组件库可能已预适配**：改造前先读 node_modules 里上传组件的编译产物（`ImageUpload.vue.js` 等），确认它 emit 的数据结构是否已经是新结构（`{id, name, originUrl}`）。若是，所有业务页面透传 v-model 的地方一行都不用改，只改全局配置即可，避免无意义的大面积改动。
7. **组件 v-model 会丢弃自定义字段，id 槽位是唯一穿透载体**：`PbsfFileUpload` 任何交互（增/删文件）都会重新 emit 规范化的 `[{id, name, originUrl}]`，业务侧塞进 modelValue 的额外字段（`ossId`、`campId`、附件表主键等）会在下一次交互时被丢掉；且上传新文件时组件把 `id` 固定填成 `ossId`。因此「id 放 DB 主键、ossId 另传一个字段」的方案走不通——用户动一下文件列表 DB 主键就丢了。必须把 `id` 统一当 ossId 用，提交时再映射 `ossId: item.id`。
8. **回显映射别把 ossId 映射到 id 之外的键**：编辑页回显时查询结果要映射成 `{id: x.ossId, name, originUrl}`（不是 `{ossId: x.ossId}`），否则用户改完再保存 ossId 就断了。旧数据 `ossId` 为 `null` 属正常，映射后 id 为 undefined，后端按「旧 URL 自动重签」兼容。
9. **kkFileView 预览服务要在 dev 代理里单独配**：`PbsfFileUpload`/`PbsfFileList` 的预览走 `openFileWithKK` → `window.open(VITE_KK_API + '/onlinePreview?url=' + btoa(url))`。若 vite proxy 只配了业务 API 前缀没配 kk 前缀（如 `/kk-api`），本地点预览新开 tab 直接落 SPA 的 404 页（history 路由兜底渲染的），而网络面板 fetch 该地址甚至返回 200（返回的是 index.html），极易误判为预览服务挂了。curl 远端网关对应路径即可定位。
10. **kkFileView 预览 MinIO 签名 URL 需要「服务间网络」放行，不是前端能修的**：预览的完整链路是「浏览器 → kk 服务 → kk 服务自己去拉签名 URL」。kk 服务器访问对象存储直通路由（如网关 `/bastion-file/*`）可能被网关防火墙/WAF DROP（表现为 kk 页面报「连接超时 (Connection timed out)」，而同一 URL 浏览器和本机 curl 都秒回 200/403）。逐层对照法定位：①kk 拉公网任意 URL（如 w3.org 图片）→ 正常说明 kk 出网 OK；②kk 拉同网关 API 前缀 → 正常说明 kk 到网关 OK；③kk 拉对象存储直通路由 → 超时即坐实该 location 对 kk 源 IP 不通。修复要找运维给 kk 服务器出口 IP 放行该路由，或让 kk 走 MinIO 内网地址。别走 `/file/oss/download/{ossId}` 绕行——该接口要登录态，kk 拉不到 token 只会拿到 401 JSON。

## 本项目实例

- 项目：`hb-qsntyzd-admin`（青少年体育阵地系统，路径 `d:\Users\Orange\Documents\oneSport\AAA-hubei-YFY\hb-qsntyzd-admin`）
- `@pbsf/components@1.0.17` 的 `PbsfImageUpload`/`PbsfFileUpload` 已读取 `e.data.ossId`/`e.data.url` 并 emit `{id, name, originUrl}`，全部业务页面（阵地/教练/学员/场地/比赛成绩）通过 v-model 透传，无需改动。
- 实际只改了 5 处：`src/layout/index.vue` 的 `upload.action` 前缀、`packages/app-base/api/system/oss.js` 全部接口前缀、`packages/app-base/api/system/user.js` 头像接口前缀、两个 `userAvatar.vue` 的取值层级（`response.imgUrl` → `response.data?.imgUrl`）、`.env.production` 的 `VITE_APP_UPLOAD_API`（static 域名未配新路由，改回主域名）。
- 2026-08-19 实测生产网关：`hubeisports.cn/bastion-api/bastion-file/oss/upload` 200；`static.hubeisports.cn/bastion-api/bastion-file/*` 404；网关根 `/bastion-file/*` 直接命中 MinIO 桶（返回 XML NoSuchKey）。

## 后备人才项目实例（hbrc-admin，2026-08-19）

- 项目：`hbrc-admin`（体育后备人才选拔系统，路径 `d:\Users\Orange\Documents\oneSport\AAA-hubei-YFY\hbrc-admin`）
- 与阵地项目相反：这里组件库已适配（emit `{id: ossId, name, originUrl}`），**坑在业务页面的提交映射**——7 个业务表单（集训通知/集训附件/变更材料/送达通知附件/训练经历/退训/报名表）提交时只映射 `{fileName, filePath}` 把 ossId 丢了，回显时也没把 `ossId` 映回组件 `id`。修法：提交映射加 `ossId: x.id`，回显映射加 `id: x.ossId`（详见通用规则 7/8）。
- 特例 `trainApply/edit.vue`：原代码提交的 `id` 是 camp_file 附件表主键，按规则 7 统一改为 ossId，需后端确认编辑匹配逻辑同步改为按 ossId。
- kk 预览坑（规则 9）：vite proxy 漏配 `/kk-api`，本地点附件预览 404。已在 vite.config.js 补代理指向 `http://119.96.165.86:10088`（网关侧 `/kk-api/onlinePreview` 实测 200），需重启 dev server 生效。
