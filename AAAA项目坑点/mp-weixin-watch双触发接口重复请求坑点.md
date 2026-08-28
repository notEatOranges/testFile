# mp-weixin · `watch` 进页面时双触发导致「同一接口查两遍」坑点

> **项目**：翼动同行（school-parent-mp）—— 校园体育家长端，体测报告
> **技术栈**：uni-app (Vue 3 `<script setup>`) + scss(rpx)
> **目标平台**：mp-weixin（AppID `wxbb6aae22a430cde4`）
> **构建方式**：HBuilderX 工程（无 uni CLI / 无 vite 脚本）
> **整理日期**：2026-07-30
> **结论先行**：页面用一个 `watch(ref, cb)` 来响应「下拉选中值变化 → 重新拉数据」。进页面时在 `onLoad`/异步里**给 ref 赋一次默认值**（如 `semester.value = list[0].id`），cb 里发请求。源码里请求只有一处调用、ref 只赋值一次，**理应只查一次**；但 mp-weixin 运行时在这种「页面初始化阶段的 programmatic ref 赋值」场景下，**watch cb 会被触发两次**，于是同一个孩子同一份参数，接口被查两遍（雷达图、综合对比、单项下拉一起翻倍）。
>
> ⚠️ **一句话规则**：**根治办法是别拿 `watch` 当请求触发器**——「下拉默认值 / 用户切换」都改成**显式调用**请求函数（`:value`+`@change`，不用 `v-model`+`watch`），没有 watch 就没有双触发。若非要用 watch，再用**入参指纹去重**（`if (key === lastKey) return;`）兜底；**in-flight 重入锁无效**（二次触发延迟到首次请求返回后才到，锁已复位）。

---

## 现象

体测报告页（进页面 / 切学年都会复现）：

1. 进页面，`onLoad` 读路由参数 → `fetchYears()` → 异步拿到学期列表 → `semester.value = list[0].semesterId`（赋一次默认值）。
2. `watch(semester, () => { fetchReport(); fetchTrendAll(); })` 被这个赋值触发。
3. 网络面板里 `trend/radar`、`trend/overall`、`trend/items`、`fitness/report` **每个都出现两次**，参数（eduId / semesterId）完全相同。
4. 用户只看一个孩子的雷达图，却查了两次，徒增请求、浪费流量、偶发竞态。

## 导致什么结果

- 同一份入参重复请求，后端被无谓打两次；图表数据靠最后一次 resolve 的结果（多数情况下两次返回一致，故「功能正常」但请求翻倍，极具迷惑性）。
- 隐蔽性极高：源码、编译产物里请求**都只有一处调用点**，肉眼 review 代码完全看不出来「为什么会查两次」，容易把排查方向带偏到「是不是点了两次 / 是不是 v-model 双向回写 / 是不是构建没更新」。

## 根因（mp-weixin watch 桥接双触发）

1. 源码层面是干净的：`getTrendRadar` 全文只出现 1 次（在 `fetchTrendAll` 里），`fetchTrendAll` 只被 `watch(semester)` 调用，`semester` 只在 `fetchYears` 里赋值 1 次。**读源码 / 读 `unpackage/dist/dev/mp-weixin/.../index.js` 编译产物，都只能找到一个调用点。**
2. 因此「查两次」只能是 `watch(semester)` 的 cb **被执行了两次**。根因是 **uni-app 把 Vue3 编译到 mp-weixin 时的响应式 polyfill + 小程序双线程通信**：逻辑层对 ref 的一次赋值（`semester.value = x`），要 `setData` 同步到视图层，这个跨线程同步过程里 ref 的 setter 会被触发不止一次，于是依赖该 ref 的 watch cb 被调用多次。这是 uni-app 平台层的已知行为（非个例，社区有同样反馈），**不是业务代码的逻辑错误**。
3. 已逐一排除的干扰项：① watch 未开 `immediate`（不会因初始化额外触发）；② `semester` 全文只被赋值一次（`fetchYears` 里，且有 `!semester.value` 守卫，即便 `onLoad`/`fetchYears` 跑两次也只会赋值一次）；③ CSelect（`v-model` 子组件）不会在 prop 变化时回 `emit`，只在 `onPick` 里 `emit`（编译产物可证），故无 v-model 回写；④ 编译产物里 `getTrendRadar` 只有一个调用点。排除完，只剩「watch cb 被平台运行时调了两次」。
4. 注意区分：这不是「v-model 回写」、不是「onLoad 执行两次」、不是「构建没更新」、不是「点了两次」——编译产物已证实单调用点 + 单次赋值。**就是双线程响应式同步导致 watch cb 跑了两次。**

### 出问题的时序（以本项目为例）

