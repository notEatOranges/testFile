# 水印快删（kuaishan-video）

短视频链接解析去水印工具 · 包名 `com.kuaishan.video` · HarmonyOS 26（API 26）Beta2 · ArkTS Stage 模型

## 已实现

- **首页功能中心**：复刻设计稿的十宫格能力卡片；「视频去水印」已可用，其余为占位（点击提示开发中）
- **视频去水印全流程**：粘贴分享口令 → 提取链接 → 解析 → 结果卡（封面/标题/作者/时长）→ `SaveButton` 安全控件保存到系统相册 / 复制直链
- **演示模式**：默认开启，解析返回演示数据，不请求网络；关闭后走自建接口
- **分享拉起**：抖音/快手分享链接可直接唤起 app 并自动解析（module.json5 skills + EntryAbility onNewWant）
- **权限**：仅申请 `ohos.permission.INTERNET`（保存相册走安全控件临时授权，零权限）

## 解析接口约定（自建）

`POST <你的接口>`，body：`{"link":"https://v.douyin.com/xxx"}`

返回 JSON 满足以下任一结构即可（字段名做了常见别名兼容）：

```json
{ "code": 0, "data": { "title": "...", "author": "...", "cover": "https://...", "url": "https://无水印直链" } }
```

在 app 内「设置」页填入接口地址、关闭演示模式即生效。

## 构建 / 运行

DevEco Studio 打开本目录 → Project Structure > Signing Configs 勾选 Automatically generate signature → 点 Run 装机到真机。

命令行构建：

```bash
export DEVECO_SDK_HOME="C:\Program Files\Huawei\DevEco Studio\sdk"
export PATH="/c/Program Files/Huawei/DevEco Studio/jbr/bin:$PATH"
"C:/Program Files/Huawei/DevEco Studio/tools/hvigor/bin/hvigorw.bat" assembleHap --mode module -p product=default --no-daemon
```

产物：`entry/build/default/outputs/default/entry-default-unsigned.hap`

## 目录

```
entry/src/main/ets/
├── pages/Index.ets          首页·功能中心
├── pages/ParsePage.ets      链接解析流程页
├── pages/SettingsPage.ets   设置（演示模式开关/接口地址）
└── services/
    ├── ParseService.ets     口令提取、接口请求与响应映射、配置持久化
    └── MediaSaver.ets       下载到缓存 + 写入相册
```

## 说明

- 仅用于个人学习研究，请尊重原作者版权，勿传播侵权内容
- AI去水印/实况提取/MD5修改等高级能力为首页占位，后续按需迭代
