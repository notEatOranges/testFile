---
name: pbsf-api-file
description: PBSF 项目 API 接口文件生成规范。当需要新建 CRUD 接口文件、写 api 文件、生成后端接口调用、新增模块的接口层时使用。生成符合 pbsf 项目约定的 apiService 调用文件(分页查询、新增、修改、删除、详情、导出等)。
---

# pbsf-api-file

Generate an API file following pbsf project conventions.

## Usage

```bash
/skill pbsf-api-file "场馆监控点" "venueManage/venueMonitorPointManage"
```

## Template Output

```javascript
import { apiService } from '@/utils/request';

// 分页查询
export async function pageList(data) {
  return apiService({
    url: '/api/endpoint/page',
    method: 'post',
    data,
  });
}

// 获取列表（下拉框用）
export async function getList(data) {
  return apiService({
    url: '/api/endpoint/list',
    method: 'post',
    data,
  });
}

// 获取详情
export async function getById(id) {
  return apiService({
    url: `/api/endpoint/getById/${id}`,
    method: 'get',
  });
}

// 新增
export async function add(data) {
  return apiService({
    url: '/api/endpoint/save',
    method: 'post',
    data,
  });
}

// 更新
export async function update(data) {
  return apiService({
    url: '/api/endpoint/update',
    method: 'post',
    data,
  });
}

// 删除
export async function deleteById(id) {
  return apiService({
    url: `/api/endpoint/delete/${id}`,
    method: 'get',
  });
}
```

## Key Points

1. Import `apiService` from `@/utils/request`
2. File location: `packages/app-bs-manage/api/moduleName/featureName.js`
3. Common functions: `pageList`, `getList`, `getById`, `add`, `update`, `deleteById`
4. Use POST for `pageList`, `getList`, `add`, `update`
5. Use GET or POST for `getById` and `deleteById` (check API docs)
6. GET pattern: `/api/endpoint/getById/${id}` or `/api/endpoint/delete/${id}`
7. POST pattern: pass `{ id }` or `{ id: row.id }` as data
