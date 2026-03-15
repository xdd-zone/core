# RBAC 指南

## 模型

当前 RBAC 模型为：

- 用户可以拥有多个角色
- 角色可以拥有多个权限
- 角色支持父子继承
- 权限字符串格式为 `resource:action[:scope]`

示例：

- `user:create`
- `user:read:own`
- `user:read:all`

## 权限常量

统一定义在：

[permissions.ts](/Users/wuwanzhu/Code/xdd/core/packages/nexus/src/core/permissions/permissions.ts)

route 中使用常量，不直接写裸字符串。

## 入口能力

### `permissionPlugin`

为 route 提供统一权限上下文，并保证路由先完成登录校验。

### `permit.permission(...)`

要求显式权限。

### `permit.own(...)`

自己可访问；如果用户具备对应 `:all` 权限，也允许访问他人资源。

### `permit.me(...)`

用于 `/me` 类接口，表达“当前登录用户查看自己的数据”。

## 路由示例

```ts
.get('/:id', handler, {
  beforeHandle: [permit.own(Permissions.USER.READ_OWN)],
})

.post('/', handler, {
  beforeHandle: [permit.permission(Permissions.USER.CREATE)],
})

.get('/users/me/permissions', handler, {
  beforeHandle: [permit.me(Permissions.USER_PERMISSION.READ_OWN)],
})
```

## 状态码语义

- 未登录：`401`
- 已登录但权限不足：`403`

## RBAC API

### 角色

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/rbac/roles` | 获取角色列表 |
| POST | `/api/rbac/roles` | 创建角色 |
| GET | `/api/rbac/roles/:id` | 获取角色详情 |
| PATCH | `/api/rbac/roles/:id` | 更新角色 |
| DELETE | `/api/rbac/roles/:id` | 删除角色 |
| PATCH | `/api/rbac/roles/:id/parent` | 设置父角色 |
| GET | `/api/rbac/roles/:id/children` | 获取子角色 |

### 权限

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/rbac/permissions` | 获取权限列表 |
| GET | `/api/rbac/permissions/:id` | 获取权限详情 |
| POST | `/api/rbac/permissions` | 创建权限 |
| GET | `/api/rbac/roles/:id/permissions` | 获取角色权限 |
| POST | `/api/rbac/roles/:id/permissions` | 为角色分配权限 |
| PATCH | `/api/rbac/roles/:id/permissions` | 替换角色权限 |
| DELETE | `/api/rbac/roles/:id/permissions/:permissionId` | 移除角色权限 |

### 用户角色与权限

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/rbac/users/:userId/roles` | 获取用户角色 |
| POST | `/api/rbac/users/:userId/roles` | 为用户分配角色 |
| DELETE | `/api/rbac/users/:userId/roles/:roleId` | 移除用户角色 |
| PATCH | `/api/rbac/users/:userId/roles/:roleId` | 刷新用户角色缓存 |
| GET | `/api/rbac/users/:userId/permissions` | 获取用户权限 |
| GET | `/api/rbac/users/me/roles` | 获取当前用户角色 |
| GET | `/api/rbac/users/me/permissions` | 获取当前用户权限 |

## 测试重点

RBAC 调整后至少要覆盖：

- 匿名访问返回 `401`
- 普通用户访问管理员接口返回 `403`
- `own` 接口访问自己成功、访问别人失败
- `me` 接口在普通用户下可用
