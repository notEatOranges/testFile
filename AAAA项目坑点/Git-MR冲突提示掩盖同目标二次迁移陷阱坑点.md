# Git-MR 冲突提示掩盖「同目标二次迁移」陷阱坑点

## 现象

平台（GitLab / Gitee / GitHub）发起合并请求时提示「有冲突」，并给出标准解决步骤：

```
1. git fetch origin
2. git checkout -b 源分支 origin/源分支
3. git merge origin/目标分支
4. 手动解决冲突
5. git add . && git commit && git push origin 源分支
```

照做后，本地 `git merge` 爆发出 **上百个文件冲突**，且几乎全是 `CONFLICT (add/add)`。

## 陷阱本质（为什么这是坑，而不是普通冲突）

大规模 `add/add` 冲突往往**不是「两边各改了同一行」**，而是 **两个分支对同一个目标各自做了一次完整的独立实现**——最典型的是**框架升级 / 大重构迁移**（如 Vue2→Vue3、Webpack→Vite、Element UI→Element Plus）。

此时平台给出的「按步骤本地解决冲突」指引会把你引向灾难：

- 每个 `add/add` 冲突都是「**两套新实现二选一**」，自动解决（`-X ours` / `-X theirs`）或手动全选任一边，都会**静默丢失另一边的整套迁移成果**。
- 而且**编译/构建查不出来**——两边都是能跑的完整实现，选哪边都能 build 通过，错误只在运行时或业务细节里暴露。
- 逐文件人工解决上百个冲突既不现实也不可靠：每个文件都要读懂两套实现再裁决，极易遗漏或选错。

## 如何识别这是「二次迁移陷阱」而非普通冲突

满足以下任一组合就要警觉：

1. **冲突文件数量异常多**（几十到上百），且类型高度集中——几乎全是 `src/` 源码 + 配置文件，且冲突类型以 `add/add` 为主。
2. **净 diff 行数巨大但 commit 数很少**：`git diff --stat A B` 显示上万行差异，但 `git log --oneline A..B` 只有寥寥几个提交（典型：一两个 `feat: 升级` / squash 合并提交）。
3. **两边各自有「完整的迁移/重构」提交**：`git show --stat <提交>` 能看到删旧框架包、换构建工具配置、新增迁移指南文档等一整套改动。
4. **查 merge-base 后验证**：`git merge-base A B` 找到共同基底，会发现 **A、B 都从同一基底出发，各自独立完成了同一类大改**。

## 正确做法

1. **先诊断，不要急着解冲突**：
   ```
   MB=$(git merge-base HEAD origin/目标分支)
   git log --oneline --no-merges $MB..origin/目标分支   # 目标分支干了什么
   git log --oneline --no-merges $MB..HEAD              # 自己分支干了什么
   git diff --stat $MB origin/目标分支 | tail -5        # 改动规模
   ```
2. **判定是否「同目标二次实现」**。若是 → **放弃合并，不要逐文件解冲突**。
3. **改为「确定唯一主分支」策略**：两套迁移只能保留一套作为主干，废弃另一支。
4. **只移植零散小改动**：次要分支里**独立的、小颗粒的**提交（如某个 bug 修复、某个工具脚本），用 `git cherry-pick <hash>` 单独搬到主分支。cherry-pick 时若该提交依赖被废弃的那套实现，就重做而非硬搬。
5. **若必须合并**：以一边为主框架，对**少数关键差异文件**逐个人工裁决，其余冲突统一取主框架版本；绝不对全部冲突无脑 `-X ours/theirs`。

## 红线

- **绝不在不诊断的情况下对上百文件冲突执行批量解决**。先看清是「行级冲突」还是「实现级冲突」。
- **不要相信「构建通过 = 合并对了」**。二次迁移场景下，两边都能 build。

## 本项目实例

- **项目**：青少年智能培训管理系统 `Qsntypx-q`（Vue3 迁移项目）
- **场景**：在平台上发起 `feature/vue3-upgrade` → `master` 的合并请求，提示冲突，平台给出标准本地解决步骤。
- **诊断结果**：
  - 共同基底 `7b76063`（一个 Dockerfile 提交）。
  - `master` 自基底起：`2f0fd3c`（squash 合入 `feature/pbsf-alignment`）**本身就是一次完整 Vue3 迁移**（删除旧 `@companyfe/szty-frame` 框架包、`vue.config.js`→`vite.config.js`、新增 `VUE3_MIGRATION_GUIDE.md` 等）+ `71dc024 feat:ooo`（依赖新鲜度脚本、坑点文档）。
  - `feature/vue3-upgrade` 自基底起：`80d4077 feat:升级` **也是一次完整 Vue3 迁移** + `.claude/skills` 迁移技能文档 + `d4a796e` 登录修复 + `712ef16` 页面优化。
  - 两边净差异：**331 文件 / +24596 / -11380 行**；合并冲突 120+ 文件，几乎全是 `add/add`。
- **结论**：`master` 与 `feature/vue3-upgrade` 是同一 Vue3 迁移目标的**两套独立实现**。盲目合并必然丢失其中一套。**最终放弃合并**，改为以 master 为主干，vue3-upgrade 的零散改动（登录修复等）后续单独评估移植。
