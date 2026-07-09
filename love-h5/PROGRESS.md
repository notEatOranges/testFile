# love-h5 实施进度 · 给「换电脑继续」用

> **接手 Claude 必读**：这份文件是 === 唯一上下文 ===。全程中文。换电脑：
> 1. `git clone` 本仓库；`cd love-h5`。
> 2. 本地预览：`python -m http.server 5517 --bind 127.0.0.1`（Windows 上 python 多是商店占位，用 `npx http-server -p 5517 -a 127.0.0.1 .`）→ `http://127.0.0.1:5517/`。
> 3. Supabase 已配置（见 `js/config/supabase-config.js`，url+anonKey 真实值）。**必须先在 Supabase SQL Editor 跑过 `alter table kv replica identity full;`**，否则对方收不到实时消息/同步。
> 4. 看下面「当前进度」「已知问题」「下一步」继续干。

---

## 项目一句话
挂在 GitHub Pages 的情侣 H5（纯静态、零构建、Supabase/MemFire 实时）：实时对话、在一起天数+纪念日、心愿清单、今日心情、真心话盲盒、3D 爱心、**游戏大厅 9 个游戏**、8 套马卡龙主题。

## 技术栈
纯静态 H5（原生 JS + ES Modules，零构建）+ Supabase（Postgres+Realtime，kv 表 + merge_kv/push_kv 原子函数）+ Canvas2D（游戏）。部署 GitHub Pages。`js/core/store.js` 是数据抽象层（Supabase / 本地双实现），写入后 `sbEmit` 主动刷新本端。

---

## 当前进度（基本全做完）

### 基础 / 全局
- [x] **房间号 + PIN 门禁**：进房间需房间号 + PIN + 身份。首次进入设 PIN（哈希存 `pin`），之后凭 PIN。`room.verifyOrSetPin`。
- [x] **会话/登录系统（已重做，修设备切换卡死）**：见下方「登录模型」。每个角色同时只一人；对方 >16s 未心跳或已退出 → 新设备可**顶替**。
- [x] **历史房间记录**（`lh5_room_history`，长久保存，引导页可点重进）。
- [x] **退出房间按钮**（顶栏右上角，仅首页；自定义弹框二次确认）。
- [x] **8 套马卡龙主题**（sakura/mint/lavender/peach/babyblue/lemon/berry/cocoa），顶栏右上角切换，3 个 HTML 同步。
- [x] **logo**：彩色 SVG「粉底圆角徽章+白心+两小心」（app 图标风），替代 emoji。
- [x] **刷新启动 loading（splash）**：盖住登录页闪烁，boot 完成淡出。
- [x] **进入页面 loading**：store 跟踪订阅读取，有未完成读取时盖内容区显示 💑 loading。
- [x] **自定义弹框组件** `js/core/modal.js`（showConfirm，替代原生 confirm）。
- [x] **全局 loading/防抖**：`withLoading`（按钮异步期间禁用+转圈=点击节流）覆盖所有写按钮；`debounce`/`throttle` 工具齐全。
- [x] **即时刷新**：store 写入后 `sbEmit` 主动重拉+通知本端（所有页面增删改立即刷新，不依赖 realtime）。
- [x] **Remixicon 网络图标**（CDN），按钮图标居中。

### 6 个功能页
- [x] 悄悄对话：**微信风**（表情面板 144 emoji、时间分隔、纯 emoji 大字、气泡尾巴、乐观回显 ⏳ push 成功即清）。
- [x] 在一起：天数 + 纪念日倒计时 + 添加 + **删除（二次确认）**。
- [x] 心愿清单：紧凑卡片 + 底部固定输入栏（贴满宽度）+ 完成/删除二次确认 + loading。
- [x] 今日心情 / 真心话盲盒（均 loading + 即时刷新）。
- [x] 3D 爱心（heart.html 容器 + heart-3d iframe + 两层主题桥接）。
- [x] 全站头像用照片（boy.jpg/girl.jpg），canvas 猫脸保留。

