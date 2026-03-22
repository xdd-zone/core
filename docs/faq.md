# 常见问题

## OpenAPI 地址是什么？

默认是：

```text
http://localhost:7788/openapi
```

API 前缀默认是 `/api`。

## 为什么成功响应没有 `{ code, message, data }`？

成功响应直接返回业务数据。

例如：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20,
  "totalPages": 0
}
```

错误响应使用统一错误结构。

## 为什么接口返回 401 或 403？

- `401`：未登录
- `403`：已登录，但权限不足

这两个状态码在 `auth: 'required'` 与 `permission / own / me` 的声明式 access control 中有明确区分。

当前约定里，`own` 只用于用户自己的资料场景，通用资源归属由具体业务模块判断。

## Prisma Client 未生成怎么办？

```bash
bun run prisma:generate
```

## 本地数据库连不上怎么办？

先检查：

1. `.env` 中的 `DATABASE_URL`
2. Docker 是否正常运行
3. `bun run db:local:status` 是否显示数据库健康
4. 首次准备环境时是否已经执行 `bun run db:local:prepare`

## Better Auth session 不生效怎么办？

优先检查：

1. `/api/auth/get-session` 的返回
2. `BETTER_AUTH_URL` 是否与服务实际地址一致
3. 调用方是否保存了 cookie
4. 自定义 headers 是否覆盖了内部 cookie

## 本机回归怎么跑？

先确保服务已启动：

```bash
bun run dev
```

然后执行：

```bash
bun run --filter @xdd-zone/nexus test
bun run --filter @xdd-zone/nexus export:openapi
```

这样可以覆盖 Eden smoke 和 OpenAPI 导出这两条主链路。
