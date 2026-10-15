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

### 2026-10-15：两页面补 favicon（用户反馈「都没有 icon 标志」）
- qr-toolbox：head 加 icon/apple-touch-icon 引用 icons/icon128.png（复用扩展图标）
- mock-data-generator.html：assets/mock-icon.png 入库（自 chrome-plugins 扩展图标复制）+ head 引用
- 纯增量，不改逻辑；扩展形态 tab 图标本就来自 manifest，不受影响

### 2026-10-15（二）：Logo 卡工具行重排（用户反馈「上传按钮没必要跟搜索挤一块，看不清」）
- 原单行 5 元素（搜索框/在线搜/分类/本地上传/共享上传）挤到「共享上传」被截断 → 拆两行：
  行1=搜索框+在线搜（搜索动作）；行2=分类下拉+本地上传+共享上传（浏览与添加动作）
- v1.4.1

### 2026-10-15（三）：下拉框统一美化（用户反馈「下拉框样式搞好看点」）
- 全站 select 去 Windows 原生外观（appearance:none）+ 自绘 SVG 细箭头（右侧内嵌、随主题灰），
  padding-right 26 防文字压箭头，hover/focus 与输入框同款描边阴影，option 底色统一白
- 踩坑：select{} 的 background-image 会被 .field select 的 background 简写（#fbfbfe）整组覆盖成 none
  （特异性+简写重置），箭头消失；background-image/position/size 加 !important 后稳定
- v1.4.3

### 2026-10-15（四）：下拉组件化（弹层卡片）+ 数据生成器 Pro 工程版（用户反馈两项）

- **qr-toolbox v1.5.0**：原生 select 弹层浏览器无法用 CSS 定制 → 自绘 Dropdown 组件全站替换
  （.dd 按钮承载闭合态，弹层=圆角卡片+阴影+悬停高亮+选中态+Esc/外点关闭；选中后同步隐藏 select 的值并
  dispatch change，**全部现有监听零改动**；renderForm 动态表单/restoreUI 回显均已接线；
  触屏 pointer:coarse 自动跳过保留原生滚轮）。
- **mock-data-pro/ 工程版上线**（原单文件 mock-data-generator.html 保留不动）：同一套 qr 设计语言重写样式
  （顶栏+卡片+渐变主按钮+新表格 hover/sticky 表头+省市区可搜下拉同款），body 取自本地化版（无内联事件），
  css/js 外链 defer 拆分（重复访问走缓存）；js 加同款 Dropdown 组件（3 个下拉）。在线
  https://1996818.xyz/testFile/mock-data-pro/
- 回归：qr 7 个下拉组件化+弹层交互+动态表单覆盖；mock-pro 30 条自动生成、下拉联动数量（5 条）、0 原生 select 可见。

### 2026-10-15（五）：滚动条穿圆角 + 上传按钮偏矮（用户反馈两项）
- 全部内圆角滚动容器（dd-list/logo-grid/左右栏/table-wrap/ss-dropdown/preview/decode-text）滚动条改
  「内缩悬浮」样式：透明轨道 + thumb 透明边距（border+background-clip 技巧）+ 圆角，不再方角穿出容器圆角
- 「本地上传/共享上传」按钮增高对齐下拉按钮（5.5px 上下 padding，28px 高）
- qr v1.5.1 / mock-data-pro v1.0.1，两工程同步

### 2026-10-15（六）：修身份证偶发为空（用户反馈「首次加载和刷新有概率生成不出来身份证等信息」）
- **根因**：随机地址在 34 省级里抽中台湾/香港/澳门（约 9%/行）→ 按规则这些地区不生成大陆身份证 → 该行
  身份证列空 + toast 提示，用户感知为"偶发生成失败"。属原页面逻辑与生俱来的行为，非工程版引入。
- **修复**：randomAddrInfo 默认随机地址排除港澳台三省（地址语义自洽、身份证必有）；自定义里显式选港澳台
  省份仍按原逻辑（身份证留空+提示）。原单文件与 pro 版同步修复（pro v1.0.2）。
- 回归：连跑 12 轮 ×30 行=360 行，身份证空值 0、港澳台地址 0、无警告 toast。

### 2026-10-15（七）：页面图标全面更新 + 日期控件美化（用户反馈三项）
- **数据生成器 favicon**：换成用户下载的身份证.svg（assets/id-card.svg 主用 + 浏览器光栅化 id-card-128/48/16.png
  兜底），Pro 版与原单文件同步替换
