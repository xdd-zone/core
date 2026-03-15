# 认证说明

项目使用 Better Auth 处理登录态，HTTP 层通过 Elysia 插件把认证能力按成本分层。

## 当前职责划分

- `authPlugin`
  - 提供 `getAuth(request)`
  - 提供 `requireAuth(request)`
  - 适合公开接口读取可选 session
- `protectedPlugin`
  - 进入路由前执行 `requireAuth(request)`
  - 适合所有必须登录的接口
- `permissionPlugin`
  - 组合 `protectedPlugin`
  - 在已登录前提下继续做权限判定

## 认证流程

1. `POST /api/auth/sign-up/email`
2. `POST /api/auth/sign-in/email`
3. 服务端返回 `Set-Cookie`
4. 后续请求自动携带 session cookie
5. `POST /api/auth/sign-out` 清理会话，返回 `204`

## Auth API

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| POST | `/api/auth/sign-up/email` | 注册 |
| POST | `/api/auth/sign-in/email` | 登录 |
| POST | `/api/auth/sign-out` | 登出 |
| GET | `/api/auth/get-session` | 获取当前 session |
| GET | `/api/auth/me` | 获取当前登录用户 |

## 路由写法

### 读取可选 session

```ts
export const authAwareRoutes = new Elysia()
  .use(authPlugin)
  .get('/session', async ({ getAuth, request }) => {
    return await getAuth(request)
  })
```

### 强制要求登录

```ts
export const protectedRoutes = new Elysia()
  .use(protectedPlugin)
  .get('/profile', async ({ request, requireAuth }) => {
    const auth = await requireAuth(request)
    return auth.user
  })
```

## 状态码语义

- 未登录：`401`
- 已登录但无权限：`403`

这一区分已经在 `protectedPlugin / permissionPlugin` 中统一收敛。

## client 行为

`@xdd-zone/client` 默认会：

- 自动保存登录返回的 cookie
- 后续请求自动附带 cookie
- 对 `401` 抛出 `UnauthorizedError`
- 对 `403` 抛出 `ForbiddenError`

## 配置

至少需要：

```env
BETTER_AUTH_URL="http://localhost:7788"
BETTER_AUTH_SECRET="replace-with-a-secure-secret"
```

## 排查建议

1. 用 `/api/auth/get-session` 确认当前 cookie 是否有效
2. 检查请求是否带上了 session cookie
3. 检查 `BETTER_AUTH_URL` 与实际服务地址是否一致
4. 检查 client 自定义 headers 是否错误覆盖了 cookie
