# CHANGELOG

> 2026-10-14 建（规矩：本仓库每次修改，同一会话在此记一笔——改了什么/为什么/影响面/踩坑）。

## 2026-10-14

### 新增：qr-toolbox 二维码·条形码生成器（网页 + Chrome 扩展同源）

- **改了什么**：新增 `qr-toolbox/` 完整目录（17 文件，613KB）：主页面 index.html + css/js/vendor（本地打包
  qr-code-styling 1.5.0 / jsQR 1.4.0 / JsBarcode 3.11.6）、100 款中文标识预设 logo（js/logos.js，由
  build/gen-logos.py 从 bootstrap-icons 1.11.3 生成）、MV3 扩展三件套（manifest/popup/icons）与构建工具。
- **为什么**：用户令「二维码生成工具和测试数据生成器一样放进 git 仓库并托管在线访问」；本仓库即 1996818.xyz
  的 Pages 源，推上来即上线，在线地址 https://1996818.xyz/testFile/qr-toolbox/ 。
- **影响面**：纯新增目录，不改仓库任何既有文件；工作区 `NEC8_KEYs/chrome-plugins/qr-toolbox` 副本已删，
  **此目录为唯一源码归宿**（用户令：以后改二维码生成器就改这里）。
- **功能**：9 种内容类型、以图生图（识图重生成）、码点/定位角/渐变皮肤、马卡龙配色、100 logo（分类+搜索+
  自定义上传自动抠白底）、19 种条形码、PNG 导出/复制、设置持久化、紧凑应用壳布局；100% 本地离线。
- **踩坑**：① state.values 必须「类型→字段名→值」两层对象，首版把 text/url 写成字符串导致 strict 模式
  监听器抛错、永不出码（已修+坏结构回退）；② PowerShell System.Drawing 嵌套函数坐标表达式踩 op_Multiply
  on Object[]，白色底悄悄没画上，改硬编码坐标后通过；③ jsQR 对大logo+圆点+渐变花码识别有限（生成端正常，
  已自动 H 级纠错缓解）；④ bootstrap-icons 无 at-sign/smartphone/sailboat/navigation/utensils，候选清单
  已换 at/tablet-fill/signpost-split-fill/geo-fill/shop-window。
- **测试**：本地 http 服务实测——生成内容 jsQR 回读一致（含 WiFi 密码转义）、马卡龙联动、logo 应用+EC 自动
  升级、条形码合法渲染+非法拦截、识图→重生成全链路、紧凑布局与透明底视觉验收均通过。
