# 前端表单 展开提交(...formData/...x)多传字段污染后端DTO → 须白名单对齐 坑点

## 现象
前端编辑/新增表单提交后，后端报错：未知字段 / 反序列化失败 / 严格校验拒绝 / 把不该更新的字段覆盖成脏值。前端控制台不报错、代码也能跑，直到后端（或某次后端升级开了严格模式）才暴露。

典型场景：表单的 `formData` 里**既有提交字段，也有只给前端用的中间字段**——如日期范围拆成 `date: [start,end]`、上传文件对象 `photos: [{url,uid}]`、回显用的 `seasonType/years/seasonName` 等。提交时图省事 `const params = { ...formData, ... }` 或 `map(x => ({ ...x, ... }))`，把这些中间字段一起发给了后端。

## 根本原因
后端 DTO 只定义了有限的入参字段。前端 `formData` 是「表单状态容器」，里面通常掺杂：
- 仅前端用的中间结构：`date`(数组)、`photos`(含 uid 的文件对象)、`tableData`、`seasonType`/`years`(回显用) 等；
- 历史回显字段：detail 接口返回的、本接口不需要的字段；
- `null`/`undefined` 占位。

`...展开` 会把它们**无差别铺进 payload**。后果分几种：
1. 后端 Jackson 配 `FAIL_ON_UNKNOWN_PROPERTIES=true`（很多框架默认或升级后开启）→ 直接 400。
2. 后端用 `@Valid` 整体校验，遇到 DTO 没有的字段类型不匹配 → 报错。
3. 字段名撞上后端**别的实体同名属性**，被框架误绑 → 静默写入脏数据，最隐蔽。
4. 即便后端 tolerant 忽略多余字段，也可能把 `null` 当显式赋值，覆盖掉本不该改的字段。

> 注意和「数值字段空串报错」坑点区分：那是**单个字段值的类型问题**（`""` → 数值）；这是**多传了 DTO 没有的整个字段**（结构问题）。两者常并存于同一个 `...展开` 提交里。

## 通用规则（红线）
- **提交 payload 必须用白名单对齐后端 DTO**：显式列出后端声明接受的字段，逐个赋值，**不要用 `...formData` / `...x` 直接铺开**。
- 「表单状态」≠「提交模型」。`formData` 服务于双向绑定与回显，提交前要做一次**字段裁剪 + 形状转换**（`date→birthdayRangeMin/Max`、`photos→campPicturePath` 等）。
- 批量接口（body 是数组）更易踩：`map` 里 `...x` 会逐行带多余字段，要逐行白名单。
- 编辑场景尤其注意：`Object.assign(formData, detail)` 回显后，`formData` 里塞满了 detail 的字段，`...formData` 提交时全发回去——必须白名单。
- 靠「置 `null`/`undefined` 打补丁」不如白名单干净：`undefined` 会被 `JSON.stringify` 丢掉，但 `null` 会被发送。

## 修复模板
显式白名单（推荐）：
```js
// 编辑：对齐后端 CampProjectInputDTO
const params = {
  id: formData.id,
  seasonId: formData.seasonId,
  projectCode: formData.projectCode,
  projectName: formData.projectName,
  isAge: formData.isAge,
  birthdayRangeMin: formData.date ? formData.date[0] : undefined,
  birthdayRangeMax: formData.date ? formData.date[1] : undefined,
  campPicturePath: formData.photos[0].url,
  areaIds: formData.areaIds
}
```
批量场景同样逐项白名单：
```js
const params = formData.tableData.map(x => ({
  seasonId: formData.seasonId,
  projectCode: x.projectCode,
  projectName: x.projectName
  // ...只列 DTO 字段，date/photos 等中间字段不进 payload
}))
```

## 排查步骤
1. F12 Network → 看报错/可疑接口的 Request Payload，逐字段对比后端 DTO 定义，圈出 DTO 里没有的多余字段。
2. 回到代码搜提交处（`confirm`/`submit`/`http.post`），看是否用了 `...formData` / `...x` / `Object.assign({}, formData)` 这类铺开写法。
3. 检查 `formData` 里哪些是纯前端中间字段（日期数组、文件对象、回显字段）——它们最可能就是多余字段来源。
4. 改成显式白名单，逐字段对齐 DTO，重新提交确认 payload 只剩 DTO 字段。

## 本项目实例
- 项目：**青少年智能培训管理系统 (Qsntypx-q)**（Vue3 + Element Plus）
- 后端 DTO：`CampProjectInputDTO`，字段：`id / seasonId / projectCode / projectName / isAge / birthdayRangeMin / birthdayRangeMax / campPicturePath / areaIds`
- 文件：
  - `src/pages/comp-manage/project-manage/components/edit.vue`（修改）`confirm()` 原写 `{ ...formData, ... }`，把回显字段 `seasonType / years`、中间字段 `photos:null / date:null` 全发给后端。
  - `src/pages/comp-manage/project-manage/components/create.vue`（新增）`confirm()` 原写 `map(x => ({ ...x, ... }))`，把中间字段 `photos/date` 带进每行 payload。
- 修复：两处都改成对齐 DTO 的显式白名单（create 8 字段无 id，edit 9 字段含 id），多余字段不再下发。
- 关联坑点：[[后端接口-数字字段传空串报错须省略字段坑点]]（同为 `...展开` 提交的另一面——单字段值类型问题）。
