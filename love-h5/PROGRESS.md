# love-h5 实施进度 · 给「换电脑继续」用

> **接手 Claude 必读**：这份文件是 === 唯一上下文 ===。读完就知道做到了哪、bug 是什么、下一步该干嘛。全程中文。换电脑：
> 1. `git clone` 本仓库到新电脑；
> 2. 打开本文件看「当前进度」；
> 3. 本地预览：`cd love-h5 && python -m http.server 5517 --bind 127.0.0.1`（Windows 上 python 是商店占位就用 `npx http-server -p 5517 -a 127.0.0.1 .`）→ 浏览器开 `http://127.0.0.1:5517/`。双人模拟：**同浏览器**再开一个**普通**标签页（不是无痕），同一房间号、选对方身份。
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
- [x] **阶段 4 · 猫猫吃鱼**：catfish.html + css/catfish.css + game/catfish/{main,engine,sync,input,modes}.js 全部 7 个文件（~860 行）。**联机已跑通**（2 tab 实测：加入同局→选同模式→开局→45s 倒计时→吃鱼同步→结算正确），见下方 bug 清单的 B1/B7 修复记录。
- [x] **阶段 5 · heart 接入**：heart.html 容器页已建（顶栏返回+主题浮层 + 全屏 heart-3d iframe + 两层 postMessage 主题中继）。实测：router 加载 heart.html（data-heart=1）→ 内层 heart-3d.html iframe → 500×844 canvas 正常渲染。
- [x] **阶段 6 · 主题贯通**：游戏 Canvas 取色（engine.js snapTheme）+ heart 两层 iframe 主题桥接均已就位。
- [x] **阶段 7 · 文档**：SETUP.md（Supabase/MemFire 配置 + kv 建表 DDL + RLS + merge_kv/push_kv 原子函数 SQL）、README.md（预览/双人模拟/部署/目录）已写。
- [~] **阶段 8 · 验证**：本地服务 + chrome-devtools 双 tab 实测游戏全流程 ✅、heart 加载 ✅。**移动端真机回归未做**（需真机）。

---

## 已建文件清单（31 个文件，约 3200 行源码）

```
love-h5/
├── index.html                  ✅ SPA:引导+6个<section>+主题fab+iframeHost
├── catfish.html                ✅ 游戏宿主页(Canvas+HUD+选模式/结算弹窗)
├── heart.html                  ✅ 3D爱心容器(顶栏+全屏heart-3d iframe+两层主题中继)
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
│       ├── main.js             ✅ 编排:选模式→双方ready→开局→结算→再来
│       ├── engine.js           ✅ Canvas2D渲染+主循环+碰撞+状态机+主题取色
│       ├── sync.js             ✅ 联机协议(位置广播12fps/claim鱼/setStatus)
│       ├── input.js            ✅ 整画布虚拟摇杆(触摸+鼠标)
│       └── modes.js            ✅ 三模式规则:versus/coop/turn(纯函数)
│
├── README.md                   ✅ 预览/双人模拟/部署/目录说明
├── SETUP.md                    ✅ Supabase/MemFire配置+建表DDL+RLS+原子函数SQL
└── PROGRESS.md                 ← 你正在看的这份
```

---

## 🐛 已知 Bug / 待办（按优先级）

### B1 · 游戏联机未跑通（gameId = null） ✅ 已修复（2026-07-09）

**现象**：sync.js 模块级 `gameId` 为 null，localStorage 里出现 `games/catfish/null/...` 路径，双方无法同步。

**真正根因**（之前误诊为 `ensureGame` 里那行 `Store.update(latest,{})`，那行确实该删、也已删，但**不是**主因）：`readLatest()` 里
```js
const off = Store.onValue(path, v => { off(); resolve(v); });
```
本地模式 `onValue` 会**同步**立即回调，此刻 `const off =` 赋值尚未完成（TDZ），cb 里引用 `off` 抛 `ReferenceError: Cannot access 'off' before initialization` → Promise reject → `ensureGame()` 抛错 → `gameId` 永远 null → 后续全路径变成 `games/catfish/null/...`。

**修复**（`sync.js` 的 `readLatest`）：把解订阅 + resolve 推迟到微任务，此时 `off` 已赋值：
```js
function readLatest() {
  return new Promise(resolve => {
    const off = Store.onValue(`${GROOT}/latest`, v => {
      queueMicrotask(() => { try { off(); } catch {} resolve(v); });
    });
  });
}
```

**实测验证（chrome-devtools 双 tab，本地模式）**：boy 建局 `g_xxx` → girl 读 latest 加入**同一局** → 双方选对战 → modal 消失、两只猫渲染、分数实时同步累加 → 45s 倒计时正确（实测 elapsed ≈ 真实时间，非倍速）→ 结算弹窗「女生赢 / 男生 8 · 女生 24」正确。✅

> 旧版 PROGRESS 说的「`Store.update(latest,{})` 覆盖」那行也已删除（它确实是多余且有害的），但单删它不够——必须配合上面的 TDZ 修复联机才真正跑通。

### B2 · 男女头像位置 ✅ 已修复（2026-07-09）
女生放 HUD 左边、男生放右边，形成 ♥ 爱心形状。catfish.html DOM 顺序 + catfish.css 已调。

### B3 · heart.html 容器页 ✅ 已建（2026-07-09）
heart.html 已建：顶栏（返回 + 标题 + 主题浮层）+ 全屏 `<iframe src="./heart-3d.html">` + 两层 postMessage 主题中继（主站 theme.js → heart.html → heart-3d）。实测 router 加载 heart.html（`data-heart=1`）→ 内层 heart-3d.html iframe → 500×844 canvas 正常渲染。

