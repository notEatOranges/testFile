# love-h5 → 微信小程序（云开发实时 + 用户体系）

在 TDesign 组件库工程基础上，迁移 love-h5 的双人实时能力。当前已完成**最小验证切片**：
登录 → 昵称头像 → 邀请码配对 → mood 心情页两手机实时同步。

## 架构（用户体系升级版）

- **身份**：openid（云函数 `getWXContext` 自带，免注册）+ 昵称头像（云存储）
- **配对**：邀请码（一方建空间→分享码→对方加入，openid 自动绑定），单一空间模型
- **实时**：云开发数据库 `watch()` 实时推送，**不走 WebRTC**（小程序无 WebRTC，UDP 仅限局域网）
- **写**：全部走云函数（管理员权限 + 原子浅合并），客户端只 watch 读

```
数据模型：
  users   { openid, nick, avatar, coupleId, role }        一个人一条
  couples { coupleId, inviteCode, members:{boy,girl} }    一对一条
  kv      { room:(=coupleId), path, value, ts }           实时数据全在这（love-h5 原结构）
```

## 一次性准备（微信开发者工具里做）

### 1. 选默认云环境
工具栏 → 云开发 → 开通/进入 → 右上角环境管理，记一个环境 ID 并设为「默认环境」。
（`app.js` 里 `wx.cloud.init()` 不传 env 即用默认环境。）

### 2. 建 3 个集合（云开发 → 数据库 → +）
建 `users`、`couples`、`kv` 三个集合。**权限按下面设**（数据权限 → 改为）：

| 集合 | 权限 | 原因 |
|---|---|---|
| `kv` | **所有用户可读，仅管理端可写** | 客户端 `watch()` 实时读需要；写全走云函数 |
| `users` | **仅管理端可读写** | 只由云函数操作，客户端不直接读 |
| `couples` | **仅管理端可读写** | 同上（inviteCode 是秘密，不能暴露） |

### 3. 部署 7 个云函数
`cloudfunctions/` 下右键每个文件夹 → **上传并部署：云端安装依赖**：
- `login` — 换 openid + 建档
- `createCouple` — 建情侣空间 + 邀请码
- `joinCouple` — 凭邀请码加入
- `updateProfile` — 存昵称头像
- `kvWrite` — kv 原子写（set/update/push/remove）
- `sendMsg` — 写聊天消息 + 给对方发订阅消息（替代 chat 场景的 kvWrite push）
- `anniversaryReminder` — 定时（每日 9:00）扫描纪念日，当天/提前 1 天给双方发订阅消息（含定时触发器 config.json）

> 首次部署每个云函数都要等「云端安装依赖」（装 wx-server-sdk）。
> `anniversaryReminder` 的定时触发器：部署后在云函数「触发器」面板确认 `dailyAnniv` 已生效（cron `0 0 9 * * * *` = 每天 9 点 CST）。

### 4. 确认 appid
`project.config.json` 的 appid 已是 `wxc8fe9cad738dd9fd`。云开发需该 appid 已开通云开发。

### 5. 订阅消息（聊天 + 纪念日推送，可选）
小程序没有「服务器主动推送」，靠**一次性订阅消息**：用户在首页「消息通知」板块点一次「允许」= 给自己攒 1 条收信额度，发 1 条扣 1 条。

1. **申请 2 个模板**：微信公众平台 → 功能 → 订阅消息 → 公共模板库，分别选：
   - 聊天消息提醒（关键词含 昵称 / 消息内容 / 时间）→ 拿到 `tmplId`
   - 纪念日提醒（关键词含 名称 / 日期 / 提示）→ 拿到 `tmplId`
2. **填入 4 处占位符**（客户端 2 + 云函数 2，同模板的值要一致）：
   - `utils/notify.js` 的 `TMPL_CHAT` / `TMPL_ANNIV`
   - `cloudfunctions/sendMsg/index.js` 的 `TMPL_ID`
   - `cloudfunctions/anniversaryReminder/index.js` 的 `TMPL_ID`
3. **核对模板关键词字段名**：两个云函数里的 `data`（如 `thing1`/`time2`/`thing3`）必须与你申请的模板关键词一一对应，类型也要匹配（thing/time/character_string…），否则报 `errCode 47003`。
4. **上线前改 miniprogramState**：两个云函数里的 `MP_STATE` 由 `developer` 改 `formal`，否则用户点通知跳转开发版会报错。
5. **重新部署** `sendMsg`、`anniversaryReminder`（改了 tmplId / state 都要重传）。

> 验证：真机双号，B 在首页点「消息通知」同意 → A 发一条消息，B 收到聊天通知；纪念日当天 9 点双方各收到一条纪念日通知（云函数日志看 `[anniv]` / `pushed` 计数）。

## 两手机验证实时同步

1. A 手机：编译运行 → 进 setup → 填昵称头像 → 「创建空间」选身份 → 拿到**邀请码**
2. B 手机（另一微信号，可用工具的「预览」扫码或真机）：进 setup → 「加入空间」输邀请码
3. A 自动跳 mood，B 也进 mood
4. A 选个心情 + 写悄悄话 → 保存 → **B 端应实时出现 A 的心情**（反之亦然）

若不同步：①检查 `kv` 权限是否「所有用户可读」②云函数是否都部署成功 ③控制台看 `[store]` 日志。

## 关键文件

| 文件 | 作用 |
|---|---|
| `utils/store.js` | 实时数据层（kv + watch + callFunction），保留 love-h5 全部契约 |
| `utils/user.js` | 用户体系封装（login/create/join/profile） |
| `utils/room.js` | 在线心跳（openid + coupleId） |
| `utils/themes.js` | 8 套马卡龙（供 Canvas 游戏取色） |
| `cloudfunctions/*` | 5 个云函数 |
| `pages/index` | 启动分发（login → 已配对进 mood/未配对进 setup） |
| `pages/setup` | 资料 + 邀请码配对 |
| `pages/mood` | 心情实时同步（验证切片） |
| `love-theme.wxss` | 主题变量（app.wxss 已 @import） |

## 后续迁移路线（love-h5 其余功能）

切片验证通过后，按难度递增：
1. **6 个页面**（chat/days/wishlist/truthbox/home/lobby）— 套路同 mood，订阅 + setData，TDesign 组件
2. **休闲游戏**（memory/quiz DOM、draw/trapcat 简单 Canvas）— input 改 bindtouch、主题取色改 themes.js
3. **联机游戏**（catfish/snake）— Store 已就绪，直接接联机协议；catfish 抢鱼原子性建议加 `claimFish` 云函数
4. **3D 爱心**（heart-3d）— 最硬，需 three-miniprogram 适配 + GLSL 验证，单独排期
