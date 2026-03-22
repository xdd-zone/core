# 开发指南

## 开发前提

- Bun 1.3.5
- Docker 可用
- `.env` 已配置 `DATABASE_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`

常用初始化命令：

```bash
bun install
bun run prisma:generate
bun run db:local:prepare
```

## 标准开发动作

新增或修改公共 API 时，默认按下面顺序推进：

1. 改 Nexus 接口定义
2. 改 service / repository
3. 改 route
4. 导出 OpenAPI
5. 完成 Eden / OpenAPI / 权限回归

也就是：

```text
packages/nexus
  -> export openapi
  -> 验证
```

## 代码放哪一层

### `packages/nexus/src/modules/*/*.contract.ts`

放：

- body / query / params schema
- 成功 response schema
- route 可复用的 HTTP 边界类型

### `packages/nexus/src/routes/*.route.ts`

放：

- prefix / tags
- route schema 绑定
- `apiDetail(...)`
- `auth / permission / own / me`
- 调用 service

不要在这里放：

- Prisma 查询
- 散落的业务权限逻辑
- Better Auth glue code
- `AuthService.getSession(request.headers)` 这类会话解析

route handler 优先直接消费：

- `auth`
- `currentUser`
- `currentSession`

### `packages/nexus/src/modules/*/*.service.ts`

放：

- 业务编排
- 资源存在性校验
- 领域层判断

### `packages/nexus/src/modules/*/*.repository.ts`

放：

- Prisma 查询与写入
- 数据选择与持久化细节

## 新增接口的推荐流程

### 第 1 步：定义接口

推荐位置：

- `packages/nexus/src/modules/<name>/<name>.contract.ts`

至少明确：

- body
- query
- params
- response

### 第 2 步：实现 service / repository

如果涉及数据库访问：

- Prisma 访问下沉到 repository
- service 只保留业务编排

### 第 3 步：实现 route

推荐 route 写法：

```ts
export const userRoutes = new Elysia({
  prefix: '/user',
  tags: ['User'],
})
  .use(permissionPlugin)
  .get('/', async ({ query }) => await UserService.list(query), {
    permission: Permissions.USER.READ_ALL,
    query: UserListQuerySchema,
    response: UserListSchema,
    detail: apiDetail({
      summary: '获取用户列表',
      response: UserListSchema,
      errors: [400, 401, 403],
    }),
  })
```

必须登录但不做权限判断时：

```ts
.get('/me', ({ auth }) => SessionSchema.parse(auth), {
  auth: 'required',
  response: SessionSchema,
})
```

own / me 场景时：

```ts
.get('/:id', handler, {
  own: Permissions.USER.READ_OWN,
})

.get('/users/me/permissions', handler, {
  auth: 'required',
  me: Permissions.USER_PERMISSION.READ_OWN,
})
```

### route 层禁止项

看到下面这些写法时，默认说明分层又开始回漂了：

- 在 route handler 里直接调用 `AuthService.getSession(...)`
- 在 route handler 里手写 `401 / 403` 判断
- 在 route handler 里写 Prisma 查询
- 为了“方便”重新绕回低层鉴权 helper

### 第 4 步：导出 OpenAPI

执行：

```bash
bun run --filter @xdd-zone/nexus export:openapi
```

这会完成：

- 导出最新的 OpenAPI JSON 产物
- 校验默认输出路径不依赖已删除目录

### 第 5 步：回归验证

至少考虑：

- happy path
- 参数错误
- `401`
- `403`
- `204`
- own / me

## 插件与权限选择

### 公开接口，只想读取可选 session

使用 `authPlugin`。

### 必须登录，但没有权限分层

优先直接在 route 上使用：

```ts
auth: 'required'
```

需要一组路由都要求登录时，也优先使用 `authPlugin`，并在每个 route 上显式声明 `auth: 'required'`。

### 需要权限判断

使用 `permissionPlugin`，并在 route 配置里声明：

- `permission`
- `own`
- `me`

## 响应约定

### 成功响应

直接返回业务数据：

```ts
return user
return { items, total, page, pageSize, totalPages }
```

### 无 body 操作

```ts
set.status = 204
```

### 错误响应

统一交给错误插件，不在 handler 内手动拼错误结构。

## OpenAPI 写法

统一通过 `apiDetail(...)` 描述：

```ts
detail: apiDetail({
  summary: '删除用户',
  successStatus: 204,
  responseDescription: '删除成功',
  errors: [401, 403, 404],
})
```

## 本地验证建议

### 最小检查

```bash
bun run format
bun run lint
bun run type-check
```

### 改了接口定义 / route / OpenAPI

```bash
bun run --filter @xdd-zone/nexus export:openapi
bun run --filter @xdd-zone/nexus type-check
bun run --filter @xdd-zone/nexus test
```

### 改了 auth / permission / own / me

```bash
bun run --filter @xdd-zone/nexus test
bun run --filter @xdd-zone/nexus export:openapi
```

## 本地数据库

仓库提供统一的本地数据库入口：

```bash
bun run db:local:up
bun run db:local:down
bun run db:local:reset
bun run db:local:status
bun run db:local:prepare
```

默认连接信息：

- host: `localhost`
- port: `55432`
- database: `xdd_core_local`
- user: `xdd`
- password: `xdd_local_dev`

`packages/nexus` 的测试与 Prisma 操作可直接复用这套本地数据库配置。

## AI 生成代码建议

如果通过 AI 在仓库中生成或修改代码，优先使用 `xdd-zone-codegen` 项目 Skill。

建议按下面的顺序推进：

- 先定义 Nexus 接口
- 再写 route / service / repository
- 公共 API 变更后同步检查 OpenAPI 导出与 Nexus 测试
- 避免重新维护第二套接口定义
