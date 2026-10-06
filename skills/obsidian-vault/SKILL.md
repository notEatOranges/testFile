---
name: obsidian-vault
description: Obsidian vault（Orange 库）笔记整理与维护规范。当用户要求整理笔记、收纳素材进 vault、写坑点、改 wiki 页面、更新 skills 镜像等任何涉及 D:\Obsidian\Orange 的读写操作前必须先读本技能。包含路径、wikilink 强制规范、表格管道转义、log/index 纪律、坑点项目归属、git 推送等硬约定。
---

# Obsidian Vault 整理与维护规范

Vault 路径：`D:\Obsidian\Orange`（2026-10-03 重装日由 E:\Users\Orange\Documents\Obsidian\Orange 迁来并注册进 Obsidian；`wiki/` + `sources/` 两棵树）。
Git 私有仓：`notEatOranges/obsidian-vault`（main），**收尾必 commit+push**，推送挂 `-c http.proxy=http://127.0.0.1:7897`。

## 硬约定（0910 血泪教训，违反必返工）

1. **sources/ 源文件不可二次加工**（坑点、skills 原样存放）；**wiki/ 只放索引/总览页**，不堆源文件副本。
2. **链接一律用 wikilink**：`[[sources/路径/文件.md|显示文本]]`。**严禁 `[text](../...)` markdown 相对链接**——层级极易写错且 Obsidian 解析不稳定（0910 两连坑：相对路径层级错 + 表格管道未转义，118 处链接全废）。
3. **表格内的 wikilink，alias 管道必须转义为 `\|`**，否则 `|` 被表格当列分隔符，链接碎成裸文本。转换脚本处理完必须抽验表格行原文。
4. 链接 `.js` 等非 md 文件：需用户开启 设置→文件与链接→**检测所有文件扩展名**（已开启）；改完磁盘文件要让 Obsidian 重载（Ctrl+R）再验证。
5. **每次改动必记两处**：`wiki/log.md` 追加 `## [YYYY-MM-DD] type | 标题`（Source / Pages affected / Actions 三段）；`wiki/index.md` 更新页表与 Sources processed。
6. **改完抽验再交付**：wikilink 目标必须真实存在（脚本逐个 `os.path.exists` 验证），有表格先看渲染。

## 坑点专项

- 坑点源文件写 `sources/个人/项目坑点/`，命名 **`<系统名称>-<技术前缀>-<主题>坑点.md`**（系统名称放最前，文件名即项目归属，如 `江苏项目-mp-weixin-xxx坑点.md`），原样不加工。存量 56 个已于 0910 全量改为新命名（仅测试占位文件无前缀）。
- **必须标注所属项目**（用户强调的硬要求）：从文件内容找证据（仓库路径/IP/AppID/系统名），写不准标 ⚠️待确认；新项目在总览开新桶并在「项目归属证据」表加行。
- 同步更新 `wiki/个人/项目坑点/项目坑点总览.md`（项目分组表 + 一句话结论 + P0 速查 + 交叉关联）。

## 收纳原则（testFile 素材库）

- 知识类进 vault：文档/表格/pdf/说明，按项目归档（江苏→sources/江苏项目/ 等）。
- 代码工程不进：tgbot/kuaishan-video/各 AAA-* 工程、nginx、node_modules、无引用散图。
- testFile 本体保留桌面不删（除非用户明说移动/删除）。

## Skills 三副本同步

改任何 ZCode skill 后，三处必须同步：`~/.zcode/skills/`（运行时）＝ 桌面 `testFile/skills/`（上游 git 仓 notEatOranges/zcode-skills，⚠️workhub-build 曾未推上游）＝ vault `sources/开发/skills/`，并更新 `wiki/开发/skills/PBSF Skills 总览.md` 一览表。Claude Code 侧独立技能镜像在 `sources/开发/skills-claude/独立技能/`。

## 收尾流程

git add -A → commit（中文一句话说清改动）→ push（挂代理）→ 告知用户远端已同步。

## WSL（Ubuntu-22.04）侧使用（2026-09-12 增补；2026-10-06 用户拍板：主力=22.04，24.04 当日恢复后即按用户令注销删除——其全套环境 tar 归档在 fnOS NAS `团队文件-vmbackup\WSLBackup-20261003`；22.04 现为干净基础系统，zcode/node 按需再装）

- vault 路径按平台映射：Windows `D:\Obsidian\Orange` ⇔ WSL `/mnt/d/Obsidian/Orange`（同一份文件，双写互见）。日后在 22.04 装 zcode 时，`~/.zcode/skills` 软链应指 `/mnt/e/Users/Orange/Desktop/testFile/skills`（重装后 testFile 真身迁 E 盘，旧 `/mnt/d/...` 是断链）。
- WSL 侧改完磁盘文件，同样要在 Windows 的 Obsidian 里 Ctrl+R 重载再验证。
- **WSL 里的 git 操作（add/commit/push）一律走 `git.exe` 互操作**，别用 WSL git 碰这个仓（两套 autocrlf 配置会在同一工作树打架；push 代理 `127.0.0.1:7897` 也只在 Windows 侧有效，WSL 的 127.0.0.1 不是 Windows）。示例：`git.exe -C 'D:\Obsidian\Orange' add -A`；互操作报 UNC 警告就回 Windows 侧推。
- skills 三副本同步在 WSL 同样成立：WSL 的 `~/.zcode/skills` 软链到 testFile（与 Windows 侧同源），在任一侧改 skill 即改上游。
