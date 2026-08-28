# RuoYi Vue3 download 导出方法混用坑点（download is not a function）

## 现象
点击"导出"按钮，控制台报 `Uncaught TypeError: download is not a function`（常见于 handleExport），导出无响应、无下载。

## 根本原因
RuoYi 升级到 Vue3 后，项目里存在**两个名字相近但完全不同**的 download：

1. **`@/utils/request` 的具名导出 `download(url, params, filename, config)`** —— 真·函数。RuoYi 原生导出：POST 带 params、`responseType: blob`、saveAs 保存 xlsx。
2. **`@/plugins/download` 的默认导出** —— 是一个**对象**（含 `name / resource / zip / saveAs` 方法），**不是函数**，且没有名为 `download(url,params,filename)` 的方法。

升级时，很多页面写成 `import download from '@/plugins/download'`（默认导入拿到的是**对象**），却仍按 RuoYi 原生方式 `download(url, params, filename)` 当函数调用 → 对象不可调用 → `download is not a function`。

## 规则（红线）
- **RuoYi 原生导出** `download(url, params, filename)`：必须 `import { download } from '@/utils/request'`（具名导入）。
- **下载已有文件 / zip** `download.zip(url, name)` / `download.name(...)` / `download.resource(...)`：用 `import download from '@/plugins/download'`（默认导入对象，调用其方法）。
- **两者严禁混用**：import 了对象就不能 `download(...)`；要 `download(...)` 函数式调用就必须具名 import request 版。
- 判别口诀：看调用形式 —— `download(...)` 函数式 → request 版；`download.zip/name(...)` 方法式 → plugins 对象。

## 排查
全局搜 `import download from '@/plugins/download'`，逐个看调用处是 `download(...)` 还是 `download.xxx(...)`：前者改 import，后者保留。

## 本项目实例
- 项目：**Tyzxyy-q**（RuoYi-Vue 升级 Vue3）
- 报错页（当函数调用 → 已修复，import 改为 `import { download } from '@/utils/request'`）：
  `monitor/logininfor`、`monitor/operlog`、`monitor/job`、`monitor/job/log`、`system/config`
- 正确范例：`system/post`（本就用 request 版具名导入）。
- 二批已修复（`download.zip` 当 xlsx 导出用 → 改 `download(url,params,filename)`）：`system/role`、`system/user`（含 importTemplate）、`system/dict`、`system/dict/data`（补空 params）。这些原本"不报错但导出参数/文件名错"，后陆续被用户撞到（role、user 导出报错），遂统一改回 request 版。
- 保留 `download.zip`：仅 `tool/gen` 的 `batchGenCode`（真·下载 zip 代码包，`zip(url,name)` 语义正确）。
