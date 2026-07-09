# love-h5 实施进度 · 给「换电脑继续」用

> 这份文件记录整个项目的**进度、关键决策、下一步**。换电脑时：
> 1. `git clone` 本仓库到新电脑；
> 2. 打开本文件看「当前进度」和「下一步该做什么」；
> 3. 配置后端见 `SETUP.md`；本地预览见 `README.md`。
> Claude 在新电脑读这份文件就能无缝接着干。

---

## 项目一句话
挂在 GitHub Pages 的情侣 H5（纯静态、无自建服务器）：实时对话、猫猫吃鱼双人联机（对战/合作/回合三模式）、每日心情+悄悄话、在一起天数+纪念日、共同心愿清单、真心话盲盒、接入 heart-3d、3 套马卡龙主题切换。

## 技术栈
纯静态 H5（原生 JS + ES Modules，**零构建**）+ LeanCloud（云端实时）+ Canvas2D（游戏）。部署 GitHub Pages。

---

## 关键架构决策（ADR）

### ADR-1：静态托管，无自建服务器
GitHub Pages 只放静态文件。GitHub Actions 不能常驻。所以「写服务让 GitHub 托管」走不通。

### ADR-2：实时后端 = LeanCloud（演进：曾选 Firebase，因国内被墙放弃）
- 中国大陆用户 + 异地 → 必须用「国内能访问的云端实时服务」。
- **Firebase 在国内基本被墙**，放弃作主选。
- 选 **LeanCloud**：国内可访问（国际版 leancloud.app 无需备案、国内能连），能存历史消息 + 实时同步，免费开发版够情侣用。
- **本地预览模式**（localStorage + BroadcastChannel，同浏览器多 tab）作为零配置降级，方便未配 LeanCloud 时预览。

### ADR-3：store.js 数据抽象层（核心）
统一 API（onValue/onList/set/update/push/remove/transaction/onDisconnect*），两种实现：
- 云端模式（LeanCloud）：跨手机异地实时。
- 本地模式：内存树 + localStorage + BroadcastChannel，同浏览器预览。
调用方不感知后端，功能代码与后端解耦。

**LeanCloud 映射**：用一张通用表 `Node`，每行 = `{ room, path, value(JSON) }`，复合唯一键 `(room, path)`。把路径树扁平化成 KV，完美保持 store 的路径 API（'chat' / 'games/catfish/g1' 等都映射成一行）。功能代码与本地模式零差异。

### ADR-4：房间号机制
`rooms/{情侣约定的房间号}/` 隔离所有数据。房间号当密码用（建议 16 位随机串）。身份（男/女）选一次记 localStorage。

### ADR-5：主题
3 套马卡龙（樱花 sakura / 薄荷 mint / 薰衣草 lavender）via `[data-theme]` + CSS 变量。全局浮动切换器，防 FOUC（head 内联脚本预置 class）。

---

## 后端选型对比（已决策 LeanCloud）

| 方案 | 国内可用 | 存历史 | 配置成本 | 结论 |
|---|---|---|---|---|
| **LeanCloud** ✅选 | 国际版国内可连 | ✅ | 注册拿 AppID/Key/serverURL | 主选 |
| Supabase | 偏慢 | ✅ | 注册 URL/anonKey | 备选 |
| 公共 MQTT | 好 | ❌不存历史 | 零注册 | 仅同时在线可用 |
| Firebase | ❌被墙 | ✅ | - | 仅科学上网 |

---

## 当前进度（8 阶段）

- [x] **阶段 0 · 资产**：复制头像(boy/girl/tomcat.jpg) + heart-3d.html 到 love-h5/；heart-3d 副本已加 postMessage 主题桥接。
- [x] **阶段 1 · 骨架(CSS/工具)**：`css/theme.css`(3套)、`css/base.css`、`js/core/utils.js` 完成。
- [~] **阶段 2 · 数据层**：`store.js` 本地模式 ✅ 完成；**云端实现待从 Firebase 改为 LeanCloud**（进行中）。`room.js` 待写。
- [ ] **阶段 1 · 骨架(续)**：`index.html`(SPA 外壳)、`router.js`、`theme.js`、`css/pages.css` 待写。
- [ ] **阶段 3 · 功能页**：home/chat/mood/days/wishlist/truthbox。
- [ ] **阶段 4 · 猫猫吃鱼**：catfish.html + engine/sync/input/modes（三模式联机）。
- [ ] **阶段 5 · heart 接入**：heart.html 容器（iframe+主题桥接）。
- [ ] **阶段 6 · 主题贯通**：游戏 Canvas 取色、heart iframe 跟随。
- [ ] **阶段 7 · 文档**：SETUP.md(LeanCloud 配置)、README.md(预览/部署)。
- [ ] **阶段 8 · 验证**：本地服务 + chrome-devtools 截图 + 真机。

## 已建文件清单
```
love-h5/
├── assets/images/  boy.jpg girl.jpg tomcat.jpg
├── heart-3d.html   (副本, 已加主题桥接)
├── css/theme.css  css/base.css
└── js/core/utils.js
```
注：`js/config/firebase-config.js` 将改名/重写为 `leancloud-config.js`；`js/core/store.js` 云端部分待改 LeanCloud。

---

## 下一步（给接手者）
1. 把 `js/config/firebase-config.js` 重写为 `js/config/leancloud-config.js`（AppID/AppKey/serverURL 占位 + isConfigured 检测）。
2. 改 `store.js`：import 指向 leancloud-config；云端实现用 LeanCloud（AV.Object 'Node' 表 + AV.Query LiveQuery 订阅 + AV.init）。本地模式不动。
3. 写 `room.js`（房间号+身份+心跳+onDisconnect）、`theme.js`、`router.js`、`index.html`、`css/pages.css`。
4. 按 PLAN（见 `.claude/plans/cached-humming-gizmo.md`）继续阶段 3-8。
5. 每完成一阶段，更新本文件的 checklist。

## 给接手 Claude 的提示
- 全程中文（用户、代码注释、文档）。
- store.js 是核心抽象，本地模式已可用，云端只换实现、API 不变。
- LeanCloud 用「通用 Node 表扁平化路径」方案（见 ADR-3），不要改成多表。
- 游戏联机位置广播频率控制在 ~6-8fps，避免 LeanCloud 免费版 QPS 限制。
- 每个阶段做完更新本 PROGRESS.md。
