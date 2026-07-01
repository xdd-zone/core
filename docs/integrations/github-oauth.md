# GitHub OAuth 状态

当前 Momo 已经在 `better-auth` 里配置 GitHub 登录。

## 代码位置

- `apps/momo/src/modules/auth/auth.config.ts`
  读取 GitHub OAuth 配置，并传给 `better-auth`。
- `apps/momo/src/modules/auth/auth.route.ts`
  把 `/api/auth/*` 交给 `better-auth` 处理。
- `apps/momo/src/shared/env.ts`
  校验 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`。
- `apps/momo/.env.example`
  记录本地开发需要填写的变量名。

## 环境变量

```text
GITHUB_CLIENT_ID=replace-with-github-client-id
GITHUB_CLIENT_SECRET=replace-with-github-client-secret
BETTER_AUTH_URL=http://localhost:7788
```

本地开发还要保证 `CORS_ORIGINS` 里包含前端地址。

## 获取 GitHub 配置

打开 [GitHub Developer settings](https://github.com/settings/developers)，使用要拥有这个 OAuth App 的 GitHub 账号登录。

创建 OAuth App：

1. 进入 OAuth Apps。
2. 点击 New OAuth App。
3. Application name 填应用名，比如 `XDD Zone Local`。
4. Homepage URL 填前端地址。本地开发可以填：

```text
http://localhost:2333
```

5. Authorization callback URL 填 Momo 的 Better Auth 回调地址：

```text
http://localhost:7788/api/auth/callback/github
```

6. 点击 Register application。
7. 复制 Client ID，填到 `GITHUB_CLIENT_ID`。
8. 点击 Generate a new client secret，复制生成的值，填到 `GITHUB_CLIENT_SECRET`。

GitHub OAuth App 只能填一个 Authorization callback URL。本地、测试和生产最好各建一个 OAuth App，分别填自己的回调地址。

生产环境回调地址示例：

```text
https://your-api-domain/api/auth/callback/github
```

## 本地填写位置

把拿到的值写进：

```text
apps/momo/.env.development
```

示例：

```text
BETTER_AUTH_URL=http://localhost:7788
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

`BETTER_AUTH_URL` 会参与拼接 Better Auth 回调地址。这里填 `http://localhost:7788` 时，GitHub 后台也必须填 `http://localhost:7788/api/auth/callback/github`。code-server Web IDE 里使用个人 dev 域名时，按实际 Momo 地址添加 `/api/auth/callback/github`，配置入口看 [code-server 内开发](../development/code-server.md)。

## 常见错误

- 回调地址不匹配
  GitHub OAuth App 的 Authorization callback URL 要填 Momo 地址，不是前端地址。
- 本地和生产来回切换失败
  GitHub OAuth App 只能填一个 callback。给本地和生产分别建 OAuth App。
- `email_not_found`
  GitHub 用户可能没有返回可用邮箱。先确认 GitHub 账号有 primary email，并完成邮箱验证。

## 当前接口

Momo 没有手写 GitHub 登录接口。登录、callback、session cookie 都由 `better-auth` 的 `/api/auth/*` 处理。

当前和 GitHub 登录相关的 Momo 接口：

- `GET` 或 `POST /api/auth/*`
- `POST /api/auth/link-social`
- `GET /rpc/fifa/profile`
- `GET /rpc/bobo/auth/me`

Fifa 的 `/settings/profile` 页面会调用 `/api/auth/link-social` 绑定当前后台账号。

`/rpc/bobo/auth/me` 在用户已登录时会补上 `bobo.visitor`。

## 当前没有做的事

- Bobo 还没有登录按钮和登录后页面。
- 当前没有 GitHub 解绑入口。
- 当前不按邮箱自动合并 GitHub 和其他登录方式。
