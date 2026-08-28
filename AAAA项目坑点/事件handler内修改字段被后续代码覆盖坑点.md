# 事件 handler 内修改字段被后续代码覆盖坑点

## 通用规则

在事件处理链中，如果一个 handler（如 `handleChange`）内部对某个被 `v-model` 双向绑定的字段做了修改（典型场景：校验失败时清空 `item.value = ''`），**必须检查调用链上下游**——上游调用方在 `await` 该 handler 之后，是否又对同一个字段做了赋值。如果有，handler 内部的修改会被静默覆盖，导致校验/清空逻辑形同虚设。

### 症状
- 在 `@change` handler 里写了"重复则清空"或"非法则重置"的分支
- 手动操作 UI（用户点选）时校验生效
- 但程序化触发（如勾选 checkbox 后自动填默认值）时校验失效，字段最终还是被设成了非法值

### 根因
调用方代码长这样：
```js
await handleChangeXxx(val, item, index)  // handler 内部: item.value = '' （清空）
item.value = defaultValue                // ← 覆盖！清空被抹掉
```
handler 是异步的，调用方 `await` 之后又赋值，把 handler 内的修正覆盖回默认值。

### 正确做法
- **调换顺序**：先赋默认值，再 `await` handler（让 handler 的校验/清空成为最终结果）：
  ```js
  item.value = defaultValue
  await handleChangeXxx(defaultValue, item, index)  // 重复则在此清空，不再被覆盖
  ```
- 或 **让 handler 返回布尔值**，调用方据此决定是否保留赋值。
- 或 **不在调用方重复赋值**：既然 handler 已经会处理（v-model 同步或手动设），调用方就不要再赋一次。

### 排查要点
看到 `await handler(...)` 之后紧跟对同一字段的 `=` 赋值，就要警惕。这是"handler 内修正被覆盖"的高发写法。

## 本项目实例

- 项目：江苏专家库管理系统（jsty_expert_frontend）
- 路径：`packages/app-review/views/review/edit.vue`
- 函数：`handleChangeStatus`（勾选"本市内"checkbox 时自动填默认省市）

原代码：
```js
item.provinceId = '320000'
await handleChangeProvince('320000', item, index)
await handleChangeArea('320100', item, index)   // handleChangeArea 内：市重复时 item.cityId = ''
item.cityId = '320100'                          // ← 覆盖，重复校验失效
```
新增"多个本市内行不能选重复市"功能时，在 `handleChangeArea` 里加了重复校验清空，但被这行覆盖，导致勾选第二个本市内时即时校验不生效。修复方式：调换为"先赋值再 await handler"。
