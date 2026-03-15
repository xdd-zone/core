# 开发指南

## 开发前提

- Bun 1.3.5
- PostgreSQL 可用
- `.env` 已配置 `DATABASE_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`

常用初始化命令：

```bash
bun install
bun run prisma:generate
bun run prisma:push
bun run seed
```

## 当前开发模型

新增能力时，优先按下面的职责拆分：

- `packages/nexus/src/routes/*`：HTTP 路由
- `packages/nexus/src/modules/*`：业务逻辑
- `packages/schema/src/contracts/*`：请求与 HTTP 成功契约
- `packages/schema/src/domains/*`：领域对象
- `packages/client/src/modules/*`：SDK 访问器

## 新增 route 的推荐流程

### 1. 先定义 schema

在 `packages/schema` 中补齐：

- body / query / params schema
- response schema

### 2. 实现 module

在 `packages/nexus/src/modules/<name>/` 中实现：

- `*.model.ts`
- `*.service.ts`
- `*.repository.ts`
- `*.types.ts`
- `index.ts`

### 3. 实现 route

在 `packages/nexus/src/routes/*.route.ts` 中注册：

```ts
export const postRoutes = new Elysia({
  prefix: '/posts',
  tags: ['Post'],
})
  .use(permissionPlugin)
  .get('/', async ({ query }) => await PostService.list(query), {
    query: PostListQuerySchema,
    beforeHandle: [permit.permission(Permissions.POST.READ_ALL)],
    detail: apiDetail({
      summary: '获取文章列表',
      response: PostListSchema,
      errors: [400, 401, 403],
    }),
  })
```

### 4. 在 `routes/index.ts` 聚合

```ts
export const routes = new Elysia({
  prefix: `/${APP_CONFIG.prefix}`,
})
  .use(postRoutes)
```

## 插件选择

### 公开接口，只读取可选会话

使用 `authPlugin`。

### 必须登录但不做权限判定

使用 `protectedPlugin`。

### 既要登录又要权限判定

使用 `permissionPlugin`。

## 权限写法

```ts
beforeHandle: [permit.permission(Permissions.USER.CREATE)]
beforeHandle: [permit.own(Permissions.USER.READ_OWN)]
beforeHandle: [permit.me(Permissions.USER_PERMISSION.READ_OWN)]
```

语义：

- `permit.permission(...)`：要求显式权限
- `permit.own(...)`：自己或具备 `:all` 权限
- `permit.me(...)`：当前用户 `/me` 类接口

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

## 数据库变更

```bash
bun run prisma:generate
bun run prisma:migrate
```

开发环境快速同步：

```bash
bun run prisma:push
```

## 本地验证建议

提交前至少执行：

```bash
bun run format
bun run lint
bun run type-check
```

涉及权限或协议调整时，额外执行：

```bash
bun run --filter @xdd-zone/nexus test
bun test packages/client/src/core/request.test.ts
bun packages/client/test-integration.ts
```

## 常用命令

```bash
bun run dev
bun run build
bun run lint
bun run lint:fix
bun run format
bun run format:check
bun run type-check
bun run prisma:generate
bun run prisma:migrate
bun run prisma:push
bun run prisma:reset
bun run seed
bun run test:db
bun run test:db start
bun run test:db stop
bun run test:db reset
```