### 游戏大厅 + 9 个游戏（首页「游戏大厅」入口）
错位宫格布局。游戏内返回/退出 → **回大厅**（cf-go-home → lobby）。结束弹窗有「再来 + 退出游戏」。
- 🐟 猫猫吃鱼（双人联机，三模式）—— 最早做的，已跑通。
- 🐍 **贪吃蛇**：**掌机外壳（BRICK 风）** + 单人/双人联机模式 + 方向键 + 光泽豆子/渐变蛇身。**画布正方形填满 bezel**（resize 用 CSS width:100%+aspect-ratio:1，CELL=W/20 分数，碰撞边=屏幕边）。
- 🧱 **俄罗斯方块**：**掌机外壳** + 十字键(◀▶▲▼软降) + 中间长条(暂停/重来) + 右侧大旋转⟳ + 硬降⤓。
- 🐱 围住神经猫（六边形 + 猫 BFS 逃离，单人）。
- 🃏 记忆配对（16 牌翻牌，计步计时）。
- 💬 默契问答（6 题各答，比对默契分%）。
- 🚀 飞行器（拖动飞船自动射击）。
- 🎵 心动节拍（落 ❤️ 节奏点击）。
- 🎨 你画我猜（画板：颜色/粗细/橡皮/清空；**联机互猜未做**）。

---

## 登录 / 会话模型（重要，已重做）
- **登录态** = localStorage `lh5_room`+`lh5_role`。boot 时 isSetup 则自动重进。
- **在线/占用** = 云端 `members/{role}` 心跳（12s 写 lastSeen）。
- **进入 `room.enter`**：只阻挡「**正活跃的别人**」——即 `online!==false && sid不同 && age<16s`。否则（对方已退出 online=false / >16s 未心跳 / 是自己 sid）→ **可顶替进入**。
- **设备切换**：电脑点退出(online=false)→手机**立即**进；电脑直接关页面→最多等 ~16s 手机可顶替（修了原来卡死/提示"已有人用"的问题）。
- **断线清理**：`onDisconnectSet` 写整个 presence 对象为 offline（修了 Supabase 模式下写子路径不生效的 bug）。
- 关键文件：`js/core/room.js`（enter/leave/verifyOrSetPin/isOnline/历史）、`js/app.js`（doEnter/exitRoom/boot）、`js/core/store.js`（getOnce/sbEmit/onLoadingChange）。

---

## ⚠️ 已知问题 / 待办（明天优先看）

1. **按键间距（贪吃蛇 + 俄罗斯方块）**：方向键/功能键太靠近机身两边，需调 `.controls` 的 padding/gap。（用户反馈，未改）
2. **贪吃蛇速度**：用户嫌快，当前 `s_step=190`（sReset 里），可再调慢（如 230）。双人 `m_step=200`。
3. **贪吃蛇双人联机未真机实测**：单浏览器因身份共享(lh5_role)不好测；逻辑按猫猫吃鱼那套写，需两台设备同房间验证。
4. **俄罗斯方块**：用户说"不需要单独软降，有下按钮"——现状 ▼(dpad)=软降、⤓=硬降，已符合，无需改。
5. **REPLICA IDENTITY**：Supabase 必须跑 `alter table kv replica identity full;`（否则 realtime update/delete 不通，对方收不到消息/同步）。本地自己操作不受影响（sbEmit）。
6. **其他游戏联机**：目前仅猫猫吃鱼 + 贪吃蛇有联机；记忆配对/围猫/你画我猜等可按需加（走 store 同步）。
7. **你画我猜**目前是单人画板，联机互猜未做。

---

## 下一步（建议顺序）
1. 调贪吃蛇/俄罗斯方块按键间距 + 贪吃蛇再放慢（快）。
2. 真机两台实测贪吃蛇联机 + 设备切换登录。
3. 给记忆配对加联机（回合制共享棋盘，较简单）。
4. 确认 Supabase 跑了 REPLICA IDENTITY。
5. 部署 GitHub Pages（见 README.md）。

---

## 文件结构（主要）
```
love-h5/
├── index.html              SPA：splash+viewLoading+引导(房间+PIN+角色)+6 view+游戏大厅+主题
├── catfish.html / snake.html / tetris.html / trapcat.html / memory.html / quiz.html / flyer.html / synctap.html / draw.html   9 个游戏（自包含，掌机外壳）
├── heart.html / heart-3d.html   3D 爱心容器 + 内层
├── css/ theme.css(8套) base.css pages.css catfish.css
├── js/
│   ├── app.js              入口编排（doEnter/exitRoom/boot/历史/lobby 路由）
│   ├── core/ store.js(★数据层+sbEmit+loading) room.js(★登录重做) router.js theme.js utils.js(withLoading/debounce/throttle) modal.js(showConfirm)
│   ├── views/ home chat mood days wishlist truthbox lobby
│   └── game/catfish/ main engine sync input modes
├── README.md / SETUP.md / PROGRESS.md（本文件）
```

---

> 最后更新：2026-07-10 · 9 游戏+掌机外壳+登录重做+8主题+微信风聊天 全做完；待办见上 · 换电脑可无缝继续