- **二维码工具 favicon/扩展图标**：用页面自己的引擎生成「页面网址二维码」当图标（icon512/128/48/16 四尺寸
  重写，扩展 manifest v1.2.0 同步引用并加 512）——图标即内容，扫 favicon 可直达页面
- **日期控件美化**（两工程）：date/datetime-local 输入统一高度字体 + color-scheme:light 防系统暗色涂黑 +
  日历指示器 hover 渐显；原生日历弹层为系统控件不可定制
- 踩坑：多支 QRCodeStyling append 到同一容器时 querySelector('canvas') 永远命中第一支——四尺寸曾生成同一张
  512 图（字节数相同暴露），改为每支独立 holder 后正确

### 2026-10-15（八）：去掉网址默认值 + favicon URL 版本化（用户反馈两项）
- **默认内容不再塞 https://1996818.xyz**：新访客文本默认空（显示占位提示）；老用户 localStorage 里存的
  旧默认值加载时自动清空（用户令「不要把这个网址作为默认值」）。v1.5.2
- **书签图标不更新说明**：线上 favicon 已是新图标（身份证/网址二维码），但 Chrome 书签的 favicon 在收藏时
  固化、页面换图标不自动刷新——需删除书签重新收藏一次；为此 favicon URL 加 ?v=2 确保重收藏必拿新图。

### 2026-10-15（九）：快捷粘贴解析 + 内容串解码（用户需求「各类型支持粘贴字符串生成 + 解码功能」）
- 内容卡新增「解析」框（按类型提示格式）：两种能力——
  ① 中文键值串快捷填充：如 WiFi 类型粘 `SSID=我家WiFi，密码=12345678，加密=WPA，隐藏=是`、名片粘
  `姓名=张三，公司=XX，手机=138...`，字段别名宽容（中英文键名、全半角分隔）；
  ② 标准内容串解码：粘贴 WIFI:/BEGIN:VCARD/BEGIN:VCALENDAR/mailto:/geo:/tel:/SMSTO:/网址 自动识别类型
  并反解析填字段（WIFI 转义还原、VCARD 行解析、DTSTART→本地时间、mailto 百分号解码），即"内容串→人类可读"
  的解码能力。v1.6.2
- 踩坑：① 解析框最初用 input[type=text]——浏览器规范会剥掉粘贴内容里的换行，多行名片/日程串必碎，
  改单行样式 textarea；② 本地测试端口被多个历史 http.server 进程同绑（Windows SO_REUSEADDR），请求随机
  路由到不同目录的旧文件，症状"改了不生效"极具迷惑性——换新端口即刻全绿；③ heredoc 传 python 修 JS 正则
  时反斜杠被吃（\ → \.），正则类修改必须走 Edit 工具。
- 回归：WIFI 标准串（pass\;123→pass;123）、vCard 多行、VCALENDAR（DTSTART→datetime-local）、
  mailto/geo/tel/SMSTO/url、名片/WiFi/日程中文 KV 全部通过。

### 2026-10-15（十）：修下拉弹层被裁切且滚不动（用户反馈「列表内容超出去了还不能滚动，必须修复」）
- **根因**：弹层 absolute 定位挂在 .dd 内，向上被带 overflow 的祖先（右栏 overflow:hidden / 左栏 overflow-y:auto）
  裁切——贴近视口底部的下拉（如条码格式 20 项）下半被截断，滚轮事件落不到弹层上=「超出去还滚不动」。
- **修复**：弹层打开时 JS 按按钮 getBoundingClientRect 动态 **fixed 定位**（彻底脱离任何 overflow 祖先），
  宽=按钮宽、maxHeight=视口剩余高度（最小 160）、页面滚动/缩放即自动收起。qr v1.6.3 / mock-pro v1.0.4 同步。
- **原单文件页**（mock-data-generator.html）：用系统原生 select 弹层（无自绘组件），不受此 bug 影响；
  省市区可搜下拉本就在可滚容器内展开正常，无需处理。
- 回归：条码格式 20 项弹层 fixed + 330px 自适应 + 底边视口内 + 可滚；mock 国家 13 项正常。

### 2026-10-15（十一）：顶栏左上角图标与 favicon 统一（用户令「用和页签 favicon 一样的图」）
- qr-toolbox：brand-mark 渐变方块 → 网址二维码图（icons/icon128.png?v=2，与 favicon 同一引用）；扩展
  弹窗 popup 左上角同步。v1.6.4
- mock-data-pro：顶栏 dot 渐变 → 身份证.svg（assets/id-card.svg?v=2，与 favicon 同一引用）。v1.0.5

