# RBAC 指南

## 模型

RBAC 模型如下：

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

## 语义说明

### `permission`

要求显式权限。

```ts
.post('/', handler, {
  permission: Permissions.USER.CREATE,
})
```

### `own`

自己可以访问；如果用户具备对应 `:all` 权限，也允许访问他人资源。

```ts
.get('/:id', handler, {
  own: Permissions.USER.READ_OWN,
})
```

如果参数名不是默认的 `id`，可以显式传配置：

```ts
own: {
  permission: Permissions.USER_ROLE.READ_OWN,
  paramKey: 'userId',
}
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
    permission: Permissions.ROLE.READ,
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
| GET | `/api/rbac/users/me/roles` | 获取登录用户角色 |
| GET | `/api/rbac/users/me/permissions` | 获取登录用户权限 |

## 测试重点

RBAC 调整后至少要覆盖：

- 匿名访问返回 `401`
- 普通用户访问管理员接口返回 `403`
- own 接口访问自己成功、访问别人失败
- me 接口在普通用户下可用
- `204` 行为仍然保持正确

仓库内已有两层现成回归：

- Nexus Eden smoke
- Nexus 自动化测试与 OpenAPI 导出验证