```
onLoad:
  eduId = sid
  fetchYears()
      └─ await getReportYears()
      └─ semester.value = list[0].semesterId   // ① 赋一次默认值
              └─ 触发 watch(semester) cb（第 1 次）→ fetchTrendAll() → radar 请求 #1
              └─ 触发 watch(semester) cb（第 2 次）→ fetchTrendAll() → radar 请求 #2  ❌
```

两次 cb 都带着相同的 `eduId + semesterId`，于是雷达图查了两遍。

## 怎么避免

### ✅ 根治写法（首选）：别用 watch 当请求触发器，改显式调用

双触发有害的前提是「ref 变 → watch → 发请求」。把这条链拆掉，回写再怎么折腾也点不着请求：

- 模板：`<CSelect v-model="x">` 改成 `<CSelect :model-value="x" @change="onChange">`（单向绑定 + 用户切换事件，不用 v-model+watch）。
- 默认加载：异步拿到列表、设完默认值后，**显式调**请求函数。
- 用户切换：`onChange(val){ if(val===x.value)return; x.value=val; fetch(); }`（`val===x.value` 的判断对齐原 watch「值不变不触发」的语义）。
- **删掉** `watch(x, ...)`。

```js
// 默认加载（onLoad 链路里）
async function fetchYears() {
  // ...
  if (list.length && !semester.value) {
    semester.value = list[0].semesterId;
    fetchReport();    // 显式
    fetchTrendAll();  // 显式
  }
}
// 用户切换（@change）
function onSemesterChange(val) {
  if (val === semester.value) return;
  semester.value = val;
  fetchReport();
  fetchTrendAll();
}
// 没有 watch(semester) —— 回写无处触发请求
```

嵌套场景（fetchA 里设另一个 ref 又要触发 fetchB）同理：fetchA 里设完那个 ref 后**显式调** fetchB，别用 watch 串。本项目的 `fetchTrendAll` 设默认 `trendProject` 后显式调 `fetchTrendItem`、TrendTab 单项 `@update:project` 显式调 `fetchTrendItem`，就是这套路。

> 优点：从根上没有双触发；调用时机肉眼可见。代价：触发点要写两遍（默认加载 + 用户切换），`v-model` 改 `:value`+`@change`。

### 兜底写法（非要用 watch 时）：入参指纹去重

**核心：同一份入参在本页面实例内只查一次。** 不依赖 watch「只触发一次」的假设，也**不依赖两次触发挨得近**。

```js
// ✅ 入参指纹去重：同 eduId+semesterId 不重查（二次触发进来说明 key 没变 → return）
let lastTrendKey = '';
async function fetchTrendAll() {
  if (!eduId.value) return;
  if (!semester.value && semester.value !== 0) return;
  const key = String(eduId.value) + '|' + String(semester.value);
  if (key === lastTrendKey) return;   // ← 二次触发（同参）在这里被挡掉
  lastTrendKey = key;
  try {
    const [radarRes, overallRes, itemsRes] = await Promise.all([
      getTrendRadar({ eduId: eduId.value, semesterId: semester.value }),
      getTrendOverall({ eduId: eduId.value }),
      getTrendItems({ eduId: eduId.value }),
    ]);
    // ...赋值
  } catch (e) {
    /* request.js 已 toast */
  }
}

watch(semester, () => {
  fetchReport();    // fetchReport 同样按 schoolId+eduId+semesterId 做指纹去重
  fetchTrendAll();
});
watch(trendProject, () => fetchTrendItem()); // fetchTrendItem 按 eduId+itemCode 做指纹去重
```

要点：

1. **指纹 = 全部入参拼字符串**（`String()` 化，避免 `48` vs `"48"` 被当成不同入参——双线程回写常带类型差）。key 相同 → 直接 return。
2. **指纹变量放 `<script setup>` 顶层（setup 作用域）**，每个页面实例一份（进页面新实例 → 自动重置为 `''`）。**不要放模块作用域**，否则跨页面进出残留脏指纹。
3. **同一个 watch cb 里发多个请求，各自一个指纹变量**（`lastReportKey` / `lastTrendKey` / `lastItemKey`），别共用。
4. **切值能正常重查**：用户手切学期 `48→47`，key 变了 → 查；再切回 `48`，key 又不同于「最近一次」`47` → 仍查。只有「连续同参」（即回写二次触发）才被去重。

### ❌ 不要用 in-flight 重入锁（`let fetching = false; finally{fetching=false}`）

