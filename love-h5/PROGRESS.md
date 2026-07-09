# love-h5 实施进度 · 给「换电脑继续」用

> **接手 Claude 必读**：这份文件是 === 唯一上下文 ===。读完就知道做到了哪、bug 是什么、下一步该干嘛。全程中文。换电脑：
> 1. `git clone` 本仓库到新电脑；
> 2. 打开本文件看「当前进度」；
> 3. 本地预览 `python -m http.server 5517 --bind 127.0.0.1` → `http://127.0.0.1:5517/love-h5/`。
> 4. 接上我的 Todo 继续干。

---

## 项目一句话
挂在 GitHub Pages 的情侣 H5（纯静态、无自建服务器）：实时对话、猫猫吃鱼双人联机（对战/合作/回合三模式）、每日心情+悄悄话、在一起天数+纪念日、共同心愿清单、真心话盲盒、接入 heart-3d、3 套马卡龙主题切换。

## 技术栈（最终选型）
纯静态 H5（原生 JS + ES Modules，**零构建**）+ **Supabase / MemFire**（云端实时，国内可用）+ Canvas2D（游戏）。部署 GitHub Pages。
> 后端演进：Firebase（被墙放弃）→ LeanCloud（计划）→ **Supabase 最终落地**（supabase-config.js + store.js 已实现）。
> MemFire 是 Supabase 国产兼容替代，API 一致，代码不变。

## 关键架构决策（ADR）—— 最新版

### ADR-1：静态托管，无自建服务器

### ADR-2：实时后端 = Supabase / MemFire ✅
- 国内可访问（jsDelivr CDN 提供 SDK，MemFire 国内服务器）。
- **本地预览模式**（localStorage + BroadcastChannel，同浏览器多 tab）作为零配置降级，未配后端自动降级。
- `js/config/supabase-config.js` 已写（占位 + isConfigured 检测）。

### ADR-3：store.js 数据抽象层 ✅
统一 API（onValue/onList/set/update/push/remove/transaction/onDisconnect*），两端实现：
- **云端模式**（Supabase）：Postgres + Realtime 订阅（channel.on('postgres_changes')），一张通用 `kv` 表 { room, path, value(jsonb), ts }，复合唯一键 (room, path)。原子操作用 Postgres 自定义函数 push_kv / merge_kv（见 SETUP.md）。
- **本地模式**：内存树 + localStorage + BroadcastChannel + storage 事件兜底。
调用方不感知后端。

### ADR-4：房间号机制 ✅
`lh5_room` / `lh5_role` 存 localStorage。进入后写 `members/{role}`（online + heartbeat + onDisconnect 清理）。

### ADR-5：主题 ✅
3 套马卡龙（sakura / mint / lavender）via `[data-theme]` + CSS 变量。全局浮动切换器，防 FOUC。游戏 Canvas 取色从 CSS 变量。

---

## 实际进度（8 阶段）

- [x] **阶段 0 · 资产**：boy.jpg / girl.jpg / tomcat.jpg → `assets/images/`；heart-3d.html 副本已加 postMessage 主题桥接。
- [x] **阶段 1 · 骨架(CSS/工具)**：css/theme.css(3套) / css/base.css / css/pages.css / js/core/utils.js 完成。
- [x] **阶段 2 · 数据层**：store.js 本地+Supabase 双实现 ✅；room.js（房间/身份/心跳/onDisconnect）✅；supabase-config.js ✅。
- [x] **阶段 1 续 · 骨架(HTML/路由/主题)**：index.html(SPA+引导) ✅；router.js(hash 路由+iframe) ✅；theme.js(切换+postMessage) ✅；app.js(入口编排) ✅。
- [x] **阶段 3 · 功能页**：home / chat / mood / days / wishlist / truthbox 全部 6 页 ✅。本地预览跨 tab 可模拟双人。
- [~] **阶段 4 · 猫猫吃鱼**：catfish.html + css/catfish.css + game/catfish/{main,engine,sync,input,modes}.js 全部 7 个文件已写（~850 行）。**有 bug，联机没跑通，见下方 bug 清单**。
- [ ] **阶段 5 · heart 接入**：heart.html 容器页待写（router 已预留 `./heart.html`，heart-3d 副本已就绪）。
- [ ] **阶段 6 · 主题贯通**：游戏 Canvas 取色已做（engine.js snapTheme），heart iframe 主题桥接 postMessage 已有，**heart.html 写完即贯通**。
- [ ] **阶段 7 · 文档**：SETUP.md(Supabase 配置 + SQL 建表 + 安全规则)、README.md(预览/部署) 待写。
- [ ] **阶段 8 · 验证**：本地服务 + chrome-devtools 截图 + 移动端真机回归。

