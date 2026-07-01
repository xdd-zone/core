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

## 获取 Google 配置

打开 [Google Cloud Console](https://console.cloud.google.com/)，创建或选择一个项目。

先配置 Google Auth：

1. 打开 [Google Auth Platform](https://console.cloud.google.com/auth/overview)。
2. 如果页面提示还没配置 Google Auth，点开始配置。
3. 在 Branding 里填写应用名称、支持邮箱和开发者联系邮箱。
4. 在 Audience 里选择用户范围。
   本地开发可以先用 Testing。如果选择 Testing，把自己的 Google 邮箱加到 Test users。
5. 当前只做 Google 登录，不需要额外访问 Gmail、Drive 这类 Google API。不要添加额外 scope。

再创建 OAuth client：

1. 打开 [Google Auth Platform Clients](https://console.cloud.google.com/auth/clients)。
2. 点击 Create client。
3. Application type 选择 Web application。
4. Name 填一个方便识别的名字，比如 `XDD Zone Local`。
5. 在 Authorized redirect URIs 里添加：

```text
http://localhost:7788/api/auth/callback/google
```

6. 创建后复制 Client ID，填到 `GOOGLE_CLIENT_ID`。
7. 复制 Client Secret，填到 `GOOGLE_CLIENT_SECRET`。

如果后面要配生产环境，再添加生产 API 域名对应的回调地址：

```text
https://your-api-domain/api/auth/callback/google
```

本地和生产也可以拆成两个 OAuth client。拆开后，本地 `.env.development` 和生产环境变量分别填自己的 Client ID 和 Client Secret。

## 本地填写位置

把拿到的值写进：

```text
apps/momo/.env.development
```

示例：

```text
BETTER_AUTH_URL=http://localhost:7788
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

`BETTER_AUTH_URL` 会参与拼接 Better Auth 回调地址。这里填 `http://localhost:7788` 时，Google 后台也必须填 `http://localhost:7788/api/auth/callback/google`。code-server Web IDE 里使用个人 dev 域名时，按实际 Momo 地址添加 `/api/auth/callback/google`，配置入口看 [code-server 内开发](../development/code-server.md)。

## 常见错误

- `redirect_uri_mismatch`
  Google 后台的 Authorized redirect URI 和 Better Auth 实际发出的回调地址不一致。先检查 `BETTER_AUTH_URL`，再检查 Google 后台是否填了 `/api/auth/callback/google`。
- `access_denied`
  如果 Google Auth 还在 Testing，当前登录的 Google 邮箱需要放进 Test users。
- 找不到 Client Secret
  打开 Google Auth Platform Clients，点进对应 client，在 client 详情页查看或新增 secret。

## 当前接口

Momo 没有手写 Google 登录接口。登录、callback、session cookie 都由 `better-auth` 的 `/api/auth/*` 处理。

当前和 Google 登录相关的 Momo 接口：

- `GET` 或 `POST /api/auth/*`
- `POST /api/auth/link-social`
- `GET /rpc/fifa/profile`
- `GET /rpc/bobo/auth/me`

Fifa 的 `/settings/profile` 页面会调用 `/api/auth/link-social` 绑定当前后台账号。

`/rpc/bobo/auth/me` 在用户已登录时会补上 `bobo.visitor`。

## 当前没有做的事

- Bobo 还没有登录按钮和登录后页面。
- 当前没有 Google 解绑入口。
- 当前不按邮箱自动合并 Google 和其他登录方式。
