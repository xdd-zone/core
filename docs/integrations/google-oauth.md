# Google OAuth 状态

当前 Momo 已经在 `better-auth` 里配置 Google 登录。

## 代码位置

- `apps/momo/src/modules/auth/auth.config.ts`
  读取 Google OAuth 配置，并传给 `better-auth`。
- `apps/momo/src/modules/auth/auth.route.ts`
  把 `/api/auth/*` 交给 `better-auth` 处理。
- `apps/momo/src/shared/env.ts`
  校验 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`。
- `apps/momo/.env.example`
  记录本地开发需要填写的变量名。

## 环境变量

```text
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
BETTER_AUTH_URL=http://localhost:7788
```

本地开发还要保证 `CORS_ORIGINS` 里包含前端地址。

## 当前接口

Momo 没有手写 Google 登录接口。登录、callback、session cookie 都由 `better-auth` 的 `/api/auth/*` 处理。

当前和 Google 登录相关的 Momo 接口：

- `GET` 或 `POST /api/auth/*`
- `GET /rpc/bobo/auth/me`

`/rpc/bobo/auth/me` 在用户已登录时会补上 `bobo.visitor`。

## 当前没有做的事

- Fifa 没有 Google 登录入口。
- Bobo 还没有登录按钮和登录后页面。
- 当前没有账号绑定和解绑页面。
- 当前不按邮箱自动合并 Google 和其他登录方式。
