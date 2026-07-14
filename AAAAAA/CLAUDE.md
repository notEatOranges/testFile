# AAAAAA 小程序工程 — 开发铁律

本目录是把 love-h5（情侣互动 H5）迁移成微信小程序的工程（TDesign 组件库 + 云开发）。

## 🚫 铁律：UI 禁止使用 emoji 作为图标或装饰

**任何 UI 位置（hero、角色、占位、标题前缀、按钮、tab、空状态、返回箭头等）一律不用 emoji。** 一律改用：
- **TDesign `t-icon`**（本工程已全局注册，直接 `<t-icon name="heart" size="48" />`，颜色靠外层 `color` 继承）
- 或 iconfont / 在线 UI 图

> 区分：用户选择/展示的「心情 emoji」（🥰😊…）属于**产品功能数据**，不是 UI 装饰，**不在此列**。
> 禁的是「拿 emoji 当 UI 图标元素用」，不是禁 emoji 内容本身。

**违反此铁律一律返工。** 写任何 WXML 前先想：这个位置是不是图标？是 → 用 t-icon，绝不写 emoji。

## 技术栈约定
- **UI 组件**：TDesign（`miniprogram_npm/tdesign-miniprogram`）。表单/按钮/详情等标准界面一律用 t-button / t-input / t-cell / t-tabs / t-textarea / t-dialog 等，不要手写原生控件
- **后端**：微信云开发（数据库 `watch()` 实时推送 + 云函数原子写）。**不用 WebRTC**（小程序运行时无 WebRTC，UDP 仅限局域网）
- **用户体系**：openid + 昵称头像 + 邀请码配对 + 单一空间（users/couples/kv 三集合）
- **数据层**：`utils/store.js`(kv 实时抽象) / `utils/user.js`(身份) / `utils/room.js`(心跳)
- **主题**：`love-theme.wxss` 8 套马卡龙，页面根节点 `class="theme-{{theme}} love-page"`，CSS 变量级联
- **导航**：业务页用系统导航栏（页面 json 设 `"navigationStyle": "default"`），避开工程全局 custom 导航的占位问题
- **原生 `<input>`**：高度用显式 `height`+`line-height`，**不要靠 padding 撑高**（input 是原生组件，上下 padding 不生效）

## 部署/验证
见 `README-love.md`（建集合、设权限、部署 5 云函数、两手机验证）。
