# 认证说明

当前仓库用 Better Auth 处理登录态。后端负责建立和校验 session，前端负责发起登录、恢复会话和做页面跳转。

## 配置放哪里

### 环境变量

至少要有：

- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`

如果要开 GitHub 登录，再补：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### 项目配置

登录方式和可信来源统一在这里维护：

- `packages/nexus/config.yaml`

当前最常改的是：

```yaml
auth:
  trustedOrigins:
    - http://localhost:2333
  methods:
    emailPassword:
      enabled: true
      allowSignUp: true
    github:
      enabled: true
      allowSignUp: true
```

字段含义：

- `trustedOrigins`
  允许读取登录态和完成回跳的前端来源。
- `enabled`
  当前登录方式是否可用。
- `allowSignUp`
  当前登录方式是否允许第一次登录时创建账号。

## 相关代码位置

### 后端

- `packages/nexus/src/modules/auth/index.ts`
  认证接口入口。
- `packages/nexus/src/core/security/auth/auth-api.service.ts`
  邮箱注册、邮箱登录、GitHub 登录、登出。
- `packages/nexus/src/core/security/auth/auth-methods.service.ts`
  登录方式列表和是否开放的判断。
- `packages/nexus/src/core/security/auth/better-auth.ts`
  Better Auth 实例和 provider 注册。
- `packages/nexus/src/core/security/auth/session.service.ts`
  session 解析。

### 前端

- `packages/console/src/modules/auth/auth.query.ts`
  读取 `/api/auth/get-session`。
- `packages/console/src/modules/auth/auth.api.ts`
  只处理 GitHub 登录地址这类浏览器跳转动作，不负责普通接口请求。
- `packages/console/src/modules/auth/auth.store.ts`
  保存登录弹窗和登录方式列表这类前端状态。
- `packages/console/src/pages/auth/Login.tsx`
  登录页。
- `packages/console/src/app/router/guards.tsx`
  路由进入前检查 session。

## `authPlugin` 和 `accessPlugin` 怎么选

### `authPlugin`

适合这些场景：

- 公开接口里顺手读一下可选 session
- 只要求登录，不做权限判断

常用写法：

```ts
.get('/me', ({ auth }) => SessionSchema.parse(auth), {
  auth: 'required',
  response: SessionSchema,
})
```

### `accessPlugin`

适合这些场景：

- 要求登录并校验权限
- 要用 `permission`、`own`、`me`

## 认证接口

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/auth/methods` | 返回当前公开的登录方式 |
| POST | `/api/auth/sign-up/email` | 邮箱注册 |
| POST | `/api/auth/sign-in/email` | 邮箱登录 |
| GET | `/api/auth/sign-in/github` | 发起 GitHub 登录 |
| GET | `/api/auth/callback/github` | GitHub 回调 |
| POST | `/api/auth/sign-out` | 登出 |
| GET | `/api/auth/get-session` | 获取当前会话 |
| GET | `/api/auth/me` | 获取当前登录用户 |

`GET /api/auth/methods` 当前会返回这些字段：

- `id`
- `kind`
- `enabled`
- `allowSignUp`
- `implemented`
- `entryPath`

## 邮箱登录流程

1. 前端提交 `POST /api/auth/sign-in/email`
2. 后端返回 `Set-Cookie`
3. 前端再调用 `GET /api/auth/get-session`
4. 路由守卫根据 session 决定是否进后台

## GitHub 登录流程

1. 登录页先读 `/api/auth/methods`
2. 前端根据 `entryPath` 拼 GitHub 登录地址
3. 浏览器跳到 `/api/auth/sign-in/github?callbackURL=...`
4. 后端转给 GitHub
5. GitHub 回调 `/api/auth/callback/github`
6. 后端写入 session cookie，再跳回 `callbackURL`
7. 前端重新调用 `/api/auth/get-session`

这条流程是浏览器重定向，不是普通 JSON 请求。

## 前端登录态怎么恢复

前端统一通过这两层恢复会话：

- `packages/console/src/modules/auth/auth.query.ts`
  读 `/api/auth/get-session`
- `packages/console/src/app/router/guards.tsx`
  进入页面前先确认是否有 session

## 常见问题

### 登录成功后还是没会话

先看：

1. `/api/auth/get-session` 返回了什么
2. 前端请求有没有带 `credentials: 'include'`
3. `trustedOrigins` 有没有包含当前来源
4. `BETTER_AUTH_URL` 是否和实际后端地址一致

### GitHub 登录后回到登录页

先看：

1. GitHub OAuth App callback URL 是否写成 `{BETTER_AUTH_URL}/api/auth/callback/github`
2. 当前前端 API 基址是否正确
3. `packages/nexus/config.yaml` 里的 `github.enabled` 是否为 `true`
4. 登录页 URL 上的 `error` 参数是什么

GitHub 详细接法看 [docs/OAuth2/github.md](./OAuth2/github.md)。