### B4 · SETUP.md + README.md ✅ 已写（2026-07-09）
SETUP.md：Supabase/MemFire 注册 → 建项目 → kv 建表 DDL（room/path/value(jsonb)/ts + 唯一约束）→ RLS 策略 → `merge_kv`/`push_kv` 原子函数 SQL（security definer）→ 开 realtime → 填 supabase-config.js。
README.md：本地预览（python / node 两种）+ 双人模拟（**必须同浏览器两个普通 tab，不能普通+无痕**）+ 部署 GitHub Pages + 目录说明。

### B5 · 回合模式（turn）联机未验证 ⚠️
对战(versus)模式已双 tab 实测全流程通过。回合制在 engine.js 帧循环里判断 turn 切换 + `bumpTurnSwitches`，sync.js 有 `setTurn`/`bumpTurnSwitches`，但**联机未实测**。已知潜在问题：`setTurn` 里 `switchedAt` 用 `Store.now()`（Date.now），而 engine 内 `game.now` 是 rAF 时间戳，两者时基不同——回合超时判断 `(game.now - t.switchedAt)` 跨端可能不准。后续接手请实测 turn 模式并统一时基。

### B6 · heart 路由 404 ✅ 已修（2026-07-09）
heart.html 已建（见 B3），`#/heart` 不再 404。

### B7 · drawCat 空值崩溃（联机第二根因） ✅ 已修复（2026-07-09）
engine.js 渲染 `drawCat("girl", game.players.girl)`，但对方未加入时 `onPeer(null)` 会把 `players[peer]` 置 null → `p.x` 抛 `Cannot read properties of null` → rAF 主循环中断 → 即使开局画布也冻结。修复：渲染前判空，缺席的猫不画。与 B1 的 TDZ 并列，是「联机跑不通」的第二个根因。

### B8 · gameId 并发竞态（次要，未修） ⚠️ 低优先
两 tab **几乎同时** `ensureGame()` 时，可能都读到 `latest` 为空、各自生成不同 gameId → 永远同步不上。正常使用（一人先开、另一人后加入）不会触发。彻底修法：改用确定性 gameId（如固定 `"session"`，每房间一局），可去掉 latest 指针。当前未改，留作后续。

### B9 · 双人模拟的身份共享（设计限制，非 bug）
`lh5_role` 存 localStorage，同浏览器两 tab 共享 → 只能「先开男 tab、再开女 tab、中途不刷新」地模拟。且**普通 tab 与无痕 tab 不共享** localStorage/BroadcastChannel，模拟必须用两个普通 tab（或两个无痕）。真机异地无此问题（README 已说明）。

---

## 下一步（给接手 Claude）

主要功能已完成并实测。剩余收尾：

1. **回合模式 turn 联机实测 + 时基统一**（B5）：开两 tab 选「回合」，看轮流吃鱼、换人、6 回合结算是否正确；修 `switchedAt` 时基不一致。
2. **真机回归**（阶段 8）：配好 Supabase 后，两台真机异地实测实时对话 + 游戏 + 心情同步；移动端虚拟摇杆手感、刘海安全区。
3. **（可选）gameId 确定性化**（B8）：消除并发竞态。
4. **（可选）a11y**：游戏内 form 字段缺 label（控制台有 issue 提示），可补 `aria-label`。

### 本地预览命令
```bash
cd love-h5
python -m http.server 5517 --bind 127.0.0.1
# 或（Windows 上 python 是商店占位时）：npx http-server -p 5517 -a 127.0.0.1 .
# 浏览器打开 http://127.0.0.1:5517/
# 输房间号 → 选身份 → 进入首页
# 双人模拟：【同浏览器】再开一个普通标签页，同一房间号、选对方身份（先开男、再开女，勿中途刷新）
```

### chrome-devtools MCP 可用
用 `new_page` 打开 `http://127.0.0.1:5517/`，`take_screenshot` / `evaluate_script` 交互验证。注意两 tab 需在同一浏览器实例（共享 localStorage/BroadcastChannel）。

---

## 给接手 Claude 的提示
- 全程中文（用户、代码注释、文档）。
- store.js 是核心抽象，不要改它的对外 API。本地模式已稳定，云端模式按 SETUP.md 建好 `kv` 表 + `merge_kv`/`push_kv` 函数即可。
- 游戏联机位置广播节流 ~12fps（throttle 80ms），不要去掉。
- `readLatest()` 那种「`const off = onValue(cb); cb 里用 off`」的 TDZ 陷阱别再踩——同步回调里引用外层 `const` 必须延迟（queueMicrotask）。
- 两 tab 本地模拟：同浏览器、两个普通 tab、先男后女、勿刷新（见 B9）。
- 后端选型是 Supabase（不是 LeanCloud 不是 Firebase），supabase-config.js 已建，store.js 云端实现已完成。
- 每个阶段做完更新本 PROGRESS.md。
- PLAN 原始文档在 `C:\Users\Orange\.claude\plans\cached-humming-gizmo.md`（记录了初始设计，实际实现有演进）。

---

> 最后更新：2026-07-09 · 阶段 4 联机跑通(B1/B7 修复并实测)、阶段 5 heart.html 已建、阶段 7 文档已写 · 剩 B5 回合联调 + 真机回归 · 换电脑可无缝继续