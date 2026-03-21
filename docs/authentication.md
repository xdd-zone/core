# 认证说明

项目使用 Better Auth 处理登录态，Elysia 层通过 `core/access-control` 将认证能力按成本分层。

## 职责划分

### `authPlugin`

负责：

- 注入 `auth`
- 注入 `currentUser`
- 注入 `currentSession`
- 支持 route 级 `auth: 'required'`

适合：

- 公开接口读取可选 session
- 少量必须登录的接口直接声明 `auth: 'required'`

### `permissionPlugin`

负责：

- 组合 `authPlugin`
- 在已登录前提下执行权限判断
- 支持 route 级：
  - `permission`
  - `own`
  - `me`

适合：

- 需要 RBAC 的接口

## Better Auth 适配位置

Better Auth 的 HTTP 适配位于：

- `packages/nexus/src/core/auth/auth.ts`
- `packages/nexus/src/core/auth/better-auth.adapter.ts`

其中 adapter 负责：

- Better Auth response 透传
- sign-out 幂等撤销
- cookie 清理

`auth.route.ts` 只保留 route / schema / detail / 调用。

## 认证流程

标准流程：

1. `POST /api/auth/sign-up/email`
2. `POST /api/auth/sign-in/email`
3. 服务端返回 `Set-Cookie`
4. 后续请求携带 session cookie
5. `GET /api/auth/get-session` 检查会话状态
6. `POST /api/auth/sign-out` 清理会话，返回 `204`

## Auth API

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| POST | `/api/auth/sign-up/email` | 注册 |
| POST | `/api/auth/sign-in/email` | 登录 |
| POST | `/api/auth/sign-out` | 登出 |
| GET | `/api/auth/get-session` | 获取 session |
| GET | `/api/auth/me` | 获取登录用户 |

## 推荐路由写法

### 读取可选 session

```ts
export const sessionRoutes = new Elysia()
  .use(authPlugin)
  .get('/session', ({ auth }) => SessionSchema.parse(auth), {
    response: SessionSchema,
  })
```

### 只要求登录

```ts
export const meRoutes = new Elysia()
  .use(authPlugin)
  .get('/me', ({ auth }) => SessionSchema.parse(auth), {
    auth: 'required',
    response: SessionSchema,
  })
```

### 一组路由都要求登录

```ts
export const profileRoutes = new Elysia()
  .use(authPlugin)
  .get('/profile', ({ currentUser }) => currentUser, {
    auth: 'required',
  })
```

## Handler 可直接消费的上下文

使用 `authPlugin` 后，handler 里通常可以直接拿到：

- `auth`
- `currentUser`
- `currentSession`

这意味着大多数场景不需要在 handler 内自己调用 `AuthService.getSession(...)` 或处理 Better Auth request / response 细节。

## 状态码语义

- 未登录：`401`
- 已登录但无权限：`403`

这一区分由 `auth: 'required'` 与 `permissionPlugin` 统一处理。

## 调用方行为

无论调用方使用浏览器、`fetch` 还是其他 HTTP 工具，都需要正确处理：

- 登录响应返回的 `Set-Cookie`
- 后续请求携带 session cookie
- `401` 与 `403` 的差异语义

内部 Eden smoke test 覆盖：

- 匿名 `/api/auth/get-session`
- 登录态 `/api/auth/me`

## 配置

至少需要：

```env
BETTER_AUTH_URL="http://localhost:7788"
BETTER_AUTH_SECRET="replace-with-a-secure-secret"
```

## 排查建议

建议按下面顺序排查：

1. 用 `/api/auth/get-session` 确认当前 cookie 是否有效
2. 检查请求是否真的带上了 session cookie
3. 检查 `BETTER_AUTH_URL` 是否与实际服务地址一致
4. 检查 route 用的是 `auth: 'required'` 还是 `permission / own / me`
5. 检查是否被权限层拦截成 `403`

补充约定：

- 如果 route handler 需要直接消费已认证的 `auth.user` / `auth.session`
- 即使已经声明 `permission / own / me`，也推荐同时显式写上 `auth: 'required'`
