# Vue3 usePageMixin 列表查询 Object.assign(ref, reactive) 致查询条件全丢 坑点

## 现象
列表页输入搜索条件点查询，请求体只有分页 `{"currPage":1,"size":10}`，**查询条件全部没传**，结果总是全量。控制台不报错，很隐蔽。

## 根本原因
usePageMixin / useSearch 返回的 `searchData` 是 **ref**（`ref({...})`），`queryTableData` 用 `searchData.value` 拼请求体。但页面常见写法：
```js
const { searchData: mixinSearchData } = usePageMixin({...})
const searchData = reactive({...})
Object.assign(mixinSearchData, searchData)   // ← 坑
```
- `Object.assign(ref, obj)` 把字段加到 **ref 对象本身**（`mixinSearchData.xxx`），**不改 `.value`**。
- SearchBar 的 `v-model` 绑的是页面自建的 `searchData`（reactive），和 mixin 的 ref 是两个对象，`Object.assign` 只在初始复制了一次后断开。
- 结果：用户输入只改自建 reactive，mixin 的 `ref.value` 永远是空 → `queryTableData` 拼请求时条件全丢。

## 通用规则（红线）
- 用 usePageMixin 时，**直接解构用它的 `searchData`（ref）**，`v-model` 绑它（Vue template 自动解包 `.value`），**不要自建 reactive 再 Object.assign**。
- setup 里读写 searchData 要用 `.value`（template 里不用，自动解包）。
- 凡是见到 `Object.assign(mixinSearchData, ...)` 或解构时 `searchData: mixinSearchData` 别名 + 自建 reactive，就是此坑。

## 修复模板
```js
// ❌ 错误
const { searchData: mixinSearchData } = usePageMixin({...})
const searchData = reactive({...})
Object.assign(mixinSearchData, searchData)

// ✅ 正确
const { searchData } = usePageMixin({...})
// template: v-model="searchData.xxx"（自动解包）
// setup  : searchData.value.xxx
```

## 排查步骤
1. 列表查询抓包，看请求 body 有没有搜索字段（只有 currPage/size 即此坑）。
2. 全局搜 `Object.assign(mixinSearchData` / `searchData: mixinSearchData`。
3. 改为直接解构 `searchData`，删自建 reactive + Object.assign；setup 内 `searchData.` → `searchData.value.`（注意传整个对象的地方如 `export(api, searchData)` 也要 `searchData.value`）。

## 本项目实例
- 项目：**青少年智能培训管理系统 (Qsntypx-q)**（Vue3 + Element Plus）
- useSearch：`src/composables/useSearch.js`（`searchData = ref`，queryTableData 用 `.value`）。
- 中招文件（5 个）：`train-manage/index.vue`、`project-manage/index.vue`、`course-manage/index.vue`、`class-manage/allocation/index.vue`、`class-manage/project-grouping/components/removeDialog.vue`。
- 验证：train-manage 改后抓包，请求体 `{"currPage":1,"seasonName":"周末","size":10}`，条件正确传递、结果正确过滤（修复前是 `{"currPage":1,"size":10}`）。
- 注意：连 skills 文档（`component-search-bar.md`、`list-page-pattern.md`）都把这个错误模式当标准教，需同步修正文档。
- 关联坑点：[[前端表单-展开提交多传字段污染DTO须白名单对齐坑点]]（同为 ref/reactive 与提交数据脱节类问题）。
