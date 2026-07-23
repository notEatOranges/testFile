# mp-weixin · tabBar 页后台数据变更、回前台不重绘（coverflow 空白）坑点

> **项目**：体e智慧助手（school-parent-mp）—— 校园体育家长端，班级/学生管理 + 孩子绑定/切换
> **技术栈**：uni-app (Vue 3 `<script setup>`) + Pinia + scss(rpx)
> **目标平台**：mp-weixin（AppID `wx7fc58b30e5ab6b21`）
> **构建方式**：HBuilderX 工程（无 uni CLI / 无 vite 脚本），发行 = HBuilderX「发行 → 小程序-微信」
> **整理日期**：2026-07-22
> **结论先行**：tabBar 页（kept-alive）切到后台期间，其依赖的 store 数据变了，**回到前台时 mp-weixin 不会自动把这次变更重绘到 DOM**，靠 `:style`/`v-if` 驱动的节点（如 3D coverflow）就空白/错乱，**手动点一下触发渲染才恢复**。数据层怎么调都救不了，根治办法是 **`onShow` 里检测到数据变了就用 `v-if` 开关一次（`false → nextTick → true`）强制销毁重建出问题的节点**。
>
> ⚠️ **易错点**：别用 `:key` 改值来「强制重挂」——**mp-weixin 的 `key` 只对 `v-for` 列表 diff 有效，挂在普通 `<view>` 上改值不会触发重挂**（这是本坑排查时踩的二次坑，详见文末「踩过的弯路」）。

---

## 坑点总览

| # | 坑点 | 严重度 | 触发环节 | 一句话结论 |
|---|---|---|---|---|
| 1 | tabBar 页后台变更回前台不重绘 | 🔴 P0 渲染 | 切 tab 来回 | onShow 检测数据变了 → `v-if` 开关强制重挂 |
| 2 | 用 `:key` 改值想强制重挂（无效） | 🟠 P1 弯路 | 想强制刷新时 | mp-weixin 普通 view 改 `:key` 不重挂，必须 `v-if` |
| 3 | 原生 `<radio :checked>` 在 radio-group 内回显不稳 | 🟠 P1 交互 | 多次切换 | 弃用原生 radio，自绘选中圈、纯响应式 class |
| 4 | 跨页孩子数据各拉各的、不同步 | 🟠 P1 架构 | 进页就 fetch | store 做全局单一数据源，进页只读、操作后刷新 |

> 本文主记 **坑 1**（及坑 2 这个排查弯路）；坑 3、坑 4 是同一功能（首页切换孩子 + 我的页 coverflow）联调时一并踩到的，附在文末「相关坑点」。

---

## 坑 1 🔴：tabBar 页后台数据变更，回到前台不自动重绘（coverflow 空白）

### 现象
- 在「我的」页（tabBar 页，kept-alive），切到「首页」切换当前绑定的孩子，再切回「我的」页：
  - 顶部 coverflow 轮播**不会更新视图**，显示一张**空白卡片**（卡片背景图还在，但姓名 / 学校 / 头像 /「当前孩子」标识等 `v-if`、`{{ }}` 内容全无）。
  - 必须**手动点一下左右切换卡片**（触发一次渲染），才恢复正常。
- 数据其实**已经更新**（store 是新的），纯粹是**视图没跟着重绘**。

### 导致什么结果
- 用户体验上「切了孩子回我的页居然是空的」，以为没切成功 / 程序崩了。
- 极隐蔽：在数据层反复调（store 同步、`watch`、`computed`、`storeToRefs`）都治标不治本——因为它**根本不是数据问题，是 mp-weixin 的渲染机制问题**。

### 根因（mp-weixin 渲染机制）
1. mp-weixin 的 tabBar 页面是 **kept-alive**：`uni.switchTab` 不销毁页面，切回来不重新创建、不重跑 `onLoad`/`setup`。
2. 当页面处于**后台**（hidden，切到了别的 tab）期间，其依赖的响应式数据（store）发生变化时，mp-weixin **不会立即把这次变更重绘到该后台页面的 DOM**（`setData` 被推迟/合并，且 `:style`（尤其含 `transform` 的复杂对象）/ `v-if` 这类绑定最不刷新）。
3. 页面**回到前台时，mp-weixin 也不会自动补刷**后台期间积压的变更 → DOM 停留在切走前的旧状态，与新数据脱节 → 空白 / 错乱。
4. 用户手动点切卡 → 改变了某个响应式值（`currentIndex`）→ **触发一次新的渲染** → 顺带把后台积压的变更一起刷新 → 恢复正常。

> 一句话：**数据是对的，但 mp-weixin 在「后台变更 + 回前台」这条路径上不保证重绘，得自己手动触发一次重挂。**
>
> 判据：**「点一下才恢复」** = 数据已经是新的，只差一次渲染 → 八成是本坑。

