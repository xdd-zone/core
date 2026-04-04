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
3. `bun run db status` 是否显示数据库健康
4. 首次准备环境时是否已经执行 `bun run db prepare`

## Better Auth session 不生效怎么办？

优先检查：

1. `/api/auth/get-session` 的返回
2. `BETTER_AUTH_URL` 是否与服务实际地址一致
3. 调用方是否保存了 cookie
4. 自定义 headers 是否覆盖了内部 cookie
5. `packages/nexus/config.yaml` 的 `trustedOrigins` 是否包含当前来源

## GitHub 登录跳回登录页怎么办？

优先检查：

1. `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 是否已配置
2. GitHub OAuth App 的 callback URL 是否使用 `BETTER_AUTH_URL` 对应的 `/api/auth/callback/github`
3. `packages/nexus/config.yaml` 的 `trustedOrigins` 是否包含当前 Console 来源
4. Console 当前使用的 API 基址是否正确
5. 登录页地址上的 `error` 参数是什么

补充说明：

- `error=invalid_callback_url`
  - 先检查 `VITE_API_ORIGIN / VITE_API_ROOT / VITE_API_BASE_URL` 和 `trustedOrigins`
- `error=github_sign_in_failed`
  - 先检查 GitHub OAuth App 配置、当前 API 地址是否可访问，再重试

## 本机回归怎么跑？

先确保服务已启动：

```bash
bun run dev
```

然后执行：

```bash
bun run --filter @xdd-zone/nexus test
```

这样可以覆盖 Eden smoke 和运行时 OpenAPI 这条主链路。

如果需要手动查看接口说明，直接访问：

- `http://localhost:7788/openapi`
- `http://localhost:7788/openapi/json`
