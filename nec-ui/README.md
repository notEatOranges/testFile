# nec-ui

Orange 的网页设计系统（2026-10-15 从 qr-toolbox 实战样式抽取）。**写任何本机网页 UI 前先引用它**，禁止裸原生控件、禁止 prompt() 要配置（一律页面内联输入）。

## 引用方式（三选一）

```html
<!-- 1. Pages CDN（1996818.xyz 上的一切页面首选） -->
<link rel="stylesheet" href="https://1996818.xyz/testFile/nec-ui/dist/nec-ui.css?v=1.0.0">
<script src="https://1996818.xyz/testFile/nec-ui/dist/nec-ui.js?v=1.0.0"></script>

<!-- 2. 仓库相对路径（页面也在 testFile 仓库里时） -->
<link rel="stylesheet" href="../nec-ui/dist/nec-ui.css?v=1.0.0">
<script src="../nec-ui/dist/nec-ui.js?v=1.0.0"></script>

<!-- 3. npm（本地工程） -->
npm install file:../nec-ui
```

## 内容

| 文件 | 内容 |
|---|---|
| `dist/nec-ui.css` | 设计 tokens（`--nui-*` 变量）、卡片、按钮（primary/ok/danger/ghost/sm）、**全类型输入框**（text/password/date/email/select/textarea 统一样式，select 自绘箭头）、勾选/颜色/行布局、模式切换胶囊、标签页、提示条、toast、拖放区、滚动条（内缩悬浮不穿圆角）、自绘下拉/日历的样式 |
| `dist/nec-ui.js` | `NUI.toast(msg)`、`NUI.enhanceSelect(root)`（select → 自绘弹层下拉，fixed 定位不裁切，触屏自动跳过）、`NUI.calendar.scan(root)`（date/datetime-local → 自绘日历，含时间选择/清除此刻）——加载后自动扫描全文档 |

## 约定（重要）

1. **引用处 `?v=` 版本参数**：改了 css/js，所有 `<link>/<script>` 的 `?v=` 同步 bump——否则 CF/浏览器缓存旧文件，「改了没生效」。
2. **绝不用 `window.prompt()`** 要口令/配置——一律页面内联输入框（存 localStorage），缺失时高亮该输入框。
3. 命名前缀 `nui-`；页面自有样式放各自 css，nec-ui 作为基础层在其后引入。
4. 发布到 Pages：本目录随 testFile 仓库 push 即自动上线（GitHub Pages）。
5. npm 发布（可选）：`npm publish`（需 npm 账号）；本地工程可 `npm install file:../nec-ui`。

## 已接入

- qr-toolbox/mp.html（小程序码工作台）
- qr-toolbox 主页 / mock-data-pro 为同源手写样式（ nec-ui 由此抽取），后续逐步切换
