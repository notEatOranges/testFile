# pnpm patch 移除上游无修复的传递依赖坑点

## 通用规则

当 SCA/安全扫描报出一个**传递依赖**的漏洞，且该依赖满足以下条件时，「升级」路线走不通，应改用 **pnpm patch 把它从依赖图里彻底剔除**：

1. 漏洞公告的受影响区间覆盖 npm 上已发布的**所有版本**（如 image-size 的 GHSA-5p2g-fcmc-qvqq / GHSA-w3rx-r6r6-pgpr：`introduced: 0` → `last_affected: 2.0.2`，npm 上最新就是 2.0.2）；
2. 上游仓库已归档，承诺的修复版从未发布（参见 github/advisory-database#9028）；
3. 项目里对它的调用是**死代码**（只在极小分支触发，实际项目永不走到）。

### 操作步骤（pnpm ≥ 10）

```bash
pnpm patch <pkg>@<version>        # 生成可编辑副本到 node_modules/.pnpm_patches/
# 编辑副本：
#   1. 代码里 require 该依赖的行 → 替换为安全实现或 null + 注释说明原因
#   2. package.json dependencies 里删掉该依赖
pnpm patch-commit "<项目根>/node_modules/.pnpm_patches/<pkg>@<version>"   # 注意用绝对路径！
```

patch-commit 会自动把 `pnpm.patchedDependencies` 写进 package.json，patch 文件落在 `patches/` 目录，随仓库走。

### 三个坑

1. **`pnpm patch-commit` 必须在项目根目录用绝对路径执行**。如果 shell 工作目录还停在 `.pnpm_patches/<pkg>` 里，pnpm 会把相对路径再拼一次，报 `ENOENT: ...\.pnpm_patches\<pkg>\node_modules\.pnpm_patches\<pkg>\package.json`。
2. **patch-commit 后 lockfile 可能残留旧解析结果**。pnpm 重解析时用的是 registry 上的**原始 manifest**，不是补丁后的 manifest——lockfile 里该传递依赖可能还在（比如原来被 override 到 2.0.2，删掉 override 后回落到上游声明的 0.5.5）。此时需手工修剪 lockfile 中该包的三类条目：
   - `  <pkg>@<ver>:` + 其 dependencies 块（packages 区）
   - `  <pkg>@<ver>: {}`（snapshots 区，注意缩进是 2 空格）
   - 引用方 dependencies 里的 `    <pkg>: <ver>` 单行
   然后删除 `node_modules/.pnpm/<pkg>@<ver>`，再跑 `pnpm install --frozen-lockfile` 验证通过即合法。
3. **补丁文件混入意外变更**。patch-commit 生成的 .patch 会把编辑副本期间目录里的**所有差异**打进去（例如自动删除了 CHANGELOG.md）。提交前检查 .patch 内容，只保留预期的最小 diff。

### CI/Docker 注意

Dockerfile 里 `pnpm install` 之前必须先 `COPY patches ./patches`，否则 frozen-lockfile 安装直接失败（这是期望的快速失败，防止静默跳过补丁）。

## 本项目实例

- 项目：Tyzxyy-q（游泳专项项目管理系统，RuoYi-Vue3）
- 漏洞：image-size 畸形 CNS 解析 DoS + JXL 递归失控 DoS（高危 ×2，CVSS 8.7/7.5）
- 引入路径：`vite-plugin-svg-icons@2.0.1` → `svg-baker@1.7.0` → `image-size@2.0.2`（此前靠 override 强制到 2.0.2）
- 唯一调用点：`svg-baker/lib/transformations/raster-to-svg.js`，仅当图标目录混入位图（PNG/JPG Buffer）时触发；本项目图标全为纯 SVG，属死代码
- 修复：pnpm patch svg-baker@1.7.0，删除 `require('image-size')` 与依赖声明；清掉 package.json overrides 里的 `image-size: ^2.0.2` 遗留项；手工修剪 lockfile 残留；Dockerfile 补 `COPY patches ./patches`
- 验证：`pnpm install --frozen-lockfile` 通过、`pnpm build:prod` 构建成功、dist 里 SVG symbol 85/85 完整、lockfile 与 node_modules 中 image-size 彻底清零
