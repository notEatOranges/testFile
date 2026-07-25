# pbsf-table-column-width — 表格列宽控制规范

el-table 列宽的取值与调整规则。**新建列表页、改列表页列、联调阶段调列宽时必读**。

核心三句话：
1. **新建阶段**：按表头字数估列宽（短表头固定 `width`，长表头用 `min-width`）。
2. **联调阶段**：按真实内容长度微调，让大部分行不省略；内容天然就很长的列用 `show-overflow-tooltip` 省略，**不要为了"一行显示全"无限加宽**。
3. **手动改过的列宽，AI 一律不得主动修改**（除非用户明确要求）。改其他东西时顺手"规整"列宽也禁止。

---

## el-table 列宽机制（先搞懂再调）

| 属性 | 行为 | 用在哪 |
|---|---|---|
| `width="N"` | **固定列宽**，不参与剩余空间分配 | 短表头/定长列：序号、状态、性别、日期时间、操作 |
| `min-width="N"` | **最小宽度**，剩余空间按各列 `min-width` 之比分配 | 可变文本列：名称、标题、地址、描述、备注 |
| 都不设 | 剩余空间均分 | 尽量别用，列宽不可控 |
| `:show-overflow-tooltip="true"` | 内容超出列宽时**省略 + hover 显示完整内容** | 天然就很长的列（备注、地址、长名称） |

分配规则：先减去所有 `width` 固定列，剩下的空间按 `min-width` 数值的比例分给 `min-width` 列。所以 `min-width` 列之间是**按比例**伸缩的，不是各自死守那个值。

---

## 第 1 阶段：新建列表页 —— 按表头字数估列宽

按表头字数 × ~18px + 左右 padding(~24px) 估算，给个合理初值。参考表：

| 表头字数 / 类型 | 取值 | 示例字段 |
|---|---|---|
| 2 字 + 定长 | `width="55"`~`width="80"` | 序号(55)、性别、状态、启用 |
| 3~4 字 + 定长 | `width="100"`~`width="120"` | 联系电话、手机号、排序值 |
| 日期时间（固定格式） | `width="160"`~`width="170"` | 创建时间、更新时间（`YYYY-MM-DD HH:mm:ss`） |
| 纯日期 | `width="110"`~`width="120"` | 出生日期、申请日期 |
| 3~6 字中长文本 | `min-width="120"`~`min-width="160"` | 姓名、用户名、机构名 |
| 长文本（名称/标题/地址） | `min-width="180"`~`min-width="220"` + `:show-overflow-tooltip="true"` | 活动名称、详细地址、备注 |
| 操作列 | 用 `useActionColumnWidth` hook（见 [[pbsf-action-column-width]]） | 操作 |

### 默认模板写法

```vue
<el-table-column label="序号" width="55" type="index" align="center" />
<el-table-column label="状态" width="80" align="center">
  <template #default="{ row }">
    <pbsf-dict-tag :options="sys_normal_disable" :value="String(row.status)" />
  </template>
</el-table-column>
<el-table-column label="创建时间" prop="createTime" width="160" align="center" />
<el-table-column
  label="活动名称"
  prop="activityName"
  min-width="200"
  :show-overflow-tooltip="true"
  align="center"
/>
<el-table-column
  label="详细地址"
  prop="address"
  min-width="220"
  :show-overflow-tooltip="true"
  align="center"
/>
<!-- 操作列用 hook 自适应，不写死 width -->
<el-table-column label="操作" :width="actionColWidth" align="center" fixed="right">
  ...
</el-table-column>
```

**关键**：
- 定长列用 `width`（数字字符串），固定住不被压缩
- 可变文本列用 `min-width`，让它参与剩余空间分配、随容器伸缩
- 所有列默认 `align="center"`（项目规范，见 [[pbsf-list-page]]）

---

## 第 2 阶段：联调阶段 —— 按真实内容调整

接上真实数据后，**打开浏览器看实际渲染**（配合 [[pbsf-page-verify]]），按内容长度微调：

1. **某列大部分行被省略号截断** → 内容确实需要展示，适当加宽 `min-width`（+30~50 一档试）。
2. **某列内容很短、留白很多** → 缩窄 `min-width`，把空间让给真正需要的列。
3. **某列内容天然就很长（备注/描述/地址/长名称），再宽也装不下** → **不要无限加宽**，保持合理 `min-width` + `:show-overflow-tooltip="true"`，hover 看全文即可。这是**预期行为**，不是 bug。
4. **数字/日期列**用 `width` 锁死，别让它伸缩。
5. 整张表横向溢出严重 → 优先缩窄可变列的 `min-width` 或给长内容加 tooltip，而不是让用户横向滚半天。

**判断标准**：让 80~90% 的行在本列不出现省略号；剩下天然超长的行用 tooltip 兜底，不需要为了那 10% 把列拉到 400+。

