# SonarQube CRITICAL 修复与「平台不读排除项」坑点

## 坑 1：sonar-project.properties 的 sonar.exclusions 在外部流水线平台不生效

### 现象
项目根有 `sonar-project.properties`，里面写了 `sonar.exclusions=public/tinymce/**,src/assets/js/base64.js,...`，但外部扫描平台（公司流水线 SonarQube）**仍然扫描并告警**这些被排除的路径（如 `base64.js`、`http.js`、`drag.js` 排除后依旧出现在结果里）。

### 根因
该扫描由**外部流水线平台**执行，平台**不读取**仓库里的 `sonar-project.properties`（它的扫描配置在平台服务端）。仓库内这个文件只是摆设。

### 处理
- **vendored 三方代码**（tinymce 语言包、base64 算法等）：要么在**扫描平台服务端**把这些路径配成排除项，要么……
- **死代码**：直接**删除**（`drag.js`、`treeList.js`、`pageClass.js` 等无引用的遗留文件）——删了就不可能被扫到，比配排除项可靠。
- **必须保留的 vendored 算法**（如 `base64.js` 还在被 cookie.js 引用，不能删）：就**就地改码**让它通过规则（见坑 2），或在文件内用 `// NOSONAR` 行级抑制（最后手段）。

### 要点
「在 `sonar-project.properties` 加排除」≠「扫描通过」。先确认你的扫描到底读不读这个文件；不读的话，排除项要配在平台服务端，或退回「删死代码 / 改 vendored 代码」。

## 坑 2：javascript:S3504 与 S3776（CRITICAL）怎么修

### S3504 = 「变量应使用 let/const 声明」（告 `var`）
- 机械替换：`var` → 没再赋值的用 `const`，会再赋值的用 `let`。函数体内无吊装依赖时 `var→let` 零风险。
- 老代码（尤其 vendored 算法）常一片 `var`，逐行替换即可清掉该文件所有 S3504。

### S3776 = 「函数认知复杂度（Cognitive Complexity）过高」（阈值默认 15）
- **降复杂度的安全手法**：把函数里**重复出现的控制流模式**抽成一个辅助函数/闭包，主函数变成线性顺序，复杂度立刻下来；辅助函数自己复杂度很低，单独计分。
- 关键：抽离时要**逐字节保持原行为**（do-while 的边界、`==` vs `===`、break/return 的时机）。改完用已知向量 + 原生实现交叉校验。
- **⚠️ 二级坑（重要）**：用「闭包捕获循环变量」降复杂度，会触发**另一个 SAST 规则**——"loop variable not modified / 疑似死循环"。例如 `base64decode` 把 `i++` 移进 `nextValue` 闭包后，主循环 `while (i < len)` 的 `i` 在循环体内不再可见地被修改 → 被报 `'i' is not modified in this loop`（连 `len` 也一并被报）。**解法**：别用隐藏修改的闭包，改用**普通 `for` 循环**（迭代变量在 `for` 头部自增，对分析器可见）；必要时重构算法（如 base64decode 改为「先 for 循环收集有效解码值，再 for 循环每 4 个还原 3 字节」），既保低复杂度又让迭代可见。**教训：一次重构可能过一条规则却踩中另一条，改完要重新全量扫描确认。**

### 本项目实例（Qsntypx-q，2026-07）
- 文件 `src/assets/js/base64.js`（三方 base64 算法，被 `src/assets/js/cookie.js` 引用，不能删）：
  - S3504 ×9：全部 `var` → `let`/`const`。
  - S3776 ×1：`base64decode` 把 4 段重复的 `do { ... } while(i<len && c===-1)` 抽成 `nextValue(checkPadding)` 闭包（共享 `i`/`len`/`str`），主循环变线性。验证：`base64encode(utf16to8('hello world'))==='aGVsbG8gd29ybGQ='`、与 Node `Buffer.toString('base64')` 对 ASCII 一致、Unicode/`=` 填充/空串往返全过。
- 文件 `src/pages/basic-manage/train/components/TMap.vue:100`：`var center` → `const center`（S3504）。
- 全部 11 个 CRITICAL 清零。

## 要点
- 遇到 SonarQube CRITICAL 先看规则号：`S3504`=var、`S3776`=复杂度、`SXXX`… 按规则对症下药，别无脑 NOSONAR。
- vendored 代码（base64/tinymce）的魔数、高复杂度多为**算法固有**，要么平台服务端排除，要么像上面那样安全重构；优先排除/删除死代码，其次就地改码。
- 相关：[[SCA依赖新鲜度校验与升级坑点]]、[[代码扫描结果先分死活再修坑点]]、[[Fortify安全漏洞修复坑点]]。
