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

### 2026-10-14（晚二）：识图入类型、Logo 卡右移、H5、共享 logo 库、白衬底圆角修复（用户 6 项反馈）

- **改了什么**：
  1. 「以图生图·识别已有二维码」从右栏独立卡片改为**内容类型第 10 个 tab「📷 识图转码」**；识别成功后预览区
     立即按识别内容自动出码，「用此内容重新生成」切回文本模式可继续编辑换肤。
  2. **中心 Logo 卡移到右栏**（预览下方），左栏只剩内容+样式。
  3. **H5 适配**（≤860px 单列、类型标签横滑、触控加大、顶栏精简）；桌面应用壳布局本身随窗口 resize 实时自适应。
  4. **共享 logo 库**：新增 Cloudflare Worker `qr-logos`（logos.1996818.xyz，KV 存储，代码=worker/ 目录，
     口令走 secret 不入公开仓库，凭据档案=NEC8_KEYs/keys/qr-logos-vault.md）。Logo 卡新增绿色「共享上传」
     按钮（首次弹窗输口令，存 localStorage）；页面加载时自动拉取共享库并入「用户共享」分类；manifest 加
     host_permissions 供扩展形态使用。别人打开页面就能看到你共享的 logo。
  5. **修白衬底圆角 bug**：根因=qr-code-styling 的 hideBackgroundDots 跳过区是方形、白底时盖住衬底圆角；
     修复=白色衬底开启时自动不传抠点（衬底本身即遮挡），实测 50% 大 logo 四角圆角完好且回读可解。
  6. 白衬底圆角半径 0.18→0.22。
- **为什么**：用户六项反馈（识图设为内容类型 / logo 放右边 / 高度随窗口实时算 / 适配 H5 / logo 可上传共享给
  所有访客 / 白衬底大尺寸圆角消失）。
- **影响面**：index.html/css/app.js/manifest.json；新增 worker/ 目录（部署物）；后端新增 logos.1996818.xyz
  子域（CF DNS 橙云 A 记录 fbffa8f9 + Worker 路由）。
- **踩坑**：无（本轮顺利）。回归覆盖：结构/识图tab/拖图自动出码/重生成按钮/白衬底四角像素检测/共享加载
  （100+1、用户共享分类）/H5 单列+横滑+触控，全部通过；API 写读删+401 鉴权 curl 实测通过。
- **部署**：Worker 已上线（版本 e93c8d4c）；本页随 git push 经 Pages 发布。

### 2026-10-14（晚三）：logo 库扩至 10000、染色联动、共享库改 git 存储、H5 顶栏固定（用户 4+4 项反馈）

