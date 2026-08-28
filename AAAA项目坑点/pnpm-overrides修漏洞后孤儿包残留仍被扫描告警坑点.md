# pnpm overrides 修复传递依赖漏洞后，孤儿包残留仍被扫描器告警

## 现象
用 `pnpm.overrides` 把某个有漏洞的传递依赖（如 `form-data` ≤ 4.0.5，CVE-2026-12143 CRLF 注入）强制升到修复版本（4.0.6），`pnpm why <pkg>` 也确认只用到新版本，但安全扫描器（镜像源/SCA）**仍然告警**说存在旧漏洞版本。

## 根因
pnpm 的覆盖（override）只改变**解析结果**，不会主动清理 `node_modules/.pnpm/` 里**之前装过的旧版本目录**。于是出现：
- 新 `pnpm-lock.yaml` / `pnpm why` 只引用新版本；
- 但 `node_modules/.pnpm/<pkg>@<旧版本>/` 这个**孤儿目录**还在，里面的 `package.json` 仍是旧版本号；
- 扫描器扫的是 `node_modules`（或磁盘上的包），看到旧版本 `package.json` 就告警，哪怕没有任何包再引用它。

## 排查三连
```bash
pnpm why <pkg>                 # 看实际引用链，确认只用新版本
grep -n "<pkg>@" pnpm-lock.yaml # 确认 lockfile 只剩新版本
ls -d node_modules/.pnpm/<pkg>@* # 看磁盘上是否还残留旧版本目录
# 确认旧版本是孤儿（无入站引用）：
find node_modules/.pnpm -type l -name "<pkg>" | while read l; do
  case "$(readlink "$l")" in *<pkg>@<旧版本>*) echo "$l";; esac
done
```
若 lockfile 只有新版本、且无符号链接指向旧版本目录 → 旧目录是孤儿，可安全删除。

## 修复
1. `package.json` 里 override 写对（这是真正的修复，CI / 全新 `pnpm install` 不会再装旧版本）：
   ```json
   "pnpm": { "overrides": { "form-data": "4.0.6" } }
   ```
2. 清掉本地残留的孤儿目录（仅本机需要，CI 全新装不会有）：
   ```bash
   rm -rf node_modules/.pnpm/<pkg>@<旧版本>
   ```
   顽固的话直接 `rm -rf node_modules && pnpm install`（全局 store 有缓存时很快，基本不下载）。
3. 重新扫描确认告警消失。

## 要点
- override 生效 ≠ 扫描通过；**override + 清理 node_modules 残留** 才算真正闭环。
- `pnpm install` 对"Already up to date"的依赖树**不会**主动 prune 孤儿目录，别指望它自动清。
- CI 环境一般每次全新装 node_modules，所以 CI 通常不复现；本机/已存在 node_modules 的环境才会踩。

## 本项目实例
- 项目：**Qsntypx-q**（青少年智能培训管理系统）
- 漏洞：`form-data` ≤ 4.0.5，CVE-2026-12143（CRLF 注入 / HTTP 请求走私，CWE-93），由 `axios@1.16.1` 传递引入。
- 修复版本：`4.0.6`（registry latest 即此版本，>4.0.5 即修复）。
- 已做：`package.json` 加 `"pnpm.overrides": { "form-data": "4.0.6" }`；删除残留的 `node_modules/.pnpm/form-data@4.0.5` 孤儿目录；重新生成 `pnpm-lock.yaml`（仅含 4.0.6）。
- 验证：`pnpm why form-data` → 仅 `axios 1.16.1 └── form-data 4.0.6`；构建通过。

## 补充实例与教训（Tyzxyy-q，2026-07）

### 实例：批量 override 11 个传递依赖，31 漏洞 → 0
- 项目 **Tyzxyy-q**（RuoYi-Vue3），`pnpm audit` 报 31 漏洞（17 high + 14 moderate）。
- 方案：直接升级 `axios` ^1.18.0（修 axios 自身 10 个 CVE，含多个原型污染）+ `pnpm.overrides` 锁 11 个传递依赖（ssh2、braces、micromatch、postcss、form-data、immutable、svgo、fast-uri、valibot、glob@^10、brace-expansion）。
- `pnpm 10.28.2` 会随 install **主动 prune** 孤儿目录（本项目 ansi-regex@2.1.1 孤儿即被自动清除，无需手动 `rm -rf node_modules`）——比旧版 pnpm 省心；但仍建议复查 `ls node_modules/.pnpm/<pkg>@*`。
- 验证：`pnpm build:prod` 通过（postcss 5→8 没破坏 vite-plugin-svg-icons / svg-baker，最大风险点安全）；`pnpm audit` → No known vulnerabilities。

### 教训：同一包多个 advisory，修复版本可能差很多（跨大版本）
- `brace-expansion` 同时有多个 advisory：GHSA-3jxr-9vmj-r5cp（修复 1.1.16 / 2.1.2）和 GHSA-mh99-v99m-4gvg（修复 **5.0.8**，`<=5.0.7` 全部受影响，**1.x/2.x 整条线无修复版本**）。
- 初次只 override `brace-expansion@^1→1.1.16`、`@^2→2.1.2`，结果 audit 仍报 2 个 high（GHSA-mh99 的范围 `<=5.0.7` 覆盖了 1.x/2.x）。
- 结论：**看 advisory 要看 patched versions 的最高要求**；若某 advisory 的修复只在新主版本，必须跨大版本 override（`"brace-expansion": "^5.0.8"`），不能只升小版本。

### 教训：版本选择器 override 语法
- 一个包有多个大版本时，用 `pkg@^1.0.0`、`pkg@^2.0.0` 分别锁定；若需统一（如 brace-expansion 全升 5.x），用全局 `pkg` 键。
- 只想升某条线、保留其它（如 glob 只升 10.x 不动 7.x）：`"glob@^10.0.0": "^10.5.0"`。
- pnpm overrides 的 key 用 semver range 选择器（`@^1.0.0`），不是裸数字（`@1`）。
