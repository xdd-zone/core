# RBAC 指南

这份文档说明当前权限模型、代码位置和常用写法。

## 当前模型

- 用户可以拥有多个角色
- 角色可以拥有多个权限
- 固定角色只有 `superAdmin / user`
- 权限字符串格式是 `resource:action[:scope]`
- 用户、角色、用户权限、系统管理这些基础权限放在 `core/security`
- 文章、媒体、评论、站点配置这些业务权限放在各自业务模块

## 相关代码位置

- `packages/nexus/src/core/security/permissions/permissions.ts`
  系统基础权限常量，只放用户、角色、用户角色、用户权限和系统管理。
- `packages/nexus/src/core/security/permissions/registry.ts`
  权限注册表。`PermissionService` 从这里读取权限展示信息和排序。
- `packages/nexus/src/core/security/permissions/role.constants.ts`
  固定角色常量。
- `packages/nexus/src/core/security/plugins/access.plugin.ts`
  权限插件。
- `packages/nexus/src/core/security/guards/*`
  认证守卫、权限守卫、所有权守卫。
- `packages/nexus/src/modules/*/permissions.ts`
  业务模块自己的权限常量和权限说明。
- `packages/nexus/src/modules/permission-definitions.ts`
  汇总当前业务模块权限，供 seed 和公开导出读取。
- `packages/nexus/src/public/permissions.ts`
  给前端导出系统权限、业务权限、角色常量和权限匹配函数。
- `packages/console/src/app/access/access-control.ts`
  前端页面访问控制。

## 权限放在哪里

### 系统基础权限

系统基础权限只写在：

```text
packages/nexus/src/core/security/permissions/permissions.ts
```

当前包含这些分组：

- `USER`
- `ROLE`
- `USER_ROLE`
- `USER_PERMISSION`
- `SYSTEM`

不要把 `POST`、`MEDIA`、`COMMENT`、`SITE_CONFIG` 这类业务权限写回这里。

### 业务权限

业务权限放在业务模块自己的目录里：

```text
packages/nexus/src/modules/post/permissions.ts
packages/nexus/src/modules/media/permissions.ts
packages/nexus/src/modules/comment/permissions.ts
packages/nexus/src/modules/site-config/permissions.ts
```

每个文件同时导出两类内容：

- `PostPermissions` 这类权限常量
- `POST_PERMISSION_DEFINITIONS` 这类权限说明列表

新增业务模块权限时，按这个顺序改：

1. 在 `packages/nexus/src/modules/<feature>/permissions.ts` 写权限常量和权限说明
2. 在 `packages/nexus/src/modules/permission-definitions.ts` 加入该模块的权限说明
3. 在 `packages/nexus/src/modules/<feature>/index.ts` 使用自己的权限常量
4. 如果 Console 页面也要判断权限，从 `@xdd-zone/nexus/permissions` 引入对应业务权限常量

示例：

```ts
import type { PermissionDefinition, PermissionString } from '@nexus/core/security/permissions'

export const PostPermissions = {
  READ_ALL: 'post:read:all' as PermissionString,
} as const

export const POST_PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  {
    key: PostPermissions.READ_ALL,
    displayName: '查看文章',
    description: '允许查看后台文章列表和文章详情。',
  },
] as const
```

## 权限注册表怎么用

`PermissionService` 不直接读取业务模块。它只读：

```text
packages/nexus/src/core/security/permissions/registry.ts
```

当前在 `packages/nexus/src/modules/index.ts` 注册权限：

```ts
registerPermissionDefinitions(SYSTEM_PERMISSION_DEFINITIONS)
registerPermissionDefinitions(BUSINESS_PERMISSION_DEFINITIONS)
```

seed 权限时也读取系统权限和业务权限：

```text
packages/nexus/src/infra/database/prisma/seed/seeds/seed-permissions.ts
```

这保证数据库里的 `permissions` 表能拿到完整权限列表，同时 `core/security` 不需要导入任何业务模块。

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

- 系统基础权限只在 `core/security/permissions/permissions.ts` 维护
- 业务权限只在对应的 `modules/*/permissions.ts` 维护
- 前端需要权限常量时，从 `@xdd-zone/nexus/permissions` 引入
- 页面访问控制和接口访问控制要保持同一套权限语义
- `own` 不要泛化成所有资源的通用规则
- 不要在前端复制权限字符串

## 常见状态码

- `401`
  没登录。
- `403`
  已登录，但权限不够。

## 调整 RBAC 后至少检查什么

```bash
bun run format
bun run lint
bun run type-check
bun run --filter @xdd-zone/nexus test
```

重点看：

- 匿名访问是不是返回 `401`
- 普通用户访问超管接口是不是返回 `403`
- `/me` 接口是否还能正常访问
- 当前用户权限接口和角色接口是否还能返回数据
- `packages/nexus/src/core/security` 里有没有误加业务权限字符串
