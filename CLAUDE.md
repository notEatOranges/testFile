# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 这是什么仓库

本仓库（`测试文件`）是「运动促进健康」项目的**辅助素材集合**，仅包含设计文档、任务清单生成脚本和测试数据生成器。**不包含主程序代码。**

> 主程序（Vue 3 + Element Plus）位于独立工程（如 `../vue3+elementPlus`），不要在此仓库内寻找或修改前端业务代码。
> 旧版 CLAUDE.md 误把主程序工程的结构（pnpm monorepo、packages/、src/ 等）写进了这里，已废弃。

## 常用命令

`package.json` 只有 `dependencies`（`xlsx`、`xlsx-js-style`），**没有 `scripts` 字段，也没有 lint / test 配置**——不要假设存在 `npm run dev/test/lint`。

```bash
npm install              # 安装 xlsx / xlsx-js-style（Node 脚本的唯一依赖）
```

生成开发任务清单（Excel），三选一：

```bash
node generate_task_list_v2.js   # 推荐：xlsx-js-style，带单元格样式，输出 .xlsx
node generate_task_list.js      # V1：手写 Excel XML，输出 .xls（无样式）
python generate_task_list.py    # Python 版（依赖 pandas；输出 .xlsx）
```

测试数据生成器（`mock-data-generator.html`）：**纯前端单文件，无需构建**，直接用浏览器打开即可生成并导出 CSV。

## 高层结构

三类内容，彼此独立：

1. **设计文档** — `docs/`：`数据监测系统` 的需求、功能设计、工作流三份 Markdown，是业务规则的字段/流程来源地。脚本和生成器里的字段定义大多源自这里。
2. **任务清单生成脚本** — 三个版本产出 `运动促进健康_开发任务清单*.xls/.xlsx`：
   - `.js`（V1）：字符串拼 Excel XML → `fs.writeFileSync` 写 `.xls`。
   - `_v2.js`：`xlsx-js-style` 库，列结构为 `项目名称/一级/二级/三级模块/工作类型/工（天）/计划起止/负责人`，含表头样式。
   - `.py`：pandas `to_excel`，列结构偏项目管理格式（序号/模块/功能点/页面组件/任务描述/优先级/工作量/状态…）。

   任务数据**硬编码在各脚本顶部的数组里**；改任务直接编辑脚本，不要手改生成的 Excel（会被覆盖）。
3. **测试数据生成器** — `mock-data-generator.html`：字段定义、生成逻辑、CSV 导出全在一个 HTML 内；含性别/生日年龄联动、省-市-区三级地址级联、邮编、6 位定位码等功能。`mock-data-generator copy.html` 是它的副本。

## 注意事项

- **`test-srd18907185121/` 是一个独立的嵌套 git 仓库，且已被 `.gitignore` 忽略**，内含完整的另一个项目（Java 后端 + 前端，还有一个 ~150MB 的 `large-data-processor.js`）。它**不属于本仓库**，分析/修改时忽略它。
- `.xls/.xlsx` 和图片（`flowchart.png`、`lanhu_full_page.png`、`tencent_doc_sample.png`）多为**生成产物或设计稿截图**，非源文件。
- 仓库内文件名与文档均使用中文，新增内容请保持中文命名与注释风格一致。

## AAAAAA 小程序工程（「我们的小窝」，当前主要工作区）

仓库根下的 `AAAAAA/` 是一个**完整的微信小程序情侣互动工程**（TDesign + 云开发 + Skyline），与上面的「运动促进健康」素材相互独立。用户的绝大多数功能开发需求都落在这里。

- 工程内有自己的 `AAAAAA/CLAUDE.md`（UI 铁律：**禁用 emoji 当图标、一律 t-icon**；表单用 TDesign；业务页 `navigationStyle: default`）。
- 数据层：`utils/store.js`（kv 实时抽象）/ `user.js`（身份）/ `room.js`（心跳）。
- 功能页在 `packageFunc/`（chat/mood/days/wishlist/truthbox），云函数在 `cloudfunctions/`。
- 用**微信开发者工具**打开 `AAAAAA/` 预览；改云函数需在工具内「上传并部署」。
- 当前进行中的功能优化见 `docs/功能优化设计文档.md` 与 `docs/开发进度.md`。

## 🔁 跨电脑接力开发铁律（所有任务通用，长期生效）

用户要求**所有未来任务**都按下面的流程做，已同步写入我的长期记忆：

1. **先读设计 / 进度文档**：开工前先看 `docs/` 下对应的设计文档与 `docs/开发进度.md`，从第一个未完成项接续。
2. **逐功能点实现**：一个功能点（或可独立验证的子任务）= 一次 `git commit`。提交信息写清「做了什么 / 改了哪些文件 / 为什么」。
3. **完成即记录**：每提交一次，立刻回 `docs/开发进度.md` 打勾 + 在「提交记录」表追加一行（日期、哈希、功能点、要点）。
4. **接力前收尾**：离开前更新进度文档的「当前状态 / 下一步」，确保下一棒（可能是另一台电脑）知道从哪接。
5. **不破坏现有契约**：对外接口保持向后兼容；遵守工程内 UI 铁律。
6. **真机验证**：涉及实时同步 / 推送的功能需两台手机在开发者工具里验证。

> 简记：**「一个功能点一次提交，提交后立刻记进度」**。不要攒一大堆改动一次提交。
