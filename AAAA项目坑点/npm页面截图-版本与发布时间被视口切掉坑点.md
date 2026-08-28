# npm 页面截图：版本时间被切 + headless 被 Cloudflare 拦 坑点

对 `https://www.npmjs.com/package/<包名>` 自动化截图作证据时，有两个叠加的坑，会让截图沦为废图。

## 坑 A：版本与发布时间被视口切掉

**现象**：截图里只有包名标题 + 左侧 README，右侧侧边栏的 Version / Last publish 缺失。

**根因**：版本号与最后发布时间在**右侧侧边栏**，DOM 纵坐标常在 y≈870~1034，超出普通视口高度（~930）。

**叠加陷阱（chrome-devtools mcp）**：想 `resize_page` 调高视口兜住侧边栏——**无效**。mcp 控制的浏览器窗口受**物理屏幕高度限制**，实测视口死卡在 931，resize 到 1300 后 `window.innerHeight` 仍是 931。

**修复**：截图前先滚动，把侧边栏 `Version` 块（找文本为 "Version" 的 h3）`scrollIntoView({block:'start'})` 后 `scrollBy(0,-50)`，紧随其下的 Last publish 一并入镜，再截图。

## 坑 B：headless 浏览器被 Cloudflare 拦截（更致命）

**现象**：用 Playwright **headless** 批量截图，结果大量截图是 Cloudflare 人机验证页（`title: "Just a moment..."`，正文 "Performing security verification ... protect against malicious bots"），并非包页面。并发越高触发越快，全量跑可能整批废掉。

**根因**：npm 接 Cloudflare 防护，headless 浏览器有 bot 特征（`navigator.webdriver=true` 等）被识别拦截。而 chrome-devtools mcp 用的是**本机已登录的真实 Chrome**（非 headless），所以能过——这会误导你以为"浏览器自动化没问题"，一换 headless 就崩。

**修复（必须三件套）**：
1. **headed 模式**：`launch(headless=False, args=["--disable-blink-features=AutomationControlled"])`。
2. **反检测 init script**：`add_init_script` 隐藏 `navigator.webdriver`（→undefined）、伪造 `plugins`/`languages`、补 `window.chrome`。
3. **低并发 + 请求间随机延迟**（如 workers=2、每请求 sleep 1.5~3.5s），避免触发频控。

并配合**有效性检测**剔除废图：截图前循环读 `document.title`，仍是 "Just a moment/checking/attention" 则判 `fail:cloudflare`（等 20~25s 仍不过放弃）；页面正文含 "couldn't find a package / 404" 判 `fail:notfound`。**异常的一律不写图文件**，避免把验证页/404 当证据。

## 坑 C：主页只显示最新版，看不到「当前引用版本」的时间

**现象**：截 `/package/<包名>` 主页，Version 是**最新版**，Last publish 是**最新版时间**；扫描表里引用的旧版本（如 7.2.3）的发布时间**主页根本没有**。

**修复**：改截 **versions tab** `/package/<包名>?activeTab=versions`——列出每个版本及发布时间。截图前用 JS 找到「版本号 == 引用版本」的元素 `scrollIntoView({block:'center'})` 让该行入镜。
进一步：用 PIL 在截图顶部加**标注条**（包名 / referenced 版本@时间 / latest 版本@时间 / 状态），数据取自 registry API（准确），既保真又信息密度高，一张图满足"看清包名+两个版本时间"。

## 判别要点（踩坑信号）
- 截图 title 是 "Just a moment" 或正文是 "security verification" → 命中坑 B（headless 被 CF 拦）。
- 截图只有 README、右侧 Version/Last publish 不见 → 坑 A。
- 截的是最新版页面、引用版本的时间找不到 → 坑 C。
- `resize_page` 后 `window.innerHeight` 不变 → 坑 A 的 mcp 视口叠加陷阱。

## 本项目实例
- 项目：依赖新鲜度检查工具（`D:\Users\Orange\Desktop\依赖新鲜度检查工具`）
- 踩坑历程：首批用 chrome-devtools mcp 截图，侧边栏时间被切（坑 A）；改 Playwright headless 全量重截 208 个，结果被 Cloudflare 拦成验证页废图（坑 B）；主页还看不到引用版本时间（坑 C）。
- 最终修复：`scripts/screenshot_npm.py` = headed + 反检测过 CF + versions tab + 滚动引用版本行 + PIL 标注条 + Cloudflare/404 检测剔除废图。流程与坑点写入 `.claude/skills/dep-freshness/SKILL.md`。

## 相关坑点
- [[依赖新鲜度扫描-无时间过期多为无解坑点]]
- [[SCA依赖新鲜度校验与升级坑点]]
