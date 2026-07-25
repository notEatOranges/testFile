# pbsf-add-menu

通过浏览器菜单管理页面添加菜单。页面地址：`http://localhost:14396/base/system/menu/list`

## 核心规范（重要！）

**无论多少层级，「菜单(C)」都必须包在一层「目录(M)」下；按钮(F) 挂在菜单下。**

```
一级模块：  主类目 → 目录(M) → 菜单(C: 列表/编辑/详情) → 按钮(F)
二级模块：  主类目 → 一级目录(M) → 二级目录(M) → 菜单(C) → 按钮(F)
三级模块：  主类目 → 一级目录(M) → 二级目录(M) → 三级目录(M) → 菜单(C) → 按钮(F)
以此类推……
```

规则：
1. **目录(M)**：纯分组容器，不承载页面，**组件路径留空**
2. **菜单(C)**：承载页面（列表/编辑/详情），必须填组件路径，**必须挂在目录下**
3. **按钮(F)**：权限按钮（新增/修改/删除/导出等），挂在菜单下，**组件路径留空**
4. **同模块归拢**：同一个模块的列表/编辑/详情等菜单，**挂在同一个目录下**
5. **列表菜单名 = 文件名**：列表页菜单的「路由地址末段 = 组件路径末段 = Vue 文件名」（都用 `index`，或都用 `list`）

❌ 错误：主类目直接挂菜单(C)（缺目录层）
✅ 正确：主类目 → 目录(M) → 菜单(C)

## 完整示例：证书管理模块

文件结构：
```
packages/app-manage/views/certificateManage/
  index.vue      ← 列表页
  edit.vue       ← 编辑页（可选）
  detail.vue     ← 详情页（可选）
```

菜单结构（按规范）：
```
主类目
└─ 📁 目录(M) 证书管理          路由 certificateManage        排序 19   组件路径(空)
   ├─ 📄 菜单(C) 证书管理        路由 index                    组件 app-manage/views/certificateManage/index   显示
   │   ├─ 🔘 按钮(F) 新增备案机构  权限 app-manage:certificateManage:add
   │   ├─ 🔘 按钮(F) 生成电子证书  权限 app-manage:certificateManage:generate
   │   ├─ 🔘 按钮(F) 查看详情      权限 app-manage:certificateManage:view
   │   └─ 🔘 按钮(F) 删除         权限 app-manage:certificateManage:delete
   ├─ 📄 菜单(C) 证书编辑        路由 edit                    组件 app-manage/views/certificateManage/edit     隐藏
   └─ 📄 菜单(C) 证书详情        路由 detail                  组件 app-manage/views/certificateManage/detail   隐藏
```

要点：
- 列表菜单「路由地址 = `index`」，对应文件 `index.vue`（**菜单名与文件名一致**）
- 编辑页/详情页菜单设「显示状态 = 隐藏」（不在侧边栏显示，通过路由跳转访问）
- 按钮挂在列表菜单下，权限标识格式 `app-manage:{模块}:{动作}`

## 菜单类型与字段对照

| 字段 | 目录(M) | 菜单(C) | 按钮(F) |
|------|---------|---------|---------|
| 上级菜单 | ✅ | ✅ | ✅ |
| 菜单类型 | 目录 | 菜单 | 按钮 |
| 菜单名称 | ✅ 必填 | ✅ 必填 | ✅ 必填 |
| 显示排序 | ✅ 必填 | ✅ 必填 | ✅ 必填 |
| 路由地址 | ✅ 必填 | ✅ 必填 | ❌ |
| **组件路径** | ❌ **留空** | ✅ 必填 | ❌ **留空** |
| 权限字符 | ❌ | ✅ 建议 | ✅ 必填 |
| 是否外链 | ✅ 默认否 | ✅ 默认否 | ❌ |
| 是否缓存 | ❌ | ✅ 默认缓存 | ❌ |
| 显示状态 | ✅ 默认显示 | ✅（编辑/详情页选「隐藏」）| ❌ |

## 操作步骤

### 1. 打开菜单管理页

```
http://localhost:14396/base/system/menu/list
```

### 2. 添加目录(M)

点顶部「新增」按钮：

| 字段 | 填写 |
|------|------|
| 上级菜单 | 主类目（或更高层目录） |
| 菜单类型 | 目录 |
| 菜单名称 | 中文（如「证书管理」） |
| 显示排序 | 数字 |
| 路由地址 | camelCase（如 `certificateManage`） |
| 组件路径 | **留空** |

