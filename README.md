# 运动促进健康 · 测试文件集合

本仓库收录「运动促进健康」项目开发过程中产生的**设计文档、工具脚本与素材文件**，用于辅助需求分析、任务拆解与测试数据准备。

> 注：主程序代码（Vue 3 + Element Plus）位于独立工程中，本仓库仅存放辅助素材。

## 目录结构

```
测试文件/
├── docs/                                        # 设计与需求文档
│   ├── 数据监测系统_需求文档.md
│   ├── 数据监测系统_功能设计文档.md
│   └── 数据监测系统_工作流文档.md
├── generate_task_list.js                        # Node.js 任务清单生成（Excel XML 格式）
├── generate_task_list.py                        # Python 版任务清单生成脚本
├── generate_task_list_v2.js                     # V2 版本（基于 xlsx-js-style，带单元格样式）
├── 运动促进健康_开发任务清单.xls / .xlsx         # 上述脚本的生成产物
├── mock-data-generator.html                     # 浏览器端测试数据生成器（单文件页面）
├── flowchart.png                                # 业务流程图
├── lanhu_full_page.png                          # 蓝湖设计稿截图
├── tencent_doc_sample.png                       # 腾讯文档样例截图
├── package.json                                 # 依赖声明（xlsx / xlsx-js-style）
├── package-lock.json
├── CLAUDE.md                                    # Claude Code 项目指引
├── .gitignore
└── .claude/                                     # Claude Code 本地权限配置
```

## 使用方式

### 1. 生成开发任务清单（Excel）

```bash
npm install              # 安装 xlsx / xlsx-js-style
node generate_task_list_v2.js
```

或使用 Python 版本（无需额外依赖）：

```bash
python generate_task_list.py
```

运行后会在当前目录生成 / 更新 `运动促进健康_开发任务清单*.xlsx`。

### 2. 测试数据生成器

直接用浏览器打开 `mock-data-generator.html`，即可在页面上批量生成符合业务字段的测试数据并导出。

## 相关文档

- 数据监测系统的详细需求、功能设计与工作流，请见 [`docs/`](./docs/) 目录。
