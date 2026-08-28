# Harmony7App — 鸿蒙 7 应用工程

HarmonyOS 7（API 26）ArkTS 应用，Stage 模型，标准单 entry 模块结构，可直接用 DevEco Studio 打开运行。

## 工程结构

```
Harmony7App/
├── AppScope/                      应用级配置（包名、版本、图标、名称）
│   ├── app.json5
│   └── resources/base/
├── entry/                         主模块（入口 HAP）
│   ├── src/main/
│   │   ├── module.json5           模块配置（Ability、设备类型、权限）
│   │   ├── ets/
│   │   │   ├── entryability/EntryAbility.ets   入口 UIAbility（生命周期）
│   │   │   └── pages/Index.ets                 首页（ArkUI 声明式页面）
│   │   └── resources/base/        字符串、颜色、图标、页面路由表
│   └── build-profile.json5
├── build-profile.json5            工程级配置（SDK 版本、签名、产物）
├── oh-package.json5
└── hvigorfile.ts + hvigor/        构建脚本（hvigor）
```

## 环境准备（✅ 已完成 2026-08-27）

- **DevEco Studio 26.0.0.621（Beta2）** 已静默安装至 `C:\Program Files\Huawei\DevEco Studio`
- 内置 HarmonyOS SDK：**API 26 / HarmonyOS 26.0.0 Beta2**（`sdk/default/sdk-pkg.json` 可查）
- 说明：华为官方把"鸿蒙 7"命名为 **HarmonyOS 26**（版本号跟年份走），即 API 26 代际；本套件为 Beta，**打出的包不能上架应用市场**，仅开发调试用
- 工具链位置（IDE 会自动配置，命令行用时可手动加 PATH）：
  - 构建：`C:\Program Files\Huawei\DevEco Studio\tools\hvigor\bin`
  - 包管理：`C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin`
  - 设备桥：`C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony\toolchains\hdc.exe`
  - Node：`C:\Program Files\Huawei\DevEco Studio\tools\node`

> 如需可上架的正式应用：后续改用稳定版套件（如 6.1.1 Release / API 24），在 IDE 中按提示 Sync 即可，代码无需改动。

## 命令行构建要点（已验证通过）

1. **工程必须在纯英文路径**（hvigor 拒绝中文路径，报 `Invalid project path`）——本工程已从 `鸿蒙开发/` 迁至当前位置
2. API 26 起 `compatibleSdkVersion` 格式为三段式字符串 `"26.0.0"`（旧式 `"X.Y.Z(26)"` 已废弃），需同时配置 `targetSdkVersion`
3. 命令行构建前设置环境：
   ```bash
   export DEVECO_SDK_HOME="C:\Program Files\Huawei\DevEco Studio\sdk"
   export PATH="/c/Program Files/Huawei/DevEco Studio/jbr/bin:$PATH"   # 打包步骤需要 java
   "C:/Program Files/Huawei/DevEco Studio/tools/hvigor/bin/hvigorw.bat" assembleHap --mode module -p product=default --no-daemon
   ```
4. 产物：`entry/build/default/outputs/default/entry-default-unsigned.hap`（未签名，IDE 运行时会自动签名）

## 运行本项目

1. DevEco Studio 已打开本工程（工具栏显示 `entry` 配置 + 已连接设备 `HUAWEI Mate 80 Pro Max 7.0.0(26.0.0)`）
2. **首次运行两步走**：
   - 点工具栏绿色 ▶（Run）→ IDE 弹出未签名提示 → 选「打开 Project Structure」或 File > Project Structure > Signing Configs
   - 勾选 **Automatically generate signature** → 浏览器登录华为账号 → 回到 IDE 确定生成调试证书 → 再点 ▶ 即可装机运行
3. 启动后手机首页为「你好，鸿蒙 7」欢迎页，带一个计数按钮，可改 `entry/src/main/ets/pages/Index.ets` 开始开发

## 注意事项

- **路径含中文会导致构建失败**：hvigor 拒绝中文路径；本工程已迁至英文路径 `D:\Users\Orange\Desktop\testFile\Harmony7App`
- **API 26 为 Beta2**：用 Beta SDK 打包的应用**不能上架应用市场**，仅用于开发调试
- 安装包残留已清理完毕（2026-08-27）
- 修改应用名：`AppScope/resources/base/element/string.json` 的 `app_name`
- 修改包名：`AppScope/app.json5` 的 `bundleName`

## 常用命令（装好 IDE 后，也可在 IDE 内操作）

DevEco Studio 的命令行工具在 `<DevEco安装目录>/tools/` 下：

```bash
hvigorw assembleHap --mode module -p product=default   # 构建 HAP
hdc list targets                                        # 查看连接的设备
hdc install entry/build/default/outputs/default/*.hap   # 安装到设备
```
