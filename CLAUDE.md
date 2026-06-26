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
