---
name: page-data-mock
description: 新建页面/功能时的数据接入规范——禁止在页面里写死假数据，必须走 apis/ 函数封装，未联调时函数体返回 mock（结构与 request 解包一致），联调只换函数体、页面零改动。写新页面、加列表/详情/表单回显、对接新接口前用。
---

# 新页面数据：mock 优先，禁止页面写死假数据

## 核心规则（铁律）

**页面的数据来源必须是 `apis/` 里导出的函数**，绝不允许在 `<script setup>` 里写死假数据数组/对象当渲染源。

❌ 禁止（页面写死，联调时要满页面找着改）：
```vue
<script setup>
const list = ref([
  { id: 1, name: '张三', score: 90 },   // 假数据散在页面里
  { id: 2, name: '李四', score: 85 },
]);
</script>
```

✅ 正确（数据来自 `apis/` 函数，联调只动 apis、页面不动）：
```vue
<script setup>
import { getStudentScores } from '@/apis/student';
const list = ref([]);
const loadList = async () => {
  const res = await getStudentScores();   // 联调前后签名一致
  list.value = res.data;
};
loadList();
</script>
```

## 落地方式：apis/ 函数体承载 mock

未联调时，**在 `apis/xxx.js` 的函数体里返回 mock**，返回结构必须与 [common/request.js](../../../common/request.js) 解包后的真实结构一致（即 `{ code, data, msg }`，数据在 `data` 字段）。这样联调时只换函数体，页面解构代码一行不改。

### 数据量小：mock 内联在 apis 文件

```js
// apis/student.js —— 联调前
import request from '@/common/request';

// TODO【联调】把函数体换成真实 request，删除 MOCK_*
const MOCK_SCORES = [
  { id: 1, name: '张三', score: 90 },
  { id: 2, name: '李四', score: 85 },
];

// 学生成绩列表（参数/返回结构需与后端约定保持一致）
// 返回：{ code, data: [{ id, name, score }] }
export const getStudentScores = () =>
  Promise.resolve({ code: 200, data: MOCK_SCORES });

// 联调后（仅替换函数体，签名不变）：
// export const getStudentScores = () =>
//   request({ url: '/school-sport/api/student/scores', method: 'GET' });
```

### 数据量大：mock 抽到独立文件

mock 数据超过 ~30 行或有多接口复用时，抽到 `apis/xxx.mock.js`，保持 `apis/xxx.js` 干净：
```js
// apis/student.mock.js
export const MOCK_SCORES = [/* ...大段数据... */];
```
```js
// apis/student.js
import request from '@/common/request';
import { MOCK_SCORES } from './student.mock';

export const getStudentScores = () =>
  Promise.resolve({ code: 200, data: MOCK_SCORES });
```

## 硬规则

1. **页面零写死**：列表、详情、下拉选项、表单回显、统计数字……凡渲染用到的数据，一律来自 `apis/` 函数，禁止 `ref([...假数据])` / `const info = { ...假对象 }`。
2. **签名对齐**：mock 函数的**参数**和**返回结构**从一开始就按后端约定写（字段名、嵌套、分页 `{ total, pageNum, pageSize, list }` 等）。参考 [apis/sportTask.js](../../../apis/sportTask.js) 每个函数顶部的注释格式（参数说明 + 返回结构）。
3. **返回结构对齐 request**：mock 返回 `{ code: 200, data: ... }`；分页则 `{ code: 200, data: { total, list } }`。不要返回裸数组，否则联调换 `request` 后页面解构要改。
4. **联调只改 apis**：切真接口 = 把函数体从 `Promise.resolve(...)` 换成 `request(...)`，页面 `<script setup>` 不动。改完删 `MOCK_*` 和 `TODO【联调】` 标记。
5. **新接口先建 apis 函数再写页面**：哪怕后端没出，也先在 `apis/` 占好位（函数体给 mock），页面基于它写。不要"先页面跑通再补接口"。
6. **复用 hooks**：同一份数据多个页面用、或带字典/缓存逻辑时，封装到 [hooks/](../../../hooks/)（参考 [hooks/useDict.js](../../../hooks/useDict.js)），内部仍调 `apis/`。

## 何时该真正写死（例外）

纯前端常量**不是假数据**，可以写死，不强制走 mock：
- 不会随账号/后端变化的固定枚举：tab 标签、状态映射、本地筛选项、协议条款文案。
- 这类放页面或抽到 `constants/` 即可，区分标准是"后端会不会返回"。

## 不适用

子包 [subpackages/geling/](../../../subpackages/geling/) 是第三方原生小程序，自带 [subpackages/geling/services/mock/](../../../subpackages/geling/services/mock/) 的 mock 体系，**不套用本规范**。主包新页面才适用。

## 参考
- 接口写法范本：[apis/sportTask.js](../../../apis/sportTask.js)（注释格式、参数/返回结构说明）
- request 解包结构：[common/request.js](../../../common/request.js)（成功判定 `code===200||code===0`）
- hooks 封装范本：[hooks/useDict.js](../../../hooks/useDict.js)
- CLAUDE.md 约定：API endpoints go in `apis/`；状态在 Pinia stores；副作用 gate 在 `hooks/`
