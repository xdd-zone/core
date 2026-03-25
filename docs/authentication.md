# 认证说明

项目使用 Better Auth 处理登录态，Elysia 层通过 `core/security` 提供认证上下文、守卫和权限声明。

## 职责划分

### `core/security/plugins/auth.plugin.ts`

负责：

- 注入 `auth`
- 注入 `currentUser`
- 注入 `currentSession`
- 支持 route 级 `auth: 'required'`

适合：

- 公开接口读取可选 session
- 少量必须登录的接口直接声明 `auth: 'required'`

### `core/security/plugins/access.plugin.ts`

负责：

- 组合认证上下文和权限守卫
- 支持 route 级 `auth: 'required'`
- 在已登录前提下执行权限判断
- 支持 route 级：
  - `permission`
  - `own`
  - `me`

适合：

- 需要 RBAC 的接口
- 需要登录且同时使用权限声明的接口

使用约束：

- `own` 只用于用户自己的资料场景
- 固定角色只保留 `superAdmin / admin / user`
- 只要求登录且不需要权限声明时，优先使用 `authPlugin`

## Better Auth 适配位置

Better Auth 的 HTTP 适配位于：

- `packages/nexus/src/core/security/auth/auth-api.service.ts`
- `packages/nexus/src/core/security/auth/better-auth.ts`
- `packages/nexus/src/core/security/auth/better-auth.adapter.ts`
- `packages/nexus/src/core/security/auth/session.service.ts`

其中：

- `auth-api.service.ts`
  - 处理登录、注册、登出这些认证接口动作
- Better Auth response 透传
- `better-auth.adapter.ts`
  - 负责 Better Auth response 透传
  - 负责 sign-out 幂等撤销
  - 负责 cookie 清理

固定角色名称位于：

- `packages/nexus/src/core/security/permissions/role.constants.ts`

认证模块入口位于：

- `packages/nexus/src/modules/auth/index.ts`

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
export const authModule = new Elysia()
  .use(authPlugin)
  .get('/get-session', ({ auth }) => SessionSchema.parse(auth), {
    response: SessionSchema,
  })
```

### 只要求登录

```ts
.get('/me', ({ auth }) => SessionSchema.parse(auth), {
  auth: 'required',
  response: SessionSchema,
})
```

### 需要权限判断

```ts
export const userModule = new Elysia()
  .use(accessPlugin)
  .get('/', ({ query }) => UserService.list(query), {
    permission: Permissions.USER.READ_ALL,
    query: UserListQuerySchema,
    response: UserListSchema,
  })
```

## Handler 可直接使用的上下文

使用 `authPlugin` 后，handler 里通常可以直接拿到：

- `auth`
- `currentUser`
- `currentSession`

大多数场景不需要在 handler 内自己读取当前会话。

使用 `accessPlugin` 时，handler 里同样可以直接拿到：

- `auth`
- `currentUser`
- `currentSession`

## 状态码语义

- 未登录：`401`
- 已登录但无权限：`403`

## 前端接入约定

后台前端统一按下面方式接入认证接口：

- TanStack Query 维护 `/api/auth/get-session`
- 登录 mutation 调用 `/api/auth/sign-in/email`
- 登出 mutation 调用 `/api/auth/sign-out`
- TanStack Router 在 `beforeLoad` 中确保受保护页面先完成 session 检查

并遵守：

- 请求默认使用 `credentials: 'include'`
- 是否已登录只看 `/api/auth/get-session`
- 未登录访问后台路由时，由路由层重定向到 `/login`

## 排查建议

建议按下面顺序排查：

1. 用 `/api/auth/get-session` 确认当前 cookie 是否有效
2. 检查请求是否带上了 session cookie
3. 检查 `BETTER_AUTH_URL` 是否与实际服务地址一致
4. 检查 route 用的是 `auth: 'required'` 还是 `permission / own / me`
