# Python · 中文 Windows 控制台 GBK 编码崩溃需 PYTHONUTF8 坑点

## 现象
Python 脚本运行到 `print()` 含 emoji（✅❌⚠️）或某些超出 GBK 范围的 Unicode 字符时，在**中文 Windows**（控制台默认编码 cp936/GBK）抛出：

```
UnicodeEncodeError: 'gbk' codec can't encode character '\u2705' in position N: illegal multibyte sequence
Traceback (most recent call last):
  File "...", line N, in <module>
    print("...✅")
```

更隐蔽的是：Traceback 往往出现在脚本**末尾**（如最后的总结打印），此时前置的核心逻辑可能**已经成功执行并输出**，但用户/Agent 看到末尾 Traceback 会误判为"脚本崩溃、环境没就绪、功能失败"。

## 根因
中文 Windows 下 `sys.stdout` 默认用 `cp936`（GBK）编码，无法编码 emoji 等超出 GBK 字符集的码点。脚本本身逻辑没问题，只是输出端编码不支持。

## 解决（任选其一）
- **运行时环境变量（推荐，零改动）**：`PYTHONUTF8=1 python xxx.py`（开启 UTF-8 模式，stdout/stderr/files 全走 utf-8）。Bash：`PYTHONUTF8=1 python ...`；PowerShell：`$env:PYTHONUTF8=1; python ...`。
- `PYTHONIOENCODING=utf-8`（仅改 stdio 编码，更轻量）。
- 控制台切码：`chcp 65001`（改当前控制台为 UTF-8）。
- 脚本内根治：开头 `sys.stdout.reconfigure(encoding='utf-8')`，或全局 `# -*- coding: utf-8 -*-` 无效时用 `io.TextIOWrapper` 重包 stdout。

## 非直觉点（为什么是坑）
1. **末尾崩溃 ≠ 功能失败**：错误在脚本最后一行 print，前面的文件已写出、命令已执行。判断"是否真失败"要看核心产物是否生成，而不是只看有没有 Traceback。
2. **emoji 是元凶**：纯中文一般 GBK 能编（不会崩，只是 PowerShell 显示方框/问号），**带 emoji/特殊符号才会抛异常**。所以"中文能跑、加个 ✅ 就崩"很反直觉。
3. **乱码 vs 崩溃是两回事**：仅中文乱码（不抛异常）说明编码能编只是显示不出，无需 PYTHONUTF8 也能跑完；抛 UnicodeEncodeError 才是崩溃。

## 通用规则
- 在中文 Windows 跑任何"会打印 emoji 或富文本"的 Python 工具脚本，**统一加 `PYTHONUTF8=1`**，省得排查。
- 看到 Python 在 Windows 末尾 UnicodeEncodeError，先别怀疑逻辑，先查是不是输出编码问题。

## 本项目实例
- 项目：依赖新鲜度检查工具（`d:\Users\Orange\Desktop\依赖新鲜度检查工具\`）
- `scripts/check_env.py` 末尾 `print("\n结果: " + ("全部就绪 ✅" if ok else ...))` 在本机直接抛 UnicodeEncodeError，但前面的 `[OK] Python / playwright / Pillow / Chromium` 已正常打印——**环境实际就绪，崩溃是假象**。
- `analyze_excel.py / query_npm.py / screenshot_npm.py / generate_report.py / optimize_excel.py` 的中文输出在本机默认控制台会乱码（不崩），统一用 `PYTHONUTF8=1 python scripts/xxx.py ...` 运行，输出正常。
- 解法已固化为：调用每个脚本时前缀 `PYTHONUTF8=1`。

## 相关
- [[依赖新鲜度扫描-无时间过期多为无解坑点]]
- [[SCA依赖新鲜度校验与升级坑点]]
- [[npm页面截图-版本与发布时间被视口切掉坑点]]
