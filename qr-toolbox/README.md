# qr-toolbox —— 二维码 · 条形码生成器（网页版 + Chrome 扩展同源）

> 2026-10-14 首次入库。**本目录是此工具的唯一源码归宿**：以后改二维码生成器就在这里改，改完 push 即自动经 GitHub Pages 发布上线。

## 在线访问（GitHub Pages 托管）

- **https://1996818.xyz/testFile/qr-toolbox/**（自定义域名，Cloudflare 前置）
- 等价地址：`https://notEatOranges.github.io/testFile/qr-toolbox/`

纯静态、**100% 本地离线运行**（所有生成/识别在浏览器完成，无任何网络请求），手机浏览器也能用。

## 功能

- **内容类型**：文本 / 网址 / WiFi / 名片(vCard) / 日程(vEvent) / 邮件 / 位置 / 电话 / 短信
- **以图生图**：上传 / 拖拽 / Ctrl+V 粘贴已有二维码 → jsQR 本地识别 → 一键换肤重新生成
- **美化**：5 种码点皮肤、定位角/定位点样式、线性/径向渐变；色板 + 16 进制输入 + 8 套马卡龙配色（默认纯黑）；透明底
- **中心 Logo**：100 款预设（Bootstrap Icons 1.11.3，中文名 + 12 分类 + 搜索）+ 自定义上传（位图自动抠白底）；默认透明衬底，可开白色衬底；启用后自动切 H 级纠错
- **条形码**：CODE128(A/B/C) / EAN13 / EAN8 / EAN5 / EAN2 / UPC(A/E) / CODE39 / ITF(14) / MSI 系列 / Pharmacode / Codabar
- **导出**：PNG 下载 / 复制到剪贴板；设置 localStorage 持久化
- **布局**：紧凑应用壳（页面不滚动，左右栏内部滚动）

## Chrome 扩展形态

本目录同时是完整 MV3 扩展（`manifest.json` + `popup.html` 快速出码）。装法：`chrome://extensions` →
开发者模式 → 加载已解压 → 选本目录。扩展与网页共用同一套 index/css/js/vendor，改任何一处两端同时生效。
工作区侧封装说明：`NEC8_KEYs/chrome-plugins/`（mock-data-generator 扩展在那边）。

## 目录结构

```
qr-toolbox/
├── index.html            # 主页面（网页/扩展共用）
├── css/style.css
├── js/app.js             # 主逻辑（含调试句柄 window.__qrtb）
├── js/logos.js           # 100 款预设 logo（由 build/gen-logos.py 生成，勿手改）
├── vendor/               # qr-code-styling 1.5.0 / jsQR 1.4.0 / JsBarcode 3.11.6
├── popup.html/css/js     # 扩展弹窗快速模式
├── manifest.json         # MV3 清单
├── icons/                # 扩展图标（build/make-icons.ps1 生成）
└── build/                # 构建工具（运行不需要）
    ├── gen-logos.py      # logos-candidates.txt + bootstrap-icons tgz -> js/logos.js
    ├── logos-candidates.txt
    └── make-icons.ps1    # pwsh 生成扩展图标
```

## 改动发布流程

1. 直接改本目录文件
2. 本仓库根 `CHANGELOG.md` 记一笔（改了什么/为什么/影响面/踩坑）
3. `git add qr-toolbox CHANGELOG.md && git commit -m "..." && git push`
4. 等 1~2 分钟 GitHub Pages 构建完成即上线；本地验证可临时 `python -m http.server` 开着页面测

## 已知边界

- jsQR（识图解码器）对「大 logo + 圆点 + 渐变」花式码识别有限（真机相机更强）；正式印刷建议实机扫码验证
- logo 图标库为开源 Bootstrap Icons（MIT）而非 iconfont.cn（需登录下载、版权归属不一）；换图标走 build/ 脚本重新生成