### 2026-10-15（十二）：真修「列表滚动失效」（用户反馈「根本没改！」）
- 上一轮只修了下拉弹层（fixed 定位），**列表本身**是另一个 bug：mock-pro 的结果表格收在
  `#resultArea`（renderTable 注入 .table-wrap 的匿名容器）里，该层无任何 flex 约束 → 被内容撑到视口外
  （904px），body overflow:hidden 锁死页面滚动 → 表格底部裁掉且无处可滚。flex 约束在匿名层断裂。
- 修复：`#resultArea { flex:1 1 0; min-height:0; display:flex; flex-direction:column }` 传导约束，
  .table-wrap 恢复 flex 填充。pro v1.0.9。qr-toolbox 结构不同（logoGrid 是 card 直接子级）已验证无此问题；
  原单文件页 body 可滚不锁死，无此问题。
- **排查大坑（本轮三次"改了没生效"的真凶）**：Windows 下多个 `python -m http.server` 可同绑 8126 端口
  （SO_REUSEADDR），请求随机路由到不同目录的旧文件。已用 Get-CimInstance 按 CommandLine 匹配 http.server
  全部清杀（_kill-httpserver.ps1），后续本地测试固定用 8128 端口。
- 回归：30 行表格收在卡片内（678px）滚动正常、表头 sticky、底部圆角完整。

### 2026-10-15（十三）：列表内容全部展示（用户令「所有内容都展示出来尤其地址」+「不要换行」）
- 上一版尝试的「长内容换行」被否（用户令不要换行）→ 终版：**所有列单行完整展示**——去掉 nowrap+ellipsis+
  max-width 截断，列随内容自然撑宽（table min-width:max-content），表格超宽时 .table-wrap 横向滚动查看，
  地址/单位名/邮箱等长内容一字不落。v1.1.1
- 回归：30 行地址零截断（scrollWidth==clientWidth）、单行 nowrap、横向滚动可达地址列。

### 2026-10-15（十四）：新增「小程序」内容类型——扫码跳转小程序（用户问「扫码跳到指定小程序怎么做，能不能集成」）
- **结论**：圆形小程序码（葵花码）必须微信服务端 API（AppID+secret 换 access_token 调 wxacode.*），
  纯网页无法生成；**「扫普通链接二维码打开小程序」纯前端可行**，已集成为第 11 个内容类型「小程序」：
  填入在 mp.weixin.qq.com → 设置 → 扫普通链接二维码打开小程序 配置好的「URL 前缀」匹配链接即可出码
  （配置指引写进类型提示），并支持解析框快捷粘贴链接。URL Link/Scheme 串（需服务端 API 生成）粘「文本」
  类型同样能出码。v1.7.0
- 回归：类型切换、链接出码 jsQR 回读、提示文案。
- 可选后续：若提供小程序 AppID/secret，可加受口令保护的 CF Worker 接口生成真·小程序码图（涉及密钥，等用户拍板）。

### 2026-10-15（十五）：自绘日历/日期时间弹层替换原生控件（用户反馈「日历弹框太丑」）
- 新组件 js/calendar.js（qr 与 pro 各一份副本，单体页内联注入）：点日期输入框/日历图标弹出自绘月视图
  （周一为首、非当月置灰、今天描边、选中填充主色），上/下月翻页，日期时间类型附时/分下拉；
  底部「清除 / 此刻」；fixed 定位（空间不足自动翻向上方）不受容器裁切；Esc/外点/页面滚动自动收起；
  写值后派发 input+change（兼容既有「选生日清空年龄」逻辑）；触屏 pointer:coarse 保留原生日期选择器。
- 原生日历弹层是浏览器控件无法用 CSS 定制，故整组件替换；隐藏原生指示图标、加自绘日历小图标。
- 接入：qr-toolbox 日程的开始/结束时间（动态表单 renderForm 后重扫，v1.7.1）；mock-data-pro 出生日期
  （v1.1.2）；原单文件 mock-data-generator.html（CSS+JS 内联注入）。
- 回归：三处弹层打开/选日/写值/时间组合（14:30→2026-10-22T14:30）/清除此刻全通过。

### 2026-10-15（十六）：日期输入框套全站样式（用户反馈「这个框还是很丑」）
- 根因：qr-toolbox 输入框样式选择器只列了 text/number/search，**漏了 date/datetime-local**——日程的
  开始/结束时间一直渲染成原生白框、原生图标挤在框外。基础/focus/H5 三处选择器补齐，日期框与相邻输入框
  完全一致（自绘日历图标收进框内右缘）。v1.7.2
