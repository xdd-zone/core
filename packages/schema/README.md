# @xdd-zone/schema

`@xdd-zone/schema` 是 XDD Zone Core 的唯一契约源。

它统一维护：

- 请求 schema
- 领域对象 schema
- HTTP 成功响应 schema
- 统一错误 schema

当前协议约定：

- 成功响应直接返回业务数据
- 错误响应使用统一错误结构
- 分页结构统一为 `{ items, total, page, pageSize, totalPages }`

## 目录结构

```text
src/
├── shared/
│   ├── primitives/
│   ├── models/
│   └── utils/
├── domains/
│   ├── auth/
│   ├── user/
│   └── rbac/
├── contracts/
│   ├── auth/
│   ├── user/
│   └── rbac/
├── adapters/
│   ├── client/
│   └── elysia/
```

## 设计边界

### `domains/*`

表达领域对象，不绑定具体 HTTP 场景。

### `contracts/*`

表达：

- body / query / params
- HTTP 成功返回结构

### `shared/*`

跨模块通用模型与工具：

- `ApiErrorSchema`
- `createPaginatedListSchema(...)`
- query coercion helper

### `adapters/*`

连接 schema 与运行时：

- client 侧响应 parse
- Elysia 侧 schema 适配

## 常用导入

```ts
import { AuthSessionSchema, SessionSchema } from '@xdd-zone/schema/contracts/auth'
import { UserListSchema, UserListQuerySchema, UserSchema } from '@xdd-zone/schema/contracts/user'
import { RoleListSchema, CurrentUserPermissionsSchema } from '@xdd-zone/schema/contracts/rbac'
import { ApiErrorSchema } from '@xdd-zone/schema/shared'
```

## 分页结构

统一分页 schema：

```ts
createPaginatedListSchema(UserSchema)
```

输出：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20,
  "totalPages": 0
}
```

## 服务端使用

```ts
detail: apiDetail({
  summary: '获取用户列表',
  response: UserListSchema,
  errors: [400, 401, 403],
})
```

## client 使用

```ts
return request('GET', `user/${id}`, {
  responseSchema: UserSchema,
})
```

删除或无 body 接口使用 `204 No Content`，不需要 success schema。

## 子路径导出

- `@xdd-zone/schema/shared`
- `@xdd-zone/schema/domains`
- `@xdd-zone/schema/domains/auth`
- `@xdd-zone/schema/domains/user`
- `@xdd-zone/schema/domains/rbac`
- `@xdd-zone/schema/contracts`
- `@xdd-zone/schema/contracts/auth`
- `@xdd-zone/schema/contracts/user`
- `@xdd-zone/schema/contracts/rbac`
- `@xdd-zone/schema/adapters`
- `@xdd-zone/schema/adapters/client`
- `@xdd-zone/schema/adapters/elysia`