### 3. 在目录下添加菜单(C)

在刚创建的目录所在行，点该行的「新增」按钮（弹窗会自动把上级菜单设为该目录）：

| 字段 | 填写 |
|------|------|
| 上级菜单 | 上一步的目录（如「证书管理」） |
| 菜单类型 | 菜单 |
| 菜单名称 | 列表页用模块中文名（如「证书管理」）；编辑/详情页加后缀 |
| 显示排序 | 数字 |
| 路由地址 | 列表用 `index`，编辑用 `edit`，详情用 `detail`（**与文件名一致**） |
| 组件路径 | `app-manage/views/{模块}/{路由地址}`，如 `app-manage/views/certificateManage/index` |
| 权限字符 | `app-manage:{模块}:{动作}`，如 `app-manage:certificateManage:index` |
| 显示状态 | 列表页「显示」；编辑/详情页「隐藏」 |

### 4. 在菜单下添加按钮(F)

在列表菜单所在行，点该行的「新增」按钮（上级菜单自动设为该菜单）：

| 字段 | 填写 |
|------|------|
| 上级菜单 | 列表菜单（如「证书管理」） |
| 菜单类型 | 按钮 |
| 菜单名称 | 中文（如「新增备案机构」） |
| 显示排序 | 数字 |
| 权限字符 | `app-manage:{模块}:{动作}`，如 `app-manage:certificateManage:add` |

### 5. 提交

点「确定」。添加完目录/菜单后，子项的「上级菜单」下拉框要重新打开弹窗才能看到新创建的父级。

## 组件路径命名规则

格式：`{package}/views/{模块目录}/{页面文件名}`

| package 前缀 | 对应物理目录 | 用途 |
|---------|---------|------|
| `app-base` | `packages/app-base` | 系统管理（角色/用户/菜单/字典/部门） |
| `app-manage` | `packages/app-manage` | 管理模块（机构/证书/审核等） |
| `app-declare` | `packages/app-declare` | 申报模块 |
| `app-twrh` | `packages/app-twrh` | TWRH 模块 |

规则：
1. **必须以 package 开头**（如 `app-manage/views/...`）
2. **不加 `.vue` 后缀**（路由自动匹配）
3. **末段 = Vue 文件名**（`index` / `edit` / `detail` / `list`），与路由地址末段保持一致
4. 目录名用 camelCase

映射原理（`src/store/modules/permission.js` 的 `loadView`）：
```js
const dir = path.split('packages/')[1].split('.vue')[0];
// 组件路径 'app-manage/views/certificateManage/index'
// 对应文件 packages/app-manage/views/certificateManage/index.vue
```

## 常见错误

| 错误 | 正确 |
|------|------|
| 主类目直接挂菜单(C)，缺目录层 | 必须先建目录(M)，菜单挂目录下 |
| 组件路径写 `certificateManage/index`（漏 package） | `app-manage/views/certificateManage/index` |
| 组件路径带 `.vue` 后缀 | 不加后缀 |
| 菜单类型忘记切换（默认「目录」） | 菜单/按钮要手动切换类型 |
| 路由地址用中文或下划线 | 用 camelCase |
| 列表菜单路由用 `certificateManage` 但文件是 `index.vue` | 路由末段与文件名一致：`index` |
| 目录填了组件路径 | 目录(M) 组件路径必须留空 |
| 编辑/详情页菜单设为「显示」 | 设为「隐藏」，避免污染侧边栏 |
| 按钮(F) 填了路由地址/组件路径 | 按钮只填菜单名称 + 权限字符 |

## 对应的文件结构

一个完整模块的文件 + 菜单对照：
```
packages/app-manage/views/certificateManage/
  index.vue       ← 列表页  → 菜单(C)「证书管理」(显示)
  edit.vue        ← 编辑页  → 菜单(C)「证书编辑」(隐藏)
  detail.vue      ← 详情页  → 菜单(C)「证书详情」(隐藏)
  components/
    addDialog.vue        ← 新增/编辑弹窗（不单独配菜单）
    detailDialog.vue     ← 详情弹窗（不单独配菜单）
```

对应 API 文件：
```
packages/app-manage/api/certificateManage.js
```
