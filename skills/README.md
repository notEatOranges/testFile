# PBSF Skills 使用指南

Skills 是 `.claude/skills/` 目录下的 Markdown 模板文件，Claude Code 在开发时会自动读取它们来指导代码生成。**你不需要手动调用任何命令**，只需用自然语言描述需求即可。

---

## 全部 Skills 一览

| Skill | 用途 | 文件 |
|---|---|---|
| `pbsf-api-file` | 生成 API 文件（CRUD 接口） | `pbsf-api-file.md` |
| `pbsf-list-page` | 生成列表页（搜索+表格+分页） | `pbsf-list-page.md` |
| `pbsf-add-dialog` | 生成弹窗式新增/编辑 | `pbsf-add-dialog.md` |
| `pbsf-detail-dialog` | 生成弹窗式详情查看 | `pbsf-detail-dialog.md` |
| `pbsf-edit-page` | 生成全页面式新增/编辑 | `pbsf-edit-page.md` |
| `pbsf-detail-page` | 生成全页面式详情查看 | `pbsf-detail-page.md` |
| `pbsf-add-menu` | 通过浏览器添加菜单 | `pbsf-add-menu.md` |
| `pbsf-dict-tag-useDict` | 字典组件 + useDict 用法（状态/字典字段必须用 `pbsf-dict-tag` 或字典翻译，禁止硬编码） | `pbsf-dict-tag-useDict.md` |
| `pbsf-selectDictLabel` | 字典标签工具函数 | `pbsf-selectDictLabel.md` |
| `pbsf-validator` | 表单验证器（手机/身份证等） | `pbsf-validator.md` |
| `pbsf-form-snippets` | 表单字段代码片段速查 | `pbsf-form-snippets.md` |
| `pbsf-hooks-ref` | 所有 Hooks 用法速查 | `pbsf-hooks-ref.md` |
| `pbsf-action-column-width` | 操作列自适应宽度（useActionColumnWidth） | `pbsf-action-column-width.md` |
| `pbsf-page-name` | 给页面/组件声明 name（defineOptions 宏，避坑指南） | `pbsf-page-name.md` |
| `pbsf-table-column-width` | 表格列宽控制（按表头/内容估宽、超长用 tooltip 省略、**手动改过的列宽禁动**） | `pbsf-table-column-width.md` |
| `pbsf-page-verify` | PC 页面改完必须用 chrome-devtools MCP 浏览器客观验证；**修改与验证必须分开，禁自改自审** | `pbsf-page-verify.md` |
| `score-page-generator` | 专家评分页面生成 | `score-page-generator.md` |

---

## 使用方式

### 直接描述需求（推荐）

用自然语言告诉 Claude 你要做什么，它会自动匹配并读取相关 Skills：

```
帮我写一个培训管理的列表页，包含名称、类型、时间的搜索和表格
```

```
帮我写一个场地管理的编辑页，字段有名称、地址、面积、图片上传
```

```
给这个编辑页加一个手机号字段和一个图片上传字段
```

### 组合多个功能

一次请求生成完整模块：

```
帮我开发一个完整的「场地管理」模块，包含列表页、编辑页、详情页和 API 文件
```

---

## 需求与 Skill 的对应关系

| 你说的需求 | Claude 会读取的 Skills |
|---|---|
| 写列表页 | `pbsf-list-page` + `pbsf-hooks-ref` + `pbsf-form-snippets` + `pbsf-table-column-width` |
| 写编辑页 | `pbsf-edit-page` + `pbsf-form-snippets` + `pbsf-validator` |
| 写详情页 | `pbsf-detail-page` + `pbsf-dict-tag-useDict` |
| 写 API 文件 | `pbsf-api-file` |
| 加菜单 | `pbsf-add-menu` |
| 用字典 | `pbsf-dict-tag-useDict` + `pbsf-selectDictLabel` |
| 加表单验证 | `pbsf-validator` + `pbsf-form-snippets` |
| 操作列自适应宽度 | `pbsf-action-column-width` |
| 给页面加 name | `pbsf-page-name` |
| 调表格列宽 / 长内容省略 | `pbsf-table-column-width` |
| 改完页面验证 / 防自改自审 | `pbsf-page-verify` |
| 写评分页 | `score-page-generator` |

---

## 典型开发流程

以开发「证书管理」模块（packages/app-manage）为例：

```
你: 帮我开发「证书管理」模块

Claude 会按顺序：
1. pbsf-api-file      → 生成 API 文件
2. pbsf-list-page     → 列表页 index.vue（用 defineOptions 声明 name）
3. pbsf-edit-page     → 编辑页 edit.vue
4. pbsf-detail-page   → 详情页 detail.vue（el-descriptions：去 border + item label-class-name + label 带中文冒号 + :deep 样式）
5. pbsf-add-menu      → 按「目录(M) → 菜单(C) → 按钮(F)」结构添加菜单
（所有页面自动应用 pbsf-page-name：defineOptions 声明组件 name）
```

生成的文件结构：
```
packages/app-manage/
  api/certificateManage.js
  views/certificateManage/
    index.vue                 ← 列表页
    edit.vue                  ← 编辑页
    detail.vue                ← 详情页
    components/
      addDialog.vue           ← 新增/编辑弹窗
      detailDialog.vue        ← 详情弹窗
```

---

## Skill 依赖关系

```
基础层（被其他 Skill 引用）:
  pbsf-hooks-ref ──────── Hooks 用法速查
  pbsf-form-snippets ──── 表单字段片段
  pbsf-validator ──────── 验证器
  pbsf-dict-tag-useDict ─ 字典用法
  pbsf-selectDictLabel ── 字典标签
  pbsf-action-column-width ─ 操作列自适应宽度
  pbsf-table-column-width ─ 表格列宽控制（被 list-page 引用）
  pbsf-page-name ────────── 页面/组件 name 声明（defineOptions）

页面模板层（引用基础层）:
  pbsf-api-file ──────── API 接口文件
  pbsf-list-page ─────── 列表页（引用 hooks-ref + table-column-width）
  pbsf-edit-page ─────── 编辑页（引用 hooks-ref + form-snippets + validator）
  pbsf-detail-page ───── 详情页（引用 hooks-ref + dict-tag）
  pbsf-add-dialog ────── 弹窗式编辑（引用 form-snippets + validator）
  pbsf-detail-dialog ─── 弹窗式详情（引用 dict-tag）

操作层:
  pbsf-add-menu ──────── 菜单管理操作
  score-page-generator ─ 评分页面（独立）

质量保障层（横切，作用于所有页面模板层）:
  pbsf-page-verify ───── 改完页面后用 chrome-devtools MCP 浏览器验证；修改与验证必须分开，禁自改自审
```

---

## ⚠️ 维护约定（重要）

**新增或修改任何 skill 后，必须同步更新本 README.md**：

1. 「全部 Skills 一览」表：新增 skill 加一行；改名的更新文件名
2. 「需求与 Skill 的对应关系」表：新覆盖的需求加一行
3. 「Skill 依赖关系」图：调整基础层 / 页面模板层 / 操作层 分类
4. 大改 / 重写的 skill：检查表格里「用途」描述是否还准确

**为什么**：README 是 skills 的索引入口，索引过时会让 Claude 找不到新 skill、或继续沿用已废弃的旧规范（如 `<script setup name>` 写法、单层菜单结构、el-descriptions 加 border 等）。

> 本约定已写入项目 memory，每次改动 skills 时会自动提醒同步 README。
