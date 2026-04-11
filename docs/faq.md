# 常见问题

## OpenAPI 地址是什么

- 页面：`http://localhost:7788/openapi`
- JSON：`http://localhost:7788/openapi/json`

## 为什么成功响应没有 `{ code, message, data }`

因为当前成功响应直接返回业务数据。错误响应才走统一错误结构。

## `401` 和 `403` 有什么区别

- `401`：没登录
- `403`：已登录，但没权限

## Prisma Client 没生成怎么办

```bash
bun run prisma:generate
```

## 本地数据库连不上怎么办

按这个顺序看：

1. Docker 是否正常
2. `bun run db status` 是否正常
3. `.env` 里的 `DATABASE_URL` 是否正确
4. 是否已经执行过 `bun run db prepare`

## 登录成功后还是拿不到 session

先检查：

1. `/api/auth/get-session` 返回了什么
2. 前端请求有没有带 cookie
3. `trustedOrigins` 是否包含当前前端来源
4. `BETTER_AUTH_URL` 是否和后端实际地址一致

## GitHub 登录后回到登录页怎么办

先检查：

1. GitHub callback URL 是否是 `{BETTER_AUTH_URL}/api/auth/callback/github`
2. `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 是否已配置
3. `packages/nexus/config.yaml` 的 `auth.methods.github.enabled` 是否开启
4. 前端 API 基址是否正确
5. 登录页地址上的 `error` 参数是什么

## 本机回归怎么跑

```bash
bun run --filter @xdd-zone/nexus test
```
