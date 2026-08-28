# mp-weixin：主包体积优化（< 1.5M 检查）+ 「主包未使用 JS」误报 + import 的 json 别放 static

> 适用：uni-app / 原生微信小程序（mp-weixin）。主包超 1.5M 检查未通过 / 微信报「主包内不应存在主包未使用的 JS 文件」。

## 现象

微信开发者工具「代码体积检查」未通过：
- 「主包尺寸（不含插件）应小于 1.5 M」
- 「主包内不应存在主包未使用的 JS 文件：apis/xxx.js、utils/xxx.js、common/xxx.js ...」

## 根因

**一、体积规则**：主包**硬限 2MB**，1.5M 是「代码体积检查」的**建议阈值**（超了能上传，检查标红）。主包大小 = 主包根目录所有物理文件（pages/apis/common/components/utils/store/hooks/static 等）之和。

**二、「主包未使用 JS」绝大多数是误报**：被**分包** `require`/`import` 的主包公共模块（apis/、utils/、common/ 下），HBuilderX 编译时打进**主包**（主包是公共依赖载体，分包运行时从主包加载）。微信检查只看「主包页面有没有引用」，看不到「分包引用主包」→ 标红误报。**这些模块被分包用，删不得**。

**三、import 的 json 放 static 会重复计体积**：static 是 HBuilderX「原样复制」目录，其下文件无论是否被引用都复制到产物。json 走 `import`（编译期内联成模块），若又放 static → 内联模块 + static 复制件 = **重复**。区别于 `require` 的 js（require 运行时加载 static 复制件，不重复——见《mp-weixin-lime-echart必须放static目录坑点》）。

## 正确做法

**1. 区分「误报公共模块」vs「真死代码」**：grep 每个「未使用 JS」的 import 引用。被分包引用 = 误报（保留）；全项目无人引用 = 真死代码（删）。

**2. 大静态数据只被单个分包用 → 移到该分包**（主包直减）。例：`common/regions.json`(324KB) 只被 `components/RegionPicker` 用、RegionPicker 只被 packageMine 用 → 连同 RegionPicker 移到 packageMine（regions.json 放 `packageMine/utils/` **非 static** 避免重复；RegionPicker 放 `packageMine/components/`），改 2 处 import 路径。

**3. 消除「未使用 JS」警告的最佳实践：单分包用的移子包、多分包共用的留主包**。
- **单分包用的**（如 `apis/recipe` 只 packageFeature 用）→ 移到 `packageFeature/apis/`（消警告 + 减主包体积），改对应 import 路径。
- **多分包共用的**（如 `utils/exportFile` 被 packageFeature+packageMine 用）→ **留主包**（复制两份不划算、维护成本高），接受这 1 个警告（warning 不阻断上传）。
- **grep 区分真主包模块**：被主包 store/components 用的（`apis/auth`←store/user、`apis/student`←store/student、`utils/chartOption`←components/CRadarChart）是真主包模块，留主包**不警告**，别误移。
- 别盲删：先 grep 每个文件的 import 引用，区分「单分包用（移）/ 多分包共用（留主包）/ 主包用（留）/ 死代码（删）」。

**4. 主包大头通常是 static 图片**：TinyPNG/pngquant 无损减色压缩（保透明 + 真机零问题，见《mp-weixin-分包超限与PNG透明判断坑点》）。

**5. import 的 json/数据放非 static 目录**（utils/data 等），只内联 1 份；`require` 的 js 才放 static。

## 诊断

1. 主包源码按目录聚合找大头：`Get-ChildItem static,common -Recurse -File | sort Length -desc`。常见：static 图片、大 json（regions 等）、uni_modules 编译部分。
2. 「未使用 JS」逐个 grep import 引用，区分误报/死代码。
3. 主包编译后体积以微信开发者工具「代码体积」为准（CLI 不能编译）。

## 本项目实例

翼动同行（school-parent-mp）：主包检查未通过（> 1.5M）+ 11 个「未使用 JS」。排查：11 个**全是公共模块误报**（apis/recipe→packageFeature、apis/school→packageMine、utils/exportFile→packageFeature+packageMine、common/const→packageMine 等，无死代码）。主包大头：`common/regions.json` 324KB（只被 RegionPicker→packageMine 用）+ static 图片 761KB。

修复：regions.json + RegionPicker 移到 packageMine（regions 放 `packageMine/utils/` 非 static 避免重复），主包源码 1282→955KB（-327KB），packageMine 480→808KB（< 2MB）。剩余 static 761KB 待 TinyPNG 压缩（用户侧）。

教训：①「主包未使用 JS」先 grep 区分误报/死代码，别盲删；② 大静态数据随唯一使用方移分包；③ import 的 json 别放 static（重复）；④ 主包大头往往是图片，走无损压缩。