- **改了什么**：
  1. **内置 logo 100 → 10000**：精选 100（中文标注，内嵌 base64）+ 集合图标 9900 文件化（Tabler 3.28.1 +
     Bootstrap 1.11.3 + Lucide 1.57.0 + Material 0.48.0，logos/*.svg 逐文件 + js/logos-index.js 索引 1.1MB）；
     网格分批渲染（初始 120）、**触底自动追加**、img loading=lazy 按需拉图、搜索全索引即时过滤；
     分类下拉新增 Tabler/Bootstrap/Lucide/Material 四集合。构建=qr-toolbox/build/gen-logos.py（素材 _iconsrc/
     已 .gitignore 排除）。
  2. **预设 SVG logo 颜色跟随码颜色**：应用/换色时把 svg 的 currentColor/#111/#000 替换为 fg（渐变取起始色），
     马卡龙/色板/hex/渐变开关变化**自动重染**已选 logo；rawSvg 缓存避免重复拉取。
  3. **共享库从 KV 改为 git 存储**（用户令「我其实是想放在 git 里面的」）：Worker qr-logos 重写为 GitHub
     Contents API 代理（POST 上传→commit shared-logos/<id>.<ext> + index.json；PUT 改名；DELETE 删除；
     GITHUB_TOKEN/SHARE_KEY 走 Worker secret）；前端读取改 fetch 同源 shared-logos/index.json（纯静态）；
     **上传必弹窗命名**；共享 logo **双击改名**。KV namespace 弃用。
  4. **H5**：顶栏 fixed 固定（随页面滚动始终可见）+ 二维码/条码按钮 icon 化单行 + 标题砍后缀；预览区压缩
     （min-height 168、码图 max-width 72%）给表单让位。
  5. 右栏改 flex 满高：Logo 卡吃满窗口剩余高度（「按窗口高度计算」），grid 弹性 + 栏内滚动。
  6. 资源引用版本参数 v=1.3.1（**内容变更必须 bump 版本号**，否则 CF/浏览器缓存旧 JS——本轮踩过：同版本号
     参数下浏览器拿了旧 app.js 症状诡异）。
- **为什么**：用户 8 项反馈（logo 扩容+懒加载 / 卡片高度随窗口 / 共享传 git+命名+改名 / H5 预览挡内容 /
  顶栏竖排 icon 化 / 顶栏要固定 / 触底自动加载+批量加大 / 选后不回顶）。
- **影响面**：qr-toolbox 全套（index/css/app/logos-index/9900 svg/worker/manifest host_permissions 加
  1996818.xyz）；仓库体积 +25MB（图标文件）。
- **踩坑**：① 同版本参数浏览器缓存旧 JS→回归假失败，bump 后复验通过；② sticky 顶栏在 body overflow:auto
  下不吸附（barTop=-600），改 fixed+padding-top 一击必中；③ npmmirror 未同步 @tabler/icons-svg（NoSuchKey），
  改走 GitHub release zip（v3.28.1，44MB）；④ 染色像素检测采样窗口太小会虚惊（±18px 落在线条稀疏区），
  用 logo PNG 本体统计（tinted=31432）+ 画布大窗口复核（tinted=2239+解码成功）才是硬证据。
- **测试**：初始 120/触底自动 240/无破图；wifi 搜索命中 16（精选中文+Tabler/Lucide）；集合 svg 应用→active
  态+rawSvg 缓存+**滚动位置保持不重建**；马卡龙点击→logo 重染海盐蓝（PNG 本体 31432 像素）+ 白衬底 + jsQR
  回读成功；H5 fixed 顶栏滚动 800 后 top=0；Worker git 写链路（POST→仓库文件+index 出现→中文 UTF-8 往返→
  DELETE 清理）端到端通过。

### 2026-10-14（晚四）：logo 在线搜图库接入（用户令「搜索logo直接接入iconfont，搜完直接选择用」）

- **改了什么**：Logo 卡新增「在线搜」按钮（搜索框回车同效）——经 Worker `GET /iconsearch?q=` 代理 **Iconify
  聚合 API**（200+ 图标集，无需登录），一次返回 40 个含完整 svg 的结果；点击即用（走既有 svg→染色→衬底→
  rasterize 链路，自动染码色、可换色重染）；顶部提示条可一键返回本地 10000 库。
- **为什么**：iconfont.cn 官方搜索接口实测 `LOGIN REQUIRED`（2026-10-14），网页端访客无法直连；改用等效的
  开放聚合库，体验一致（关键词搜索→点击直接用），Worker 代理同时解决 CORS 与国内可达性。
- **影响面**：worker/src/worker.js（+iconsearch 端点，公开只读）、index.html（按钮/提示条，v=1.4.0）、
  app.js（onlineSearch/onlineClear/在线模式渲染）、style.css。Worker 已部署（版本 71d64137）。
- **测试**：线上代理 curl（wifi→40 个带 svg）；本地回归：搜索 40 项 0 破图 → 点击应用（presetId=if:
  material-symbols:wifi + rawSvg 缓存 + active 态）→ 马卡龙换色重染 → jsQR 解码成功 → 清除返回本地库（16 项）。