---

## 已建文件清单（28 个文件，约 3075 行源码）

```
love-h5/
├── index.html                  ✅ SPA:引导+6个<section>+主题fab+iframeHost
├── catfish.html                ⚠️  游戏宿主页(Canvas+HUD+选模式/结算弹窗)
├── heart-3d.html               ✅ 副本(648行,已加postMessage主题桥接)
│
├── assets/images/              ✅ boy.jpg girl.jpg tomcat.jpg
│
├── css/
│   ├── theme.css               ✅ 3套马卡龙([data-theme])+CSS变量
│   ├── base.css                ✅ reset+移动端+组件(按钮/输入/卡片/toast)
│   ├── pages.css               ✅ 6个view+引导页+导航网格+iframeHost
│   └── catfish.css             ✅ 游戏HUD/模态/Toast/主题浮层
│
├── js/
│   ├── app.js                  ✅ 入口编排:init/定义view/引导/监听cf-go-home
│   ├── config/
│   │   └── supabase-config.js  ✅ Supabase/MemFire配置占位+isConfigured
│   ├── core/
│   │   ├── store.js            ✅ ★ 双实现数据层(Supabase+本地),所有功能依赖
│   │   ├── room.js             ✅ 房间号+身份+心跳12s+onDisconnect+在线判断
│   │   ├── router.js           ✅ hash路由(#/chat...),轻量view+重页iframe
│   │   ├── theme.js            ✅ 主题切换+postMessage给heart+CSS变量取色
│   │   └── utils.js            ✅ 时间/id/节流/escape/today/题库/mood列表/toast
│   ├── views/
│   │   ├── home.js             ✅ 问候+对方在线+7卡片导航(grid)
│   │   ├── chat.js             ✅ 实时对话(头像+气泡+Enter发送)
│   │   ├── mood.js             ✅ 今日心情(emoji网格+悄悄话+对方区)
│   │   ├── days.js             ✅ 在一起天数+纪念日倒计时+添加
│   │   ├── wishlist.js         ✅ 心愿清单(添加/勾完成/删除)
│   │   └── truthbox.js         ✅ 真心话盲盒(抽题/我答/看ta答)
│   └── game/catfish/
│       ├── main.js             ⚠️  编排:选模式→双方ready→开局→结算→再来
│       ├── engine.js           ⚠️  Canvas2D渲染+主循环+碰撞+状态机+主题取色
│       ├── sync.js             ⚠️  联机协议(位置广播12fps/claim鱼/setStatus)
│       ├── input.js            ✅ 整画布虚拟摇杆(触摸+鼠标)
│       └── modes.js            ✅ 三模式规则:versus/coop/turn(纯函数)
│
├── PROGRESS.md                 ← 你正在看的这份
└── 待建: heart.html README.md SETUP.md
```

---

## 🐛 已知 Bug / 待办（按优先级）

### B1 · 游戏联机未跑通（gameId = null 根因） ⚠️⚠️
**现象**：sync.js 模块级 `gameId` 变量在 evaluate_script import 时返回 null。localStorage 里实际数据路径是 `games/catfish/null/players/girl`（gameId 为 null 而非 uid）。导致所有联机读写（broadcastPos / claimFish / joinGame）路径错误，双方无法同步。

**根因分析**（排查中）：
1. main.js `boot() → startFlow() → ensureGame()` 调用 sync.js 的 ensureGame，后者内部 `readLatest()` 用 `Store.onValue` 读取 `games/catfish/latest`。
2.首次进入时 latest 不存在，应进入分支 `gameId = uid('g')` 并写 latest。但 localStorage 里 latest = `{}`（空对象），说明 `Store.set` 写入了空 latest 而非含 id 的 latest。
3. 可能原因：`ensureGame` 内的 `readLatest` 返回 `undefined` → 条件 `cur && cur.id` 为 false → 走 else → `gameId = uid('g')` → `Store.set(...)` → **但 Store.set 本地模式 directly sets the value**。如果 set 的事务（upsert）还没写进去就返回，或异步时序问题，导致实际写的 latest 为空对象。
4. `ensureGame` 前面有 `await Store.update('games/catfish/latest', {})`，这句把 latest 写成空对象！覆盖了后面的 set！

