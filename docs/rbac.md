# RBAC 权限系统

## 权限模型

- **用户**: 系统的使用者
- **角色**: 权限的集合（如 `admin`, `user`, `moderator`）
- **权限**: 具体的操作权限（如 `user:read`, `user:delete`, `post:create`）
- **关联关系**:
  - 用户可以有多个角色（多对多）
  - 角色可以有多个权限（多对多）

## 权限定义

在 `src/core/permissions/permissions.ts` 中定义系统权限：

```typescript
export const PERMISSIONS = {
  // 用户管理
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // 角色管理
  ROLE_READ: 'role:read',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  // 权限管理
  PERMISSION_READ: 'permission:read',
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',
} as const
```

## API 端点

### 角色管理 (`/api/rbac/roles/*`)

| 方法   | 路径                              | 描述           |
| ------ | --------------------------------- | -------------- |
| GET    | `/api/rbac/roles`                 | 获取角色列表   |
| POST   | `/api/rbac/roles`                 | 创建角色       |
| GET    | `/api/rbac/roles/:id`             | 获取角色详情   |
| PATCH  | `/api/rbac/roles/:id`             | 更新角色       |
| DELETE | `/api/rbac/roles/:id`             | 删除角色       |
| POST   | `/api/rbac/roles/:id/permissions` | 为角色分配权限 |

### 权限管理 (`/api/rbac/permissions/*`)

| 方法 | 路径                    | 描述         |
| ---- | ----------------------- | ------------ |
| GET  | `/api/rbac/permissions` | 获取权限列表 |
| POST | `/api/rbac/permissions` | 创建权限     |

### 用户角色管理

| 方法 | 路径                            | 描述           |
| ---- | ------------------------------- | -------------- |
| POST | `/api/rbac/users/:userId/roles` | 为用户分配角色 |

## 检查权限

使用 `permissionGuard` 或 `RequirePermission` 装饰器：

```typescript
import { RequirePermission, authGuard } from '@/core'

export const userModule = new Elysia()
  .use(authGuard({ required: true })) // 首先需要登录
  .delete('/:id', () => 'User deleted', {
    beforeHandle: [RequirePermission('user:delete')], // 权限守卫
  })
```

## 数据库表结构

权限系统涉及以下表：

- `role`: 角色表
- `permission`: 权限表
- `user_role`: 用户角色关联表
- `role_permission`: 角色权限关联表