---

## ⚠️ 第 3 条铁律：手动改过的列宽，AI 不得主动修改

这是**硬性约束**，优先级高于上面的"按表头/按内容估算"。

### 什么算"手动改过"

满足任一即视为用户手动调整过，**默认不动**：
- 列上有宽度标记注释（见下）
- 列宽是**非默认、非圆整**的值（如 `173`、`215`、`88`、`142`）——这种"奇怪"的数字几乎都是人在浏览器里拖列宽或反复微调出来的，不要自作主张规整成 `150`/`200`

### 标记约定（推荐用户用、AI 识别用）

手动微调过的列，在列上加注释，AI 见到标记**直接跳过、不碰 width/min-width**：

```vue
<el-table-column
  label="详细地址"
  prop="address"
  min-width="268" <!-- 手动微调宽度，AI 勿改 -->
  :show-overflow-tooltip="true"
  align="center"
/>
```

或上方的独立注释行：

```vue
<!-- width: 手动微调，AI 禁止修改，除非用户明确要求 -->
<el-table-column label="名称" prop="name" width="213" align="center" />
```

识别关键词：`手动`、`勿改`、`别改`、`manual`、`禁改`、`已调`。

### AI 的行为约束

| 场景 | AI 该怎么做 |
|---|---|
| 在该列表页改 bug / 加字段 / 调样式 | **只动要改的那一列**，其他列的 `width`/`min-width` **保持原值**，不要顺手"优化" |
| 看到非圆整的列宽（如 173） | 假定是手动调的，**不要规整**成 170/180/200 |
| 看到宽度标记注释 | 该列 `width`/`min-width` **完全不动**，连属性顺序都别动 |
| 用户说"调整列宽"/"优化表格" | 可以调；但调之前先问清是调全部还是某几列，仍要避开有标记的列 |
| 用户点名"把地址列加宽" | 只改地址列，其他列不动 |

**违反这条 = 违反"手术式修改"原则**（见全局 coding-style：只碰必须改的）。用户花时间在浏览器里微调的列宽，被 AI 一键"规整"回模板默认值，是纯负向操作。

---

## 自查清单

新建/改列表页时逐条对：

- [ ] 定长列（序号/状态/日期/操作）用了 `width`，不是 `min-width`
- [ ] 可变文本列（名称/地址/备注）用了 `min-width`，不是 `width`
- [ ] 内容天然很长的列加了 `:show-overflow-tooltip="true"`，没有为了显示全而把列拉到 300+
- [ ] 操作列用 `useActionColumnWidth` hook 自适应（见 [[pbsf-action-column-width]]），没有写死 `width="200"`
- [ ] 改现有列表页时，**未触碰任何手动调整过的列宽**（有标记的、非圆整值的列）
- [ ] 所有列 `align="center"`

---

## 完整示例

```vue
<template>
  <el-table ref="tableRef" v-loading="loading" border :data="tableList" :height="tableHeight" class="app-table">
    <el-table-column label="序号" width="55" type="index" align="center" />
    <el-table-column label="状态" width="80" align="center">
      <template #default="{ row }">
        <pbsf-dict-tag :options="sys_normal_disable" :value="String(row.status)" />
      </template>
    </el-table-column>
    <!-- 名称：可变文本，min-width + tooltip -->
    <el-table-column
      label="机构名称"
      prop="orgName"
      min-width="180"
      :show-overflow-tooltip="true"
      align="center"
    />
    <el-table-column label="联系电话" prop="phone" width="120" align="center" />
    <el-table-column label="创建时间" prop="createTime" width="160" align="center" />
    <!-- 地址：天然很长，min-width 给够但仍可能省略，tooltip 兜底，不要继续加宽 -->
    <el-table-column
      label="详细地址"
      prop="address"
      min-width="220"
      :show-overflow-tooltip="true"
      align="center"
    />
    <!-- 操作列：hook 自适应 -->
    <el-table-column label="操作" :width="actionColWidth" align="center" fixed="right">
      <template #default="{ row }">
        <pbsf-table-action :ref="setActionRef" :show-num="3">
          <pbsf-table-action-item @click="handleView(row)">查看</pbsf-table-action-item>
          <pbsf-table-action-item @click="handleEdit(row)">编辑</pbsf-table-action-item>
          <pbsf-table-action-item @click="handleDelete(row)">删除</pbsf-table-action-item>
        </pbsf-table-action>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import useTable from '@/hooks/useTable';
import useActionColumnWidth from '@/hooks/useActionColumnWidth';
import useDict from '@/hooks/useDict';

const { sys_normal_disable } = useDict('sys_normal_disable');
const { actionColWidth, setActionRef } = useActionColumnWidth();
// ...
</script>
```