**修复方向**：sync.js `ensureGame` 删掉那条 `Store.update(latest, {})`，直接用 `readLatest` → 判断有无 id → 建或加入。`readLatest` 的 Promise 模式也需要重新评估（`Store.onValue` 回调同步触发一次再被 unsubscribe 关掉）。

### B2 · 男女头像位置交换（用户要求）
用户说：**女生头像放 HUD 左边，男生放右边**，让布局呈 ♥ 爱心形状。
**位置**：`catfish.html` 的 `.cf-players` 里两个 `.cf-p` 元素的顺序 + `catfish.css` 的 `#cfGirl` 样式。
**修复**：HTML 里 boy 放右边、CSS 调方向。简单。

### B3 · heart.html 容器页待建
router.js 已引用 `./heart.html`，heart-3d.html 副本已有主题桥接。只需建 heart.html：顶部 44px 返回+主题浮层，下方 `<iframe src="./heart-3d.html">` 全屏。几十行。

### B4 · SETUP.md + README.md 待写
SETUP.md 需写：Supabase/MemFire 注册 → 建项目 → 建 kv 表（DDL: room/path/value/ts + 唯一约束）+ 安全规则 + 原子函数 push_kv/merge_kv 的 SQL + 填 supabase-config.js。
README.md：本地预览步骤 + 双人模拟 + 部署 GitHub Pages + 目录说明。

### B5 · 回合模式 turn switching 未联调
回合制在 engine.js 帧循环里判断 turn 切换 + bumpTurnSwitches，sync.js 有 setTurn / bumpTurnSwitches。但联机验证未做——这是 B1 修复后的后续。

### B6 · 女生头像 + iframe 加载失败 404
router.js 定义的 `heart` view 引用 `./heart.html`（404）、`catfish` 引用 `./catfish.html`（已建，正常）。heart.html 不存在所以 heart 路由会 404。

---

## 下一步（给接手 Claude）

### 优先顺序

1. **立即修复 B1**（gameId bug）：编辑 `sync.js` → 删掉 `ensureGame` 函数的 `Store.update(latest, {})` 那行 → 保证首次进入 gameId 正确生成 uid → 本地模式两 tab 验证双方就绪→开局→吃鱼→结算。
   - 关键文件：`love-h5/js/game/catfish/sync.js`
   - 验证：开两个 tab（同一浏览器，同房间不同身份），选同模式，看 modal 消失、canvas 两只猫在动。

2. **修 B2**（男女头像位置）：`catfish.html` + `catfish.css` 调换顺序。

3. **建 heart.html**（阶段 5）：~30 行，router 已有定义。

4. **写 SETUP.md + README.md**（阶段 7）。

5. **验证**（阶段 8）：chrome-devtools 截图全流程。

### 本地预览命令
```bash
cd love-h5
python -m http.server 5517 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:5517/
# 输房间号 → 选身份 → 进入首页
# 双人模拟：同浏览器开第二个标签页（无痕/隐身），输同一房间号、选对方身份
```

### chrome-devtools MCP 可用
用 `new_page` 打开 `http://127.0.0.1:5517/`，`take_screenshot` / `evaluate_script` 交互验证。

---

## 给接手 Claude 的提示
- 全程中文（用户、代码注释、文档）。
- store.js 是核心抽象，不要改它的对外 API。本地模式已稳定。
- 游戏联机位置广播节流 ~12fps（throttle 80ms），不要去掉。
- 后端选型是 Supabase（不是 LeanCloud 不是 Firebase），supabase-config.js 已建，store.js 云端实现已完成。
- 每个阶段做完更新本 PROGRESS.md。
- PLAN 原始文档在 `C:\Users\Orange\.claude\plans\cached-humming-gizmo.md`（记录了初始设计，实际实现有演进）。

---

> 最后更新：2026-07-09 · 阶段 4 游戏代码已写完，B1 待修 · 换电脑可无缝继续