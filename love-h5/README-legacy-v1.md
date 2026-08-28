# love-h5 · 我们的小窝 💑

挂在 GitHub Pages 的**情侣 H5**（纯静态、零构建、无自建服务器）：实时对话、猫猫吃鱼双人联机（对战/合作/回合三模式）、每日心情+悄悄话、在一起天数+纪念日、共同心愿清单、真心话盲盒、接入 3D 爱心、3 套马卡龙主题切换。

> 实时后端用 **Supabase / MemFire**（配置见 [SETUP.md](./SETUP.md)）；**不配置也能玩**——自动降级到本地预览模式（同浏览器多 tab 模拟双人）。

---

## 技术栈

- 纯静态 H5：**原生 JS + ES Modules，零构建**。
- 实时：**Supabase / MemFire**（Postgres + Realtime），数据抽象层 `js/core/store.js` 屏蔽后端细节。
- 本地降级：localStorage + BroadcastChannel + storage 事件兜底。
- 游戏：Canvas2D + requestAnimationFrame。
- 部署：GitHub Pages（任意静态托管都行）。

---

## 一、本地预览

整个站点是纯静态文件，起个静态服务即可（**不要直接双击 file:// 打开**——ES Module / iframe / Supabase 都需要 http(s)）。

任选一种起服务（根目录 = `love-h5/`）：

```bash
# 方式 A：Python（最常见）
python -m http.server 5517 --bind 127.0.0.1

# 方式 B：Node（无需装东西，npx 拉一次性工具）
npx http-server -p 5517 -a 127.0.0.1 .
#  或
npx serve -l 5517 .
```

> Windows 上若 `python` 是应用商店占位（报错），用方式 B 的 Node，或装真 Python。

浏览器打开 **http://127.0.0.1:5517/** → 输房间号 → 选男/女身份 → 进入。

---

## 二、双人模拟（本地预览模式下）

本地模式靠 **localStorage + BroadcastChannel** 在**同一个浏览器**的多个 tab 间同步。要点：

> ⚠️ **必须用「同一个浏览器的两个普通标签页」**（或两个无痕标签页）。
> **不要一个普通 + 一个无痕**——普通与无痕是不同存储分区，**不共享** localStorage / BroadcastChannel，同步会完全失效。

步骤：

1. **Tab A（男生）**：打开 `http://127.0.0.1:5517/`，房间号输 `love2026`，选**男生**，进入。
2. **Tab B（女生）**：同浏览器**新开一个普通标签页**，同样打开 `http://127.0.0.1:5517/`，房间号输**同一个** `love2026`，选**女生**，进入。
3. 两边互发消息、玩猫猫吃鱼（同选一个模式开局）、看对方实时同步。

> 说明：身份（`lh5_role`）存在 localStorage，两个 tab 共享。因此**先开男生 tab、再开女生 tab**；过程中**不要刷新**（刷新会重读身份）。这是「同浏览器模拟」的固有限制，**真机异地**时每台手机各自记住各自身份，无此问题。

配置云端后端（[SETUP.md](./SETUP.md)）即可两台真机异地实时，不再受此限制。

---

## 三、部署到 GitHub Pages

1. 把本仓库（含 `love-h5/` 目录）推到 GitHub。
2. 仓库 **Settings → Pages → Source** 选 `main` 分支、`/root`，保存。
3. 等约 1 分钟，访问 `https://<你的用户名>.github.io/<仓库名>/love-h5/`。

> 站点**全程用相对路径**（`./catfish.html`、`./js/...`），所以无论部署在根域名还是 `/love-h5/` 子路径下都能正常工作，无需改配置。
>
> 想要异地实时：部署前先按 [SETUP.md](./SETUP.md) 填好 `js/config/supabase-config.js` 再推。

---

## 四、目录说明

```
love-h5/
├── index.html              SPA 入口：引导（房间号+身份）+ 6 个功能 view + 主题切换 + iframe 宿主
├── catfish.html            猫猫吃鱼游戏宿主页（Canvas + HUD + 选模式/结算弹窗）
├── heart.html              3D 爱心容器页（顶栏 + 全屏 heart-3d iframe + 两层主题 postMessage 中继）
├── heart-3d.html           3D 爱心（WebGL，副本，已加 postMessage 主题桥接）
│
├── assets/images/          boy.jpg / girl.jpg / tomcat.jpg
│
├── css/
│   ├── theme.css           3 套马卡龙主题（[data-theme] + CSS 变量）
│   ├── base.css            reset + 移动端 + 通用组件（按钮/输入/卡片/toast）
│   ├── pages.css           6 个 view + 引导页 + 导航网格 + iframe 宿主
│   └── catfish.css         游戏 HUD / 模态 / Toast / 主题浮层
│
├── js/
│   ├── app.js              入口编排：init / 定义 view / 引导 / 监听 iframe 回首页
│   ├── config/supabase-config.js   后端配置占位 + isConfigured 检测
│   ├── core/
│   │   ├── store.js        ★ 数据抽象层（Supabase + 本地双实现，所有功能依赖）
│   │   ├── room.js         房间号 + 身份 + 心跳 12s + onDisconnect + 在线判断
│   │   ├── router.js       hash 路由（轻量 view + 重页 iframe）
│   │   ├── theme.js        主题切换 + postMessage 给 heart + CSS 变量取色
│   │   └── utils.js        时间/id/节流/escape/today/题库/mood 列表/toast
│   ├── views/              home / chat / mood / days / wishlist / truthbox（6 个功能页）
│   └── game/catfish/
│       ├── main.js         编排：选模式→双方 ready→开局→结算→再来
│       ├── engine.js       Canvas2D 渲染 + 主循环 + 碰撞 + 状态机 + 主题取色
│       ├── sync.js         联机协议（位置广播 ~12fps / claim 鱼 / setStatus）
│       ├── input.js        整画布虚拟摇杆（触摸 + 鼠标）
│       └── modes.js        三模式规则：versus / coop / turn（纯函数）
│
├── README.md               ← 你在看
├── SETUP.md                云端后端配置（Supabase / MemFire）
└── PROGRESS.md             实施进度 / 架构决策 / 已知问题（给续作者）
```

---

## 五、各功能怎么玩

| 功能 | 入口 | 说明 |
|---|---|---|
| 💬 悄悄对话 | 首页「悄悄对话」 | 实时消息，头像+气泡，回车发送 |
| 💗 今日心情 | 「今日心情」 | 选 emoji + 写悄悄话，看对方今日 |
| 📅 在一起 | 「在一起」 | 在一起天数 + 纪念日倒计时 + 添加 |
| ✅ 心愿清单 | 「心愿清单」 | 添加 / 勾完成 / 删除 |
| 🎲 真心话 | 「真心话」 | 随机抽题，我答 / 看 ta 答 |
| 🐱 猫猫吃鱼 | 「猫猫吃鱼」 | 双人联机：对战(限时)/合作(凑目标)/回合(轮流) |
| 💝 3D 爱心 | 「3D 爱心」 | 可旋转的 3D 心形，跟随主题 |

---

## 六、主题

右下角 🎨 浮动按钮切换 **樱花粉 / 薄荷绿 / 薰衣草紫** 三套马卡龙配色（`[data-theme]` + CSS 变量，记忆在 localStorage，防 FOUC）。游戏 Canvas 与 3D 心均从主题取色/跟随。

---

## 更多

- 架构决策、阶段进度、已知问题：[PROGRESS.md](./PROGRESS.md)
- 后端配置（Supabase / MemFire）：[SETUP.md](./SETUP.md)