这是**最容易踩的弯路**——笔者第一反应就是加 in-flight 锁，**实测无效**。原因：mp-weixin 的二次触发**不是同步紧跟的**，而是 `setData` 跨线程回写造成的**延迟二次触发**，它落在「首次请求已经返回、`finally` 已把锁复位」之后才到 → 锁早已是 `false` → 第二次照样发。**只有当两次触发在同一 tick 才 in-flight 锁有效；本坑的二次触发是延迟的，所以必须用入参指纹去重。**

### 其它不推荐的写法

- **「跳过首次触发」的 flag（`if (first){first=false;return;}`）**：第 1 次 cb 置反 return、第 2 次 cb 已是「非首次」照样发，**等于没挡**。
- **debounce 包 watch cb**：leading-edge 能压一次，但给后续「用户手切学期」引入冷却窗口，语义也不如指纹直白。

## 诊断方法

1. **网络面板判据**：进页面（或切下拉）时同一接口、**同一参数**出现两次（`eduId`、`semesterId` 都相同）→ 本坑。注意和「两次不同 `eduId`」区分——后者是两次独立访问在面板累积（不是 bug），前者才是双触发。
2. **代码判据**：grep 请求函数的调用点，确认**全文只有一处**（在本项目是 `watch(semester)` / `watch(trendProject)` 里）。若只有一处却查两次 → watch 双触发。
3. **编译产物判据**：打开 `unpackage/dist/dev/mp-weixin/<page>/index.js`，grep 接口函数名 / URL，确认调用点唯一（uni-app dev 产物不混淆名字，可读）。唯一调用点 + 运行时两次 = watch 双触发实锤。
4. **验证修复**：给请求函数加入参指纹去重，重新编译，网络面板确认每个接口同参只出现一次。
5. **区分 in-flight 锁是否够用**：若两次触发紧贴（同 tick）→ in-flight 锁也行；若两次触发中间夹了别的请求/有一次 `setData` 往返 → in-flight 锁失效，必须用指纹去重。本坑属于后者。

## 本项目实例

- **文件**：`packageMine/test-report/index.vue`（体测报告页）
- **出问题的链路**：`onLoad → fetchYears → semester.value = list[0].semesterId → watch(semester) → fetchReport + fetchTrendAll`；`fetchTrendAll` 内又 `trendProject.value = itemOptions[0].itemCode → watch(trendProject) → fetchTrendItem`。两个 watch 都受双线程回写影响双触发，导致 `fitness/report`、`trend/radar`、`trend/overall`、`trend/items`、`trend/item` 各查两遍（网络面板实测 radar、item 各两次，同 `eduId` 同 `semesterId`/`itemCode`）。
- **走过的弯路**：① 先加 in-flight 重入锁（`trendFetching`/`reportFetching`），实测**仍查两遍**——二次触发延迟到首次请求返回后才到，锁已复位；② 改入参指纹去重（`lastReportKey`/`lastTrendKey`/`lastItemKey`）能挡住，但属于下游打补丁。
- **最终修复（根治）**：**删掉两个 watch**，改显式调用——`fetchYears` 设默认学期后显式调 `fetchReport + fetchTrendAll`；`fetchTrendAll` 设默认单项后显式调 `fetchTrendItem`；CSelect 改 `:model-value + @change="onSemesterChange"`、TrendTab 改 `:project + @update:project="onProjectChange"`，两个 handler 里显式发请求（带 `val===x.value` 同值判断对齐原 watch 语义）。没有 watch，双触发从根上不存在，指纹去重也一并撤掉。
- **误区**：排查中一度怀疑「eduId 变了 / 切了两次 / 构建没更新」，但 `eduId` 全文只在 `onLoad` 赋值一次、CSelect 只 emit 一次、编译产物单调用点——最终靠「编译产物调用点唯一」锁定为 watch 双触发。

## 通用建议（守则）

1. **mp-weixin 里别相信「一次 ref 赋值 = 一次 watch cb」**，尤其在页面初始化阶段（onLoad / 异步里给 ref 设默认值）。
2. **watch cb 里发的请求，一律做成重入安全**（in-flight 锁），从行为上保证「同一份入参只查一次」。
3. **锁放 setup 作用域**（每实例一份），`finally` 复位；**不要碰 loading/toast**（见 [[mp-weixin-showLoading关掉showToast坑点]]）。
4. **同一 cb 里多个请求各用各的锁**。
5. **诊断先看编译产物调用点是否唯一**：唯一调用点 + 运行时多次 = watch/effect 双触发，方向直接锁死，省得乱猜。

## 相关

- 同项目交互层坑点：`mp-weixin-showLoading关掉showToast坑点.md`（重入锁的 `finally` 不能调 `hideLoading`）
- 同项目图表层坑点：`mp-weixin-lime-echart必须放static目录坑点.md`
- 项目内 gotchas：`docs/gotchas/`
