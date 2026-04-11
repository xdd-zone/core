# RBAC 指南

这份文档说明当前权限模型、代码位置和常用写法。

## 当前模型

- 用户可以拥有多个角色
- 角色可以拥有多个权限
- 固定角色只有 `superAdmin / user`
- 权限字符串格式是 `resource:action[:scope]`

## 相关代码位置

- `packages/nexus/src/core/security/permissions/permissions.ts`
  权限常量。
- `packages/nexus/src/core/security/permissions/role.constants.ts`
  固定角色常量。
- `packages/nexus/src/core/security/plugins/access.plugin.ts`
  权限插件。
- `packages/nexus/src/core/security/guards/*`
  认证守卫、权限守卫、所有权守卫。
- `packages/console/src/app/access/access-control.ts`
  前端页面访问控制。

## route 上常用的字段

### `permission`

要求明确权限。

```ts
.get('/', handler, {
  permission: Permissions.USER.READ_ALL,
})
```

### `own`

用于“自己访问自己的资源”。当前主要给用户资料相关接口用。

```ts
.get('/:id', handler, {
  own: Permissions.USER.READ_OWN,
})
```

### `me`

用于当前登录用户自己的 `/me` 接口。

```ts
.get('/users/me/permissions', handler, {
  auth: 'required',
  me: Permissions.USER_PERMISSION.READ_OWN,
})
```

## 当前 RBAC 接口

### 角色

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/rbac/roles` | 获取角色列表 |

### 指定用户角色和权限

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/rbac/users/:userId/roles` | 获取指定用户角色 |
| POST | `/api/rbac/users/:userId/roles` | 给用户分配角色 |
| DELETE | `/api/rbac/users/:userId/roles/:roleId` | 移除用户角色 |
| GET | `/api/rbac/users/:userId/permissions` | 获取指定用户权限 |

### 当前用户

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/rbac/users/me/roles` | 获取当前用户角色 |
| GET | `/api/rbac/users/me/permissions` | 获取当前用户权限 |

## 当前规则

- 角色常量和权限常量只在后端统一维护
- 前端需要权限常量时，从 `@xdd-zone/nexus/permissions` 引入
- 页面访问控制和接口访问控制要保持同一套权限语义
- `own` 不要泛化成所有资源的通用规则

## 常见状态码

- `401`
  没登录。
- `403`
  已登录，但权限不够。

## 调整 RBAC 后至少检查什么

```bash
bun run --filter @xdd-zone/nexus test
```

重点看：

- 匿名访问是不是返回 `401`
- 普通用户访问超管接口是不是返回 `403`
- `/me` 接口是否还能正常访问
- 当前用户权限接口和角色接口是否还能返回数据
