# Orange 的 GKD 个人订阅

基于 [gkd-kit/subscription-template](https://github.com/gkd-kit/subscription-template) 的最终产物格式直接手写（GKD 订阅原生支持 JSON5,官方订阅 registry.gkd.li/gkd.json5 也是直接供这个格式,所以跳过了模板的 TS 构建链,零 CI 零依赖）。

- **订阅 URL**: <https://1996818.xyz/testFile/gkd/gkd.json5>
- **导入**: 手机 GKD → 订阅 → 右上角添加 → 粘贴 URL;电脑连手机也可以用:
  ```bash
  adb shell am start -a android.intent.action.VIEW -d "gkd://import/subs?url=https%3A%2F%2F1996818.xyz%2FtestFile%2Fgkd%2Fgkd.json5"
  ```
  （注: 定制版 GKD 1.13 已不支持该深链,直接在 App 里粘贴 URL 添加）
- 本仓库 push 后 GKD 拉新版本有 jsDelivr/Pages 缓存,一般几分钟内;急的话在 GKD 订阅页下拉刷新

## 文件说明

- `gkd.json5` — 订阅本体（人工 + cron 共同维护）
- `apps.json` — 装机应用清单档案（94 个第三方应用:应用名/官方覆盖/个人规则/自动补充策略）
- `cron/check.cjs` + `cron/check.sh` — NEC8(VM103) 每日 9:00 定时任务

## NEC8 每日自动检查（每天 9:00）

部署在 VM103: `~/gkd-cron/check.sh`（crontab: `0 9 * * *`），逻辑:

1. 拉[官方订阅](https://registry.gkd.li/gkd.json5)（失败退 jsDelivr 镜像）
2. 对照 `apps.json` 装机清单,找出「官方未覆盖 && 个人订阅没写 && auto==='stub'」的应用
3. 自动补文本兜底规则（开屏跳过 + 弹窗关闭）,version+1,commit+push,手机端自动更新
4. **银行政务认证类（auto==='never'，18 个）永远不会被自动加规则**;纯工具类（auto==='off'）也不会
5. 日志: `~/gkd-cron/cron.log`（脚本报错会在这里）;重装 NEC8 时: git clone 本仓库到 `~/NEC8-testFile` + `npm install --prefix ~/gkd-cron json5` + 恢复 crontab

改规则正常流程仍是人工改 `gkd.json5`（version+1）push;cron 只负责补新装应用的兜底,补的都是保守文本规则,可在手机上再精修。

## 结构速查（对应模板的 src/ 拆分,这里合成了一个文件）

- 顶层: `id`(唯一随机数,别动) / `version`(改规则必 +1) / `categories` / `globalGroups` / `apps`
- `globalGroups[]`: 全局规则,`matchAnyApp: true` 全应用生效,`excludeMatchedAppIds` 排除敏感应用
- `apps[]`: 按应用写规则,`groups[].rules[].matches` 是 GKD 选择器（gkd.li/api 有完整文档）

## 加新规则的推荐流程

1. 手机 GKD 打开目标 App 的广告页 → 快照/记录功能抓控件树
2. 在快照里选目标节点复制 selector（如 `[id="com.xx:id/btn_close"]`）
3. 在对应 `apps[]` 的 `groups[].rules[]` 里加一条 `{ matches: '...', quickFind: true }`
4. `version` 加 1 → `git push` → 手机 GKD 订阅页下拉更新

注意: 推送前 `git pull --no-rebase`（本仓库有 Worker 自动提交的共享 logo）,只 `git add gkd/`,别动工作区其它杂物。

## 当前规则一览（v2）

- 全局兜底开屏跳过（默认关,订阅页手动开;装机后已开启）
- **荣耀系**: 应用市场（开屏+活动弹窗）、天气（推广弹窗）、图库（精选推荐弹窗）、百度输入法荣耀版（活动弹窗）
- **游戏相关**: 小黑盒/王者营地/和平营地/biubiu加速器/OKTV/GameHub（开屏;营地系含活动弹窗）
- **生活服务**: 华住会（开屏+弹窗）、115生活/一嗨租车（开屏）、红果免费短剧（开屏+推广弹窗）

