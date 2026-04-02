# 认证说明

项目使用 Better Auth 处理登录态，Elysia 层通过 `core/security` 提供认证上下文、守卫和权限声明。

如果你需要从 GitHub 后台开始一步一步完成接入，直接看：

- [GitHub OAuth2 接入完整指南](./OAuth2/github.md)

## 环境配置

当前认证方式由 `packages/nexus/config.yaml` 统一控制。启动前至少准备下面几项：

- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `packages/nexus/config.yaml` 中的 `trustedOrigins`
- `packages/nexus/config.yaml` 中的 `auth.methods`

如果当前环境开启了 GitHub 登录，还要准备：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

说明：

- `BETTER_AUTH_URL` 指向 Nexus 服务根地址，例如 `http://localhost:7788`
- GitHub OAuth App 的 callback URL 使用 `BETTER_AUTH_URL` 对应的 `/api/auth/callback/github`
- `trustedOrigins` 需要包含当前 Console 来源
- Console 当前使用的 API 基址需要可以直达 Nexus

当前登录方式配置写法：

```yaml
auth:
  methods:
    emailPassword:
      enabled: true
      allowSignUp: true
    github:
      enabled: true
      allowSignUp: true
```

字段说明：

- `enabled`
  - 控制这条登录方式是否开启
- `allowSignUp`
  - 控制这条登录方式是否允许首次创建用户

如果 `github.enabled = false`，启动时不要求 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`。

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

## Better Auth 接入位置

Better Auth 的 HTTP 适配位于：

- `packages/nexus/src/core/security/auth/auth-api.service.ts`
- `packages/nexus/src/core/security/auth/better-auth.ts`
- `packages/nexus/src/core/security/auth/better-auth.adapter.ts`
- `packages/nexus/src/core/security/auth/session.service.ts`

其中：

- `auth-api.service.ts`
  - 处理邮箱注册、邮箱登录、GitHub 登录和登出动作
  - 在转发 Better Auth 前检查当前登录方式是否开启
  - 负责校验 `callbackURL`、拼装 `errorCallbackURL` 和浏览器回跳地址
- `auth-methods.service.ts`
  - 读取登录方式配置
  - 判断某种方式是否允许登录
  - 判断某种方式是否允许首次创建用户
- `better-auth.adapter.ts`
  - 透传 Better Auth 的 JSON 响应
  - 透传 Better Auth 的重定向响应
  - 负责 sign-out 幂等撤销
  - 负责 cookie 清理
- `better-auth.ts`
  - 按配置启用邮箱密码登录
  - 按配置决定是否注册 GitHub provider

固定角色名称位于：

- `packages/nexus/src/core/security/permissions/role.constants.ts`

认证模块入口位于：

- `packages/nexus/src/modules/auth/index.ts`

## 认证接口

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/auth/methods` | 获取当前可用登录方式 |
| POST | `/api/auth/sign-up/email` | 注册 |
| POST | `/api/auth/sign-in/email` | 邮箱登录 |
| GET | `/api/auth/sign-in/github` | 发起 GitHub 登录，成功返回 `302` |
| GET | `/api/auth/callback/github` | 处理 GitHub 回调，写入 session 后返回 `302` |
| POST | `/api/auth/sign-out` | 登出 |
| GET | `/api/auth/get-session` | 获取 session |
| GET | `/api/auth/me` | 获取登录用户 |

`/api/auth/sign-in/github` 支持 `callbackURL` query，用于指定登录成功后的浏览器落点。

`GET /api/auth/methods` 返回当前公开可读的登录方式列表。当前返回字段包括：

- `id`
  - 登录方式标识
- `kind`
  - 登录方式类型，当前有 `credential` 和 `oauth`
- `enabled`
  - 当前是否可用
- `allowSignUp`
  - 当前是否允许首次创建用户

## 认证流程

### 邮箱登录

1. 服务端先检查 `emailPassword.enabled`
2. `POST /api/auth/sign-in/email`
2. 服务端返回 `Set-Cookie`
3. 后续请求携带 session cookie
4. `GET /api/auth/get-session` 检查会话状态
5. `POST /api/auth/sign-out` 清理会话，返回 `204`

### GitHub 登录

1. Console 先读取 `/api/auth/methods`
2. Console 生成浏览器跳转地址，地址指向当前 API 基址下的 `/api/auth/sign-in/github?callbackURL=...`
2. Nexus 将请求转给 Better Auth 的 `/sign-in/social`
3. Better Auth 跳转到 GitHub 授权页
4. GitHub 回调 `GET /api/auth/callback/github?code=...&state=...`
5. Nexus 写入 session cookie，并重定向到 `callbackURL`
6. Console 通过 `/api/auth/get-session` 和路由 `beforeLoad` 恢复登录态

常见失败结果：

- `error=auth_method_disabled`
  - 当前登录方式未开启
- `error=auth_sign_up_disabled`
  - 当前方式不允许首次创建用户
- `error=email_not_found`
  - GitHub 没有返回可用邮箱
- `error=invalid_callback_url`
  - 登录入口使用的 `callbackURL` 或 API 基址配置不合法
- `error=github_sign_in_failed`
  - GitHub 登录入口没有完成，可稍后重试

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

- TanStack Query 维护 `/api/auth/methods`
- TanStack Query 维护 `/api/auth/get-session`
- 邮箱登录 mutation 调用 `/api/auth/sign-in/email`
- GitHub 登录地址统一通过 `authApi.getGithubSignInUrl(...)` 构造
- 登出 mutation 调用 `/api/auth/sign-out`
- TanStack Router 在 `beforeLoad` 中确保受保护页面先完成 session 检查

并遵守：

- 请求默认使用 `credentials: 'include'`
- 登录页根据 `/api/auth/methods` 控制当前可用入口
- 是否已登录只看 `/api/auth/get-session`
- 登录页继续解析 `redirect` 和 `error`
- 如果邮箱密码登录关闭，登录页保留邮箱表单，但输入框和提交按钮改为禁用状态
- 未登录访问后台路由时，由路由层重定向到 `/login`
- GitHub 登录入口和 Eden 请求共用同一套 API 基址配置
- 本地开发继续通过 `/api` 代理
- 生产环境可使用同域反向代理，或使用与当前会话策略匹配的同站点 API 域名

## 排查建议

建议按下面顺序排查：

1. 用 `/api/auth/get-session` 确认当前 cookie 是否有效
2. 检查 `BETTER_AUTH_URL` 是否与实际服务地址一致
3. 检查 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` 是否已配置
4. 检查 GitHub OAuth App callback URL 是否使用 `BETTER_AUTH_URL` 对应的 `/api/auth/callback/github`
5. 检查 `packages/nexus/config.yaml` 的 `trustedOrigins` 是否包含当前 Console 来源
6. 检查当前 API 基址配置是否正确，并且浏览器可以直接访问这条地址
7. 检查 route 用的是 `auth: 'required'` 还是 `permission / own / me`
