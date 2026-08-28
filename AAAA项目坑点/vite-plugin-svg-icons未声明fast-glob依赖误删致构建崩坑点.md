# vite-plugin-svg-icons 未声明 fast-glob 依赖，被工具误判"未使用"删除后 vite 构建直接崩

## 现象
用 `depcheck` 扫 unused dependencies，报告 `fast-glob` 未被使用；`pnpm why fast-glob` 也返回空（依赖树里没有任何包声明依赖它）。看似是一个"既无直接引用、又无间接引用"的孤儿包，从 `package.json` 删掉。结果 `pnpm install` 干净通过、甚至少装了 10 个包，但 **`vite build` 立刻失败**：
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'fast-glob' imported from
  .../node_modules/.pnpm/vite-plugin-svg-icons@2.0.1_xxx/node_modules/vite-plugin-svg-icons/dist/index.mjs
```

## 根因
`vite-plugin-svg-icons@2.0.1`（及其 2.x 系列）的打包产物 `dist/index.mjs` 里 `import 'fast-glob'`，但它的 `package.json` **dependencies 里根本没声明 `fast-glob`**——这是一个"幽灵依赖 / 缺失依赖声明"bug。插件靠**消费方项目在顶层提供 fast-glob**才能跑通：
- 项目在 `dependencies`/`devDependencies` 声明了 `fast-glob` → Node 从项目 `node_modules` 解析成功 → 构建正常；
- 项目删掉它、且依赖树里没有别的包传递引入 fast-glob → 插件 import 解析失败 → `ERR_MODULE_NOT_FOUND`。

`pnpm` 的严格隔离反而把这个问题**显式化**了：pnpm 默认不为未声明的依赖创建可访问的符号链接，所以一旦顶层移除、又无传递来源，就彻底找不到。换成 npm 的扁平 hoisting，只要树里有任意一个包拉到 fast-glob，反而会"碰巧能跑"——问题被掩盖、更隐蔽。

`vite-plugin-svg-icons` 已**停止维护（停更）**，这个缺失的依赖声明上游永远不会修，只能消费方自己兜底。

## 为什么工具会集体误报（关键陷阱）
- `depcheck` 只扫**当前项目源码**的 import，看不到 `node_modules` 里插件产物对 fast-glob 的引用 → 报"未使用"。
- `pnpm why fast-glob` 返回空，是因为没有任何包**声明**依赖它（插件本该声明却没声明）→ 看起来"连间接依赖都没有"。
- 两个工具都指向"可删"，**但都是基于"声明"而非"实际运行时解析"判断的**，对这种幽灵依赖全部失真。

## 排查 / 验证
判断一个"看似未使用"的依赖能不能删，**不能只信 depcheck + pnpm why**，必须用真实构建兜底：
```bash
npx depcheck --json | jq '.devDependencies,.dependencies'   # 看候选
pnpm why <pkg>                                                # 看声明链（幽灵依赖会返回空，别被骗）
grep -rn "<pkg>" --exclude-dir=node_modules .                 # 看项目源码引用
# 决定删之前，务必：
pnpm build:prod   # 或 dev，跑一次真实构建/启动
```
若删除后构建报 `ERR_MODULE_NOT_FOUND ... imported from .../node_modules/<某插件>/dist/...` → 典型幽灵依赖，立即还原。

## 修复 / 通用规则
1. **保留 `fast-glob` 在项目顶层 `devDependencies`**（本插件停更，没有"等上游修"这条路）。
2. 评估依赖是否可删，**三验合一**：depcheck + pnpm why + **真实 build**，缺一不可。前两者是"声明层"信息，只有 build 是"运行时解析层"事实。
3. 对 pnpm 项目尤其要警惕：pnpm 严格隔离会让幽灵依赖**更容易暴露成硬故障**（npm 下可能长期静默"能跑"）。迁到 pnpm 或升 vite 大版本后，原本被掩盖的幽灵依赖会集中爆发。
4. 类似的"插件 dist 引用了却没声明"的高危包，常见于**已停更的 Vite 生态插件**（vite-plugin-svg-icons 是典型），扫描时直接列为"不可删"白名单。

## 本项目实例
- 项目：**Tyzxyy-q**（游泳专项项目管理系统，RuoYi-Vue3 + Vite 8 + pnpm 10.28.2）
- 触发：清理 unused dependencies 时，`depcheck` 标记 `fast-glob` 未使用、`pnpm why fast-glob` 返回空 → 从 `package.json` 删除 → `pnpm install` 成功（少装 10 包）→ `pnpm build:prod` 崩，报 `Cannot find package 'fast-glob' imported from vite-plugin-svg-icons@2.0.1/dist/index.mjs`。
- 处置：立即还原 `fast-glob` 顶层声明，重新 install + build 验证通过（`✓ built in 22.36s`）。结论：本项目 **26 个直接依赖全部必要、无任何可删项**。
- 关联：本项目 `docs/gotchas/依赖新鲜度扫描-无时间过期多为无解坑点.md` 已记录 `vite-plugin-svg-icons` 停更、需在扫描平台标记豁免——与其缺失 fast-glob 声明是同一根本原因（上游不维护）。

## 相关
- [[pnpm-overrides修漏洞后孤儿包残留仍被扫描告警坑点]] —— 同为 pnpm 依赖树"声明 vs 实际"不一致问题
- [[依赖新鲜度扫描-无时间过期多为无解坑点]] —— 停更插件的处理策略
