# chrome-devtools CLI/MCP 陈旧 uid 误点坑点

## 现象

用 chrome-devtools（CLI 或 MCP 工具）做浏览器自动化时，`take_snapshot` 拿到的元素 `uid`（如 `uid=19_53`）在后续 `click`/`fill` 中报告 **"Successfully clicked"**，但实际点到了**错误的元素**——页面行为诡异（例如想点「查询」按钮却触发了树上某个节点、想点表格开关却点到了别处），且**无任何报错**，极易误判为页面 bug 排查半天。

## 根因

uid → 元素的映射是 **snapshot 时刻的快照**。当两次交互之间 DOM 发生大幅重排（树节点展开/收起、列表刷新增删行、弹窗开关、搜索过滤导致区域高度变化），旧 uid 对应的**物理坐标**已不是目标元素，点击按坐标/旧引用落到了新占据该位置的元素上。CLI 仍报成功，因为「点击动作」本身执行了。

## 通用规则

1. **每次页面结构变化后必须重新 `take_snapshot` 取新 uid**，不要跨 DOM 变化复用旧 uid。
2. 出现「点了但状态不对」时，第一反应**先怀疑 uid 陈旧**，用新 snapshot 核对目标元素当前 uid，而不是去怀疑页面代码。
3. 对稳定性要求高的操作，**改用 `evaluate_script` 按 DOM 文本/属性精确定位**，不依赖 uid：
   ```js
   // 点表格某行的操作按钮
   () => {
     const row = [...document.querySelectorAll('.el-table__body tr')]
       .find(r => r.textContent.includes('目标行关键字'));
     const btn = [...row.querySelectorAll('.el-link, button, a')]
       .find(a => a.textContent.trim() === '删除');
     btn.click();
   }
   ```
4. el-tree 这种节点密集组件，uid 点击还容易落在缩进空白区（node-click 不触发）；用 `querySelectorAll('.el-tree-node__content')` 按文本找节点再 `.click()` 更稳。
5. `el-switch`、`el-link` 等自定义组件 uid 点击可能报 "did not become interactive"——同样用 evaluate_script 找 `.el-switch` 点击。

## 本项目实例

- 项目：maoming-backend-q（pbsf 前端，比赛项目管理页验证）
- 场景：左侧树搜索「游泳」过滤后清空，树从 2 节点恢复到 26 节点；随后用旧 uid 点右侧「查询」按钮，实际点中了树上「田赛」节点（当前节点被改、列表查了田赛子级），输出却显示 Successfully clicked。换成每次交互前重新 snapshot / evaluate_script 精确定位后全部正常。
- 相关：[chrome-devtools-MCP操作Element-Plus弹窗组件坑点](chrome-devtools-MCP操作Element-Plus弹窗组件坑点.md)