- 附带修正：style.css 的 ?v= 版本参数在前两轮（日历/小程序）都没跟着 bump（一直挂在 1.7.0），浏览器吃旧
  缓存 CSS——已统一到 1.7.2。**规矩重申：改任何 css/js，index.html 里对应 ?v= 必须同步 bump**。

### 2026-10-15（十七）：解析框默认加高（用户反馈「文本域需要默认加高点」）
- 快捷解析框 min-height 30→54px（约两行，提示文案不再截断），仍可拖拽续伸，上限 110px 不变。v1.7.3

### 2026-10-15（十八）：文本类型不再显示解析框（用户令「文本不需要解析」）
- 解析框仅在 WiFi/名片/日程/邮件/位置/电话/短信/小程序/网址 等结构化类型显示；文本与识图转码类型隐藏
  （文本直接填「文本内容」即可）。v1.7.4

### 2026-10-15（十九）：小程序码服务端生成上线（用户令「葵花码/URL Scheme/URL Link 加服务器功能，服务器用 NEC8，做成独立页面，美化要精细」）
- **服务端**（NEC8/VM103）：Node 零依赖服务 mpcode（docker 容器，127.0.0.1:8795，源码=qr-toolbox/mp-server/server.js，
  服务器侧 ~/mpcode/），access_token 内存缓存（提前 5 分钟刷新），口令鉴权（X-Key，密钥档案=keys/mpcode-vault.md）。
  接口：/api/wxacode（getwxacodeunlimit 葵花码）、/api/scheme、/api/urllink。经 cloudflared 新增 ingress 暴露
  **https://mp.1996818.xyz**（config.yml.bak-mpcode-20261015 可回滚；CNAME→隧道，proxied）。
- **前端独立页** mp.html（主页顶栏「小程序生成」入口路由跳转）：三模式——小程序码（scene/page/版本/尺寸/自动配色/
  线条色/透明底）；URL Scheme；URL Link（path/query/版本/有效期→生成链接→本地出码）。
- **美化**：葵花码=canvas 海报合成（背景色/双色渐变/背景图上传、码托盘圆形/圆角方/无+大小、阴影、码大小、
  主副标题+字号+颜色、海报尺寸三档）；链接码=qr-code-styling 全样式（5 种码点、定位角、纯色/渐变、背景色、
  微信图标 logo/上传、大小与留白）。
- **待用户**：在 NEC8 ~/mpcode/config.json 填入小程序 AppID/secret（600 权限）后 `docker restart mpcode` 即全通；
  已验证：health/鉴权 401/真口令正确报「未配置 AppID」。前端交互（模式切换/美化面板/错误通路）全通过。

### 2026-10-15（二十）：小程序入口并入模式切换 + 修点击方块高亮（用户反馈两项）
- 主页顶栏「小程序生成」独立胶囊按钮移除，改为模式切换组第三个按钮「小程序」（二维码/条形码/小程序并排），
  点击路由跳转 mp.html 独立工作台
- 修点击瞬间方块背景：全站 button 加 -webkit-tap-highlight-color:transparent（触控高亮是系统方块）；
  模式切换/类型标签/按钮焦点态 outline 置空，键盘 :focus-visible 才描边（圆角跟随）。qr/pro/mp 页同步。
- 版本参数统一 v1.8.1（发现 style.css 等仍挂 1.7.0 旧参数——历史几轮只 bump 了部分引用，本轮全部归一）

### 2026-10-15（廿一）：工作台布局重排 + 修预览画布过早显示（用户反馈「参数放左侧 预览右上」）
- mp.html 右栏重排：**预览卡在顶部、美化卡在下**（此前预览被挤到右下角）；布局加宽（1440px 上限，
  参数列左、预览/美化列右），宽屏不再两边大片留白。
- **修真 bug**：葵花码画布在未生成时就显示（960×1200 空白 canvas 把占位文字挤成竖排、卡片撑到 848px 高）
  ——setMode/renderPoster 显隐逻辑改为「有图才显示画布，无图显示占位」。
- 回归：空态占位水平居中（卡片 300px）；模拟注入码图后海报合成正确（背景+圆形托盘+阴影+码）。
- 坑：用正则挪卡片把 mp.html 挪坏（美化卡丢失+占位符泄漏），git checkout 恢复后改用 Edit 精确移动。
  mp.html v1.0.2 / mp.js v1.0.1
