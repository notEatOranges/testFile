# cron-parser 解析 Quartz 风格 cron 表达式的兼容性坑点

## 场景
用 `cron-parser` 库计算"下 N 次运行时间"时，若表达式来自 RuoYi / Quartz 风格的 Crontab 组件（7 段：秒 分 时 日 月 周 年，带 `?` `L` `W` `#` 修饰符），直接传入会连续踩坑。

## 坑点

### 1. 不支持第 7 段（年字段）→ `Invalid cron expression, too many fields`
cron-parser 5.x 只接受 5 段（标准 cron）或 6 段（带秒）。Quartz 的年第 7 段直接报错。
**对策**：丢弃年字段，只拼 6 段（秒 分 时 日 月 周）。年字段在实际定时任务里极少使用。

### 2. 周几编码与 Quartz 完全相反（最隐蔽）
- Quartz：`1=周日, 2=周一, ..., 7=周六`
- cron-parser（标准 Unix cron）：`0=周日, 1=周一, ..., 6=周六`

直接传 Quartz 周字段，**周几会全部错位一天**（肉眼看不出来，但结果错）。
**对策**：周字段里每个数字 `-1`（1→0, 2→1, …, 7→6）。需按形式分别处理：
- `A#B`（第几周的星期几）：只转 A，B 是"第几周"不能转
- `AL`（最后一个星期几）：转 A
- `A-B`（范围）、`A,B`（列表）：每个数字都转

### 3. 不支持 `W` 修饰符 → `Invalid characters, got value: 15W`
cron-parser 不支持 day-of-month 的 `W`（`15W`=15 号最近工作日）和 `LW`。
**对策**：检测到 day 含 `W` 时走单独的手动计算（`nearestWorkday`：周末则取最近工作日、不跨月）。

### 4. 日 / 周互斥语义差异
Quartz 用 `?` 表示"不指定"（日和周从不同时指定）；标准 cron 是 OR 语义（日和周都指定时取并集）。
**对策**：把 `?` 替换为 `*`。因 Quartz 里日 / 周总有一个是 `?`，转 `*` 后标准 cron 的 OR 规则会正确退化为"按另一个字段匹配"。

## 通用规则
引入 cron-parser 处理 Quartz 表达式时，**必须写适配层**：`?`→`*`、周编码 `-1`、剥离年字段、`W` 单独计算。不要把 Quartz 表达式直接喂给 cron-parser。验证时务必覆盖：指定周几、最后一天 `L`、第几周几 `#`、最后周几 `L`、工作日 `W` 这几类，重点核对"周几"是否错位。

## 本项目实例
- 项目：Tyzxyy-q（游泳专项项目管理系统，RuoYi-Vue3）
- 文件：`src/components/Crontab/result.vue` — SonarQube 报 `expressionChange` 认知复杂度 353（6 层嵌套循环，下限 21 > 阈值 15，保留算法不可能达标），改用 cron-parser 重写。
- 适配函数：`buildCronExpression`（6 段化 + `?`→`*`）、`convertWeekField`/`convertDowToken`（周编码 -1）、`computeWorkdayResults`/`nearestWorkday`（`W` 手算）。
- 相关：[[代码扫描结果先分死活再修坑点]]
