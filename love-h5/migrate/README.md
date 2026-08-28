# 数据迁移：微信云开发 → love-h5

把小程序时代的全部历史数据（聊天记录、每日心情、心愿、纪念日、真心话、游戏战绩、表情包、戳一戳后缀……）迁进本站。原理：数据都在 kv 集合里（`{room, path, value, ts}`），room=coupleId 原样保留即可零转换继承；两个角色账号按 boy/girl 重新创建并绑成空间。

## 准备：两份配置

**① 迁移账号**（迁完用它们登录 H5），编辑 `pack.mjs` 顶部：

```js
const ACCOUNTS = {
  boy:  { username: 'xiaocheng', password: '你的密码', },
  girl: { username: 'xiaotao',   password: '你的密码', }
}
```

## 路径 A（推荐）：控制台手动导出 + pack 打包

1. 微信开发者工具 → 云开发 → 数据库 → 分别导出 `users`、`couples`、`kv` 三个集合（导出格式选 **JSON**）到 `migrate/cloud-export/` 目录
2. `cd migrate && node pack.mjs`
3. 生成 `../server/data/import.json` → 直接启动后端，**自动导入一次**（成功后改名 `import.done.json`）

> 云开发控制台导出的 JSON 是「每行一个对象」的 NDJSON 格式，pack.mjs 已兼容（也兼容数组格式）。

## 路径 B（全自动）：import.mjs 直连云开发拉取

需要腾讯云 API 密钥（云开发控制台 → 设置 → 全局设置里能看到归属的密钥入口）：

```bash
cd migrate && npm install
TCB_ENV=你的环境ID TCB_SECRET_ID=AKID... TCB_SECRET_KEY=... node import.mjs
```

脚本会：拉取三个集合 → 把 kv 里引用的 `cloud://` 文件（头像/心情背景/聊天图片/语音/表情包）全部下载到 `server/data/files/import/` → 在 import.json 里生成 fileMap 把 fileID 改写成本地 `/files/...` URL → 生成 import.json。

## 导入内容说明

| 云端 | 本站 |
|---|---|
| users（openid, nick, avatar） | 按 pack 配置创建 boy/girl 两个账号，昵称头像从 users 按 members 映射认领 |
| couples（coupleId, inviteCode, members） | couples 表原样保留 coupleId 与邀请码；两账号绑定为空间成员 |
| kv（room, path, value, ts） | 逐行原样导入（room/path/ts 不变），cloud:// 字符串按 fileMap 改写 |

**注意**：导入会创建用户和空间，重复执行以「账号名」和「(room,path)」为键覆盖更新，kv 不会重复；换 coupleId 导入会形成第二个空间，不要那么干。

## 导入后验证

登录两个账号 → 首页「在一起天数」、历史心情（M2 后）、成绩榜（M3 后）应与小程序一致；M1 阶段可直接验证：我的页昵称头像 = 小程序里的资料；戳一戳后缀设置项 = 原值。
