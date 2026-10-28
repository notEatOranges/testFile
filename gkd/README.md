# Orange 的 GKD 个人订阅

基于 [gkd-kit/subscription-template](https://github.com/gkd-kit/subscription-template) 的最终产物格式直接手写（GKD 订阅原生支持 JSON5,官方订阅 registry.gkd.li/gkd.json5 也是直接供这个格式,所以跳过了模板的 TS 构建链,零 CI 零依赖）。

- **订阅 URL**: <https://1996818.xyz/testFile/gkd/gkd.json5>
- **导入**: 手机 GKD → 订阅 → 右上角添加 → 粘贴 URL;电脑连手机也可以用:
  ```bash
  adb shell am start -a android.intent.action.VIEW -d "gkd://import/subs?url=https%3A%2F%2F1996818.xyz%2FtestFile%2Fgkd%2Fgkd.json5"
  ```
- 本仓库 push 后 GKD 拉新版本有 jsDelivr/Pages 缓存,一般几分钟内;急的话在 GKD 订阅页下拉刷新

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

## 当前规则一览

- 全局兜底开屏跳过（默认关,订阅页手动开）
- 荣耀应用市场: 开屏跳过 + 首页活动弹窗（关闭/以后再说）
- 荣耀天气: 推广弹窗
- 荣耀图库: 精选推荐弹窗
- 百度输入法荣耀版: 活动推广弹窗
- 小黑盒: 开屏跳过