### 触发条件（同时满足）
1. tabBar 页面（kept-alive，靠 `switchTab` 切换）；
2. 页面**进入后台**（切到别的 tab）期间，其依赖的 store / 响应式数据发生变化；
3. 变化体现在**靠 `:style`（尤其含 `transform` 的复杂对象）/ `v-if` 驱动**的节点上（纯 `{{ text }}` 文本相对不容易中招）；
4. 切回该页面时（`onShow`）没有手动强制重挂。

### 怎么避免（标准写法）
**在该页面的 `onShow` 里，检测到数据变了就用 `v-if` 开关一次（`false → nextTick → true`）强制销毁重建出问题的节点**。`onShow` 是页面回到前台**那一刻**触发的，**此时渲染必定刷新**，不依赖后台那次没生效的更新。

```js
// ✅ 正确：onShow 检测到当前孩子/数量变化 → v-if false→true 强制重挂重绘
import { nextTick } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const coverflowVisible = ref(true);                                  // 出问题节点的显隐开关
const lastCurrentId = ref(studentStore.currentStudent?.studentId || '');
const lastCount = ref(studentStore.students.length);

onShow(() => {
  // ① 先按 store 对齐业务状态（watch 在后台可能没触发）
  currentIndex.value = studentStore.currentIndex;
  const curId = studentStore.currentStudent?.studentId || '';
  const count = studentStore.students.length;
  // ② 当前孩子或数量变了 → v-if 开关一次，强制 coverflow 销毁重建（必定重绘）
  if (curId !== lastCurrentId.value || count !== lastCount.value) {
    lastCurrentId.value = curId;
    lastCount.value = count;
    coverflowVisible.value = false;
    nextTick(() => {
      coverflowVisible.value = true;
    });
  }
});
```

```html
<!-- 出问题的节点绑 v-if（不是 :key）：false→true → 整组子树销毁重建 → 必定重绘 -->
<view class="coverflow" v-if="coverflowVisible">
  <view
    v-for="(child, ci) in children"
    :key="child.id"
    :style="coverItemStyle(ci)"
  >
    <view v-if="ci === centerIndex" class="ccard__body">...</view>
  </view>
</view>
```

要点：
- **用 `v-if` 开关强制重挂**（`false → nextTick → true`），别指望响应式自动刷新——对 `:style`/`v-if` 在后台页场景不可靠。
- **别用 `:key` 改值**想达到同样目的——mp-weixin 普通 view 上的 `:key` 改值**不会重挂**（见坑 2）。
- **只在数据真变了时才开关**（对比 `lastCurrentId` / `lastCount`），避免每次进页都重挂导致闪烁。
- **onShow 里先对齐业务状态**（如 `currentIndex`），再开关 `v-if`，保证重挂后用的是最新值。
- 开关的是**出问题那组节点**的 `v-if`，不是整个页面（缩小重挂范围，减少抖动）。

### 本项目已修复
- [`pages/mine/index.vue`](../../../Documents/oneSports/school-parent-mp/pages/mine/index.vue)：coverflow 容器加 `v-if="coverflowVisible"`，`onShow` 检测当前孩子 / 数量变化时 `false → nextTick → true` 强制重挂。
- 配套：`centerIndex` 计算属性把居中下标夹紧到 `[0, len-1]`，防列表缩短时 `currentIndex` 越界导致「整排卡 `opacity:0`」式空白（另一类空白成因，一并兜底）。
- 排查期临时加了 `console.log('[mine.onShow]', ...)` 在 `onShow` 里打印 `curId / lastId / count / changed / centerIndex`，用于确认 onShow 是否触发、条件是否命中、重挂后 `centerIndex` 是否正确。**确认修复后可删。**

### 如何诊断
- 现象判据：tabBar 页切走再切回，内容空白/错乱，**手动点一下就恢复** → 八成本坑。
- 排查清单：
  1. 出问题节点是否靠 `:style`（含 `transform`）/ `v-if` 驱动？
  2. 是否在 kept-alive 的 tabBar 页？
  3. 变更是否发生在该页**后台期间**（切到别的 tab 时被改的 store）？
  4. 该页 `onShow` 有没有强制重挂？
- 三项都中 → `v-if` 开关强制重挂。
- 拿不准时：在 `onShow` 里 `console.log` 打印上述变量，复现一次看日志，确认「onShow 跑了 / 条件命中 / 重挂后下标正确」。

---

## 坑 2 🟠：用 `:key` 改值想「强制重挂」—— 在 mp-weixin 无效（排查弯路）

### 是什么坑
排查坑 1 时，第一反应是「给出问题节点绑个 `:key`，数据变了就 `key++` 强制重挂」：

```html
<view class="coverflow" :key="coverflowKey">
```
```js
coverflowKey.value++;   // 以为这会强制 coverflow 重挂
```

### 为什么没用（根因）
- **mp-weixin 的 `key` 只对 `v-for` 列表 diff 有意义**（`wx:for` 的 `wx:key`，用于列表项复用/重排）。
- 把 `key` 挂在**普通 `<view>`**（非 `v-for` 项、非组件）上、然后改它的值，**mp-weixin 不会把它当「不同节点」销毁重建**——编译产物里这个 `key` 基本是摆设，改值不触发任何重挂。
- 所以 `coverflowKey++` 等于空操作，coverflow 纹丝不动，坑 1 原样还在。
- 这点跟 Web 端 Vue 不一样：Web 上 `<div :key="x">` 改 key 会替换节点；mp-weixin 不会。

