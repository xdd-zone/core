# @xdd-zone/schema

基于 Standard Schema 规范的 TypeScript 类型定义包。

## 概述

本包提供 XDD Zone 系统的核心类型定义，采用 [Standard Schema](https://github.com/standard-schema/standard-schema) 规范实现。

## 特性

- **Standard Schema 规范**: 符合 Standard Schema v1 规范
- **无运行时依赖**: 仅导出 TypeScript 类型，不包含运行时验证逻辑
- **类型安全**: 完整的 TypeScript 类型推断支持

## 安装

```bash
bun add @xdd-zone/schema
```

## 模块结构

```
src/
├── auth/           # 认证相关类型
│   └── auth.schema.ts
├── user/           # 用户相关类型
│   └── user.schema.ts
├── rbac/           # 权限管理相关类型
│   └── rbac.schema.ts
├── shared/         # 共享类型
│   └── pagination.ts
└── standard/       # Standard Schema 工具
    └── standard-schema.ts
```

## 使用方法

### 导入类型

```typescript
import type {
  SignUpEmailBody,
  SignInEmailBody,
  UserStatus,
  UserResponse,
  UserListQuery,
  RoleListQuery,
  PaginationQuery,
} from '@xdd-zone/schema'
```

### 认证类型 (auth)

```typescript
import { SignUpEmailBodySchema } from '@xdd-zone/schema/auth'

// 验证数据
const result = SignUpEmailBodySchema['~standard'].validate({
  email: 'user@example.com',
  password: 'password123',
  name: '张三',
})

if (result.issues) {
  console.log('验证失败:', result.issues)
} else {
  console.log('验证成功:', result.value)
}
```

### 用户类型 (user)

```typescript
import type { UserResponse, UserListQuery } from '@xdd-zone/schema'

// 用户列表查询
const query: UserListQuery = {
  page: 1,
  pageSize: 20,
  keyword: '搜索关键字',
  status: 'ACTIVE',
}

// 用户响应
const user: UserResponse = {
  id: 'user-123',
  username: 'zhangsan',
  name: '张三',
  email: 'user@example.com',
  status: 'ACTIVE',
  // ...其他字段
}
```

### 分页类型 (shared)

```typescript
import type { PaginationQuery, PaginationMeta } from '@xdd-zone/schema/shared'

// 分页查询
const pagination: PaginationQuery = {
  page: 1,
  pageSize: 20,
}

// 分页元数据
const meta: PaginationMeta = {
  currentPage: 1,
  total: 100,
  pageSize: 20,
  totalPage: 5,
  hasNextPage: true,
  hasPrevPage: false,
}
```

### RBAC 类型 (rbac)

```typescript
import type {
  RoleListQuery,
  CreateRoleBody,
  PermissionListQuery,
} from '@xdd-zone/schema/rbac'

// 角色列表查询
const roleQuery: RoleListQuery = {
  page: 1,
  pageSize: 10,
  keyword: '管理员',
}

// 创建角色
const newRole: CreateRoleBody = {
  name: 'admin',
  displayName: '管理员',
  description: '系统管理员角色',
}
```

## 类型列表

### Auth 模块

| 类型 | 描述 |
|------|------|
| `UserStatus` | 用户状态枚举 (`ACTIVE` \| `INACTIVE` \| `BANNED`) |
| `UserBase` | 用户基础信息 |
| `Session` | 会话信息 |
| `SignUpEmailBody` | 邮箱注册请求体 |
| `SignInEmailBody` | 邮箱登录请求体 |
| `SessionData` | 会话数据 |
| `AuthSessionData` | 认证会话数据 |

### User 模块

| 类型 | 描述 |
|------|------|
| `UserIdParams` | 用户 ID 路由参数 |
| `UserResponse` | 用户响应 |
| `UserListQuery` | 用户列表查询参数 |
| `UserListResponse` | 用户列表响应 |
| `CreateUserBody` | 创建用户请求体 |
| `UpdateUserBody` | 更新用户请求体 |

### RBAC 模块

| 类型 | 描述 |
|------|------|
| `RoleListQuery` | 角色列表查询 |
| `CreateRoleBody` | 创建角色请求体 |
| `UpdateRoleBody` | 更新角色请求体 |
| `SetRoleParentBody` | 设置父角色请求体 |
| `RoleIdParams` | 角色 ID 参数 |
| `PermissionListQuery` | 权限列表查询 |
| `CreatePermissionBody` | 创建权限请求体 |
| `PermissionIdParams` | 权限 ID 参数 |
| `AssignRoleToUserBody` | 分配角色给用户 |
| `AssignPermissionsToRoleBody` | 分配权限给角色 |
| `ReplaceRolePermissionsBody` | 替换角色权限 |
| `RBACUserIdParams` | RBAC 用户 ID 参数 |
| `UserRoleIdParams` | 用户角色 ID 参数 |
| `RolePermissionIdParams` | 角色权限 ID 参数 |

### Shared 模块

| 类型 | 描述 |
|------|------|
| `PaginationQuery` | 分页查询参数 |
| `PaginationMeta` | 分页元数据 |
| `PaginatedList<T>` | 分页列表泛型类型 |
| `ApiResponse<T>` | API 统一响应泛型类型 |

## 与 Standard Schema 交互

本包中的 Schema 对象符合 [Standard Schema v1](https://github.com/standard-schema/standard-schema) 规范：

```typescript
import { SignUpEmailBodySchema } from '@xdd-zone/schema/auth'

// 使用 ~standard 属性进行验证
const validationResult = SignUpEmailBodySchema['~standard'].validate({
  email: 'test@example.com',
  password: 'password123',
  name: '张三',
})

// 验证结果
if (validationResult.issues) {
  // 验证失败
  console.error(validationResult.issues)
} else {
  // 验证成功
  console.log(validationResult.value)
}
```

## 注意事项

1. **仅类型**: 本包仅导出 TypeScript 类型，运行时验证由使用方负责
2. **独立维护**: nexus 和 client 包应维护各自的验证逻辑
3. **版本要求**: 需要 TypeScript 5.0+ 和 @standard-schema/spec

## 许可证

MIT
