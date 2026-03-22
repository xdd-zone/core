# RBAC 指南

## 模型

RBAC 模型如下：

- 用户可以拥有多个角色
- 角色可以拥有多个权限
- 角色使用固定系统角色模型
- 权限字符串格式为 `resource:action[:scope]`
- 权限由系统内置常量统一定义

示例：

- `user:read:own`
- `user:read:all`
- `user:update:own`
- `user:update:all`
- `user:disable:all`
- `role:read:all`
- `user_role:assign:all`
- `user_role:revoke:all`
- `user_permission:read:own`
- `user_permission:read:all`
- `system:manage`

## 权限常量

统一定义在：

[permissions.ts](../packages/nexus/src/core/permissions/permissions.ts)

route 中应使用常量，不直接写裸字符串。

## 推荐入口

### `permissionPlugin`

新代码通过它接入权限上下文。

它同时提供：

- 通过组合 `authPlugin` 提供登录态校验
- 声明式权限宏
- handler 可直接消费的 `auth / currentUser / currentSession`

### route 级声明

优先使用下面 3 个字段：

- `permission`
- `own`
- `me`

使用约束：

- `own` 只用于用户自己的资料场景
- `permission` 只表达“是否具备能力”，不表达资源归属
- `me` 用于当前登录用户自己的 `/me` 类接口

## 语义说明

### `permission`

要求显式权限。

```ts
.post('/', handler, {
  permission: Permissions.USER.READ_ALL,
})
```

### `own`

自己可以访问；如果用户具备对应 `:all` 权限，也允许访问他人资源。当前主要用于用户资料接口。

```ts
.get('/:id', handler, {
  own: Permissions.USER.READ_OWN,
})
```

### `me`

用于 `/me` 类接口，表达“登录用户查看自己的数据”。

```ts
.get('/users/me/permissions', handler, {
  auth: 'required',
  me: Permissions.USER_PERMISSION.READ_OWN,
})
```

## 路由风格

推荐写法：

```ts
export const rbacRoutes = new Elysia({
  prefix: '/rbac',
  tags: ['RBAC'],
})
  .use(permissionPlugin)
  .get('/roles', async ({ query }) => await RbacService.listRoles(query), {
    permission: Permissions.ROLE.READ_ALL,
    query: RoleListQuerySchema,
    response: RoleListSchema,
    detail: apiDetail({
      summary: '获取角色列表',
      response: RoleListSchema,
      errors: [400, 401, 403],
    }),
  })
```

重点是：

- 权限意图写在 route 配置层
- handler 只关心业务输入输出
- 不把临时权限判断散到 service / handler 里
- 角色路由围绕角色列表、用户角色分配和用户权限查看展开

## 状态码语义

- 未登录：`401`
- 已登录但权限不足：`403`

常见场景：

- 匿名访问受保护接口：`401`
- 普通用户访问管理员接口：`403`
- own 接口访问自己：成功
- own 接口访问别人且无 `:all`：`403`
- me 接口缺少 own/base 权限：`403`

## RBAC API

### 角色

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/rbac/roles` | 获取角色列表 |
| GET | `/api/rbac/users/:userId/roles` | 获取用户角色 |

### 用户角色与权限

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| POST | `/api/rbac/users/:userId/roles` | 为用户分配角色 |
| DELETE | `/api/rbac/users/:userId/roles/:roleId` | 移除用户角色 |
| GET | `/api/rbac/users/:userId/permissions` | 获取用户权限 |
| GET | `/api/rbac/users/me/roles` | 获取登录用户角色 |
| GET | `/api/rbac/users/me/permissions` | 获取登录用户权限 |

### 系统角色与权限

- 系统角色固定为 `superAdmin / admin / user`
- 权限以系统内置权限为准
- 角色能力包括角色列表、用户角色分配、用户角色移除与用户权限查看

## 测试重点

RBAC 调整后至少要覆盖：

- 匿名访问返回 `401`
- 普通用户访问管理员接口返回 `403`
- own 接口访问自己成功、访问别人失败
- me 接口在普通用户下可用
- `204` 行为仍然保持正确
- 角色列表、用户角色与用户权限查询可用

仓库内已有两层现成回归：

- Nexus Eden smoke
- Nexus 自动化测试与 OpenAPI 导出验证