### 正确做法
要强制销毁重建一个普通节点，**用 `v-if` 开关**（`false → nextTick → true`），这是 mp-weixin 核心机制，一定生效。详见坑 1 的标准写法。

> 记忆点：**mp-weixin 强制重挂 = `v-if` 开关，不是 `:key` 改值。**

---

## 踩过的弯路（排查血泪，别再重复）

坑 1 前后调了好几轮，全在数据层打转或用错机制，记录如下：

- ❌ 给 mine 加 `watch(store.currentStudent)` 更新 `currentIndex` —— 数据是对了，但**后台 watch 触发 ≠ DOM 重绘**，回前台照样空白。
- ❌ mine 的 `onShow` 里 `currentIndex.value = store.currentIndex` —— 若值没变不触发渲染；若后台 watch 已改过，同值赋值也不触发。
- ❌ 在 `onShow` 里 `await store.fetch()` 重新拉数据 —— 反而引入「接口调了、视图仍不更新」的二次坑（跨页异步 reactivity 更不稳）。
- ❌ `computed` / `storeToRefs` 换着用 —— 改变不了「后台变更回前台不重绘」这个渲染层问题。
- ❌ **`<view :key="coverflowKey">` + `coverflowKey++`** —— 以为强制重挂，实则 mp-weixin 普通 view 上 `:key` 改值不重挂（坑 2），完全无效。
- ✅ 最终：`onShow` 里 **`v-if` 开关（`false → nextTick → true`）强制重挂**，从渲染层根治。

> 教训：**「数据对了但视图没更新」在 mp-weixin 后台页场景下，别再死磕响应式，也别用 `:key` 改值——直接 `v-if` 开关强制重挂。**

---

## 通用建议（本项目开发守则）

1. **tabBar 页不要在 `onShow` 里无脑 `await fetch`**：跨页异步 reactivity 在 mp-weixin 不稳，容易「接口调了视图不更新」。改为**全局 store 单一数据源**：启动 / 登录 / 操作后刷新 store，页面只读 store。
2. **「数据对、视图不对」优先怀疑渲染层**：尤其 tabBar 页后台变更回前台场景，直接 `v-if` 开关强制重挂，别死磕响应式。
3. **强制重挂用 `v-if`，不要用 `:key` 改值**：mp-weixin 普通 view 上的 `:key` 改值不触发重挂（见坑 2）。
4. **`v-if` 开关要带条件**：对比上次渲染的标识（id / count），变了才开关，避免每次进页闪烁。
5. **居中/选中类下标要做夹紧**：列表可能动态增删，`currentIndex` 之类要用 `computed` 夹紧到合法区间，防越界导致整组节点 `opacity:0` 空白。
6. **原生表单控件回显不稳就自绘**：`<radio :checked>` 在 `<radio-group>` 内多次切换会丢回显，改用自绘选中圈 + 响应式 class 最稳。

---

## 相关坑点（同功能联调一并踩到）

### 坑 3 🟠：原生 `<radio :checked>` 在 radio-group 内回显不稳
- **现象**：切换孩子弹框里用 `<radio-group>` + `<radio :checked="...">`，多次打开/切换后单选**不再回显**当前绑定项。
- **根因**：mp-weixin 的 radio-group 会自己记一份选中态，交互几次后就不再理会绑定的 `:checked`；想用 `:key` 重挂也只是 band-aid（且 mp-weixin 普通 view 上 `:key` 本就不重挂）。
- **解法**：**弃用原生 radio**，自绘选中圈（圆环 + 实心圆点），选中态用 `:class` 的纯响应式绑定驱动，回显 100% 可靠。本项目 `pages/home/index.vue` 切换弹框已改。

### 坑 4 🟠：跨页孩子数据各拉各的、不同步
- **现象**：首页、我的页各自 `onShow` 调孩子列表接口，切孩子后另一页不及时更新；接口还重复调。
- **根因**：没有全局单一数据源，每页自己拉快照。
- **解法**：`store/student.js` 做全局单一数据源（`students` + `currentStudent`）：
  - **灌数据点**：启动 `authorize` 一次性 `GetInfo + fetch`；登录 `PhoneLogin` 已 `fetch`。
  - **刷新点**：切换（`setCurrent`）/ 绑定 / 解绑 / 设当前，**操作接口成功后调一次** `fetch` 更新 store。
  - **读数据点**：首页 / 我的页只读 store、不在 `onShow` 调接口（首页仅保留「已登录但列表为空」的兜底补拉）。

---

## 相关
- 项目通用坑点：`测试文件/AAAA项目坑点/体e智慧助手-uni-app微信小程序坑点总结.md`
- iOS fixed 兼容坑点：`测试文件/AAAA项目坑点/iOS-fixed定位兼容性坑点.md`
- 项目内 gotchas：`docs/gotchas/`
