# 常见问题

## OpenAPI 地址是什么？

默认是：

```text
http://localhost:7788/openapi
```

API 前缀默认是 `/api`。

## 为什么成功响应没有 `{ code, message, data }`？

当前成功响应已经统一改为直接返回业务数据。

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

错误响应才继续使用统一错误结构。

## 为什么接口返回 401 或 403？

- `401`：未登录
- `403`：已登录，但权限不足

这两个状态码在当前 `protectedPlugin / permissionPlugin` 中已经做了明确区分。

## Prisma Client 未生成怎么办？

```bash
bun run prisma:generate
```

## 本地数据库连不上怎么办？

先检查：

1. `.env` 中的 `DATABASE_URL`
2. PostgreSQL 是否运行
3. 测试环境是否应该改用 `bun run test:db start`

## Better Auth session 不生效怎么办？

优先检查：

1. `/api/auth/get-session` 的返回
2. `BETTER_AUTH_URL` 是否与服务实际地址一致
3. client 是否保存了 cookie
4. 自定义 headers / 请求拦截器是否覆盖了内部 cookie

## 集成脚本在本机怎么跑？

先确保服务已启动：

```bash
bun run dev
```

然后执行：

```bash
bun packages/client/test-integration.ts
```

脚本会自动创建一个临时普通用户，验证权限边界后再删除它。
