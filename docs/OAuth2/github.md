# GitHub OAuth2 接入完整指南

这份指南用于说明当前仓库怎样接入 GitHub 登录。

看完之后，你可以直接完成下面这些事：

- 在 GitHub 创建当前项目需要的 OAuth App
- 从 GitHub 取回 `Client ID` 和 `Client Secret`
- 把参数写进仓库配置
- 启动 Console 和 Nexus，完成一次完整登录
- 知道这次需求在代码里落在哪些文件

这份指南只说明当前实现。

- 后端使用 `packages/nexus` 中的 Better Auth + GitHub OAuth App
- 前端使用 `packages/console` 登录页发起浏览器跳转
- 成功登录后，GitHub 会回到 Nexus，再由 Nexus 回到 Console
- GitHub 是否开启，以及是否允许首次创建用户，统一由 `packages/nexus/config.yaml` 的 `auth.methods.github` 控制

## 先知道这次接入长什么样

当前 GitHub 登录的主链路是：

1. 用户在 Console 登录页点击“GitHub 登录”
2. Console 生成 GitHub 登录入口地址
3. 浏览器跳转到 `/api/auth/sign-in/github`
4. Nexus 把请求转给 Better Auth
5. Better Auth 跳转到 GitHub 授权页
6. 用户在 GitHub 完成授权
7. GitHub 回调到 `/api/auth/callback/github`
8. Nexus 写入 session cookie
9. Nexus 再把浏览器带回 Console
10. Console 通过 `/api/auth/get-session` 恢复登录态

这次接入里最重要的几个代码位置：

- `packages/nexus/src/core/config/auth.config.ts`
  - 解析登录方式配置
- `packages/nexus/src/core/security/auth/better-auth.ts`
  - 按配置决定是否注册 GitHub social provider
- `packages/nexus/src/core/security/auth/auth-api.service.ts`
  - 处理 GitHub 登录入口、校验 `callbackURL`、拼装失败回跳地址
  - 按配置决定是否允许 GitHub 登录和首次创建用户
- `packages/nexus/src/core/security/auth/auth-methods.service.ts`
  - 读取登录方式开关并提供判断方法
- `packages/console/src/modules/auth/auth.api.ts`
  - 生成 GitHub 登录地址
- `packages/console/src/pages/auth/Login.tsx`
  - 登录页按钮、错误提示和跳转逻辑
  - 读取登录方式接口并控制可用状态
- `packages/console/src/shared/api/eden.ts`
  - 统一处理 Console 的 API 基址

## 第 1 步：先把地址定下来

开始前，先确定下面 4 个值。

| 名称 | 用途 | 本地示例 |
| ---- | ---- | ---- |
| Console 地址 | 用户打开后台的地址 | `http://localhost:2333` |
| Nexus 服务根地址 | 写到 `BETTER_AUTH_URL`，是后端服务根地址 | `http://localhost:7788` |
| GitHub callback URL | GitHub 授权完成后回到 Nexus 的地址 | `http://localhost:7788/api/auth/callback/github` |
| Console API 基址 | Console 在浏览器里访问 Nexus 的地址 | 本地开发默认走当前域名下的 `/api` 代理 |

这 4 个值里，最容易写错的是 callback URL。

当前项目里，GitHub OAuth App 的 callback URL 必须写成：

```text
{BETTER_AUTH_URL}/api/auth/callback/github
```

例如：

```text
http://localhost:7788/api/auth/callback/github
```

如果你后面改了 `BETTER_AUTH_URL`，记得一起去 GitHub 后台更新 callback URL。

## 第 2 步：在 GitHub 创建 OAuth App

当前项目使用的是 GitHub OAuth App，不是 GitHub App。

如果你准备把应用挂在个人账号下，直接用自己的 GitHub 设置页创建即可。
如果你准备把应用挂在组织下，需要先用有组织管理权限的账号进入组织设置再创建。

在 GitHub 后台里，按下面顺序操作：

1. 打开 `Settings`
2. 进入 `Developer settings`
3. 进入 `OAuth Apps`
4. 点击 `New OAuth App`

如果这是你第一次创建应用，按钮名称可能会显示为 `Register a new application`。

然后按下面方式填写：

| GitHub 表单字段 | 该怎么填 | 本地示例 |
| ---- | ---- | ---- |
| `Application name` | 写一个容易区分环境的名字 | `xdd-zone-core-local` |
| `Homepage URL` | 写 Console 地址 | `http://localhost:2333` |
| `Application description` | 可选，写清这个应用是做什么的 | `XDD Zone Core Console login` |
| `Authorization callback URL` | 写 GitHub 回调到 Nexus 的地址 | `http://localhost:7788/api/auth/callback/github` |
| `Enable Device Flow` | 当前项目不需要，保持关闭 | 不开启 |

填写完成后，点击 `Register application`。

对当前项目来说，GitHub 后台真正需要确认的项只有这些：

- 已经创建的是 `OAuth App`
- `Homepage URL` 指向当前 Console 地址
- `Authorization callback URL` 指向当前 Nexus 的 GitHub 回调地址
- `Enable Device Flow` 保持关闭
- `Client ID` 和 `Client Secret` 已经取回并写入项目环境变量

这里有两个小提醒：

- GitHub OAuth App 不能同时配置多个 callback URL，所以每个环境都要确认自己实际使用的是哪一条地址
- `Homepage URL` 和 `Authorization callback URL` 都建议填写你愿意公开展示的地址，不要把敏感内部地址写进应用说明里

## 第 3 步：从 GitHub 取回项目需要的参数

OAuth App 创建完成后，会进入应用详情页。

这一步需要拿到两个值：

- `Client ID`
- `Client Secret`

操作顺序：

1. 在应用详情页找到 `Client ID`
2. 把它复制出来，准备写到 `GITHUB_CLIENT_ID`
3. 在 `Client secrets` 区域点击 `Generate a new client secret`
4. 把生成出来的值复制出来，准备写到 `GITHUB_CLIENT_SECRET`

建议你在生成后马上把 `Client Secret` 放到当前环境的安全配置里，不要等到后面再找。

## 第 4 步：把参数写进仓库

### 4.1 写 Nexus 环境变量

先准备当前运行 `packages/nexus` 时会读取的 `.env` 文件。
字段名可以直接参考：

- `packages/nexus/.env.example`

至少要有下面这些配置：

```env
DATABASE_URL=postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local
BETTER_AUTH_URL=http://localhost:7788
BETTER_AUTH_SECRET=replace-with-a-secure-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

说明：

- `BETTER_AUTH_URL` 写 Nexus 服务根地址，不带 `/api`
- `GITHUB_CLIENT_ID` 来自 GitHub 应用详情页
- `GITHUB_CLIENT_SECRET` 来自 GitHub 应用详情页里的 `Client secrets`

### 4.2 配置 `trustedOrigins`

GitHub 登录成功后，Nexus 需要确认哪些前端来源是可信的。
这部分配置写在：

- `packages/nexus/config.yaml`

当前至少要确认下面两部分：

```yaml
auth:
  methods:
    github:
      enabled: true
      allowSignUp: true

trustedOrigins:
  - http://localhost:2333
```

说明：

- `enabled`
  - 控制 GitHub 登录是否开启
- `allowSignUp`
  - 控制第一次使用 GitHub 登录时，是否允许直接创建账号

你至少要保证当前 Console 来源在 `trustedOrigins` 里。

举例：

- 本地 Console 是 `http://localhost:2333`，就要把这条地址放进去
- 生产 Console 是 `https://console.example.com`，就要把这条地址放进去

这里只写来源就可以，也就是：

```text
协议 + 域名 + 端口
```

不要带路径。

### 4.3 确认 Console 的 API 地址

当前 Console 生成 GitHub 登录入口时，会复用自己使用的 API 基址。

本地开发默认行为：

- 浏览器访问 `http://localhost:2333`
- Console 请求 `/api/...`
- Vite 代理把 `/api` 转发到 `http://localhost:7788`

这条本地代理配置在：

- `packages/console/vite.config.ts`

如果你使用默认本地地址，通常不需要再额外配置前端 API 环境变量。

如果你不是走默认代理，而是要让 Console 直接访问单独的 API 地址，就要在前端环境变量里配置下面任意一个：

- `VITE_API_ORIGIN`
- `VITE_API_ROOT`
- `VITE_API_BASE_URL`

它们要指向浏览器能直接访问到的 API 根地址。

例如：

```env
VITE_API_ORIGIN=https://api.example.com
```

## 第 5 步：启动项目并完成一次登录

准备好配置后，在仓库根目录启动开发环境：

```bash
bun run dev
```

启动后，按这个顺序检查：

1. 打开 Console 登录页：`http://localhost:2333/login`
2. 点击“GitHub 登录”
3. 浏览器是否跳到了 GitHub 授权页
4. 在 GitHub 完成授权
5. 浏览器是否回到了 Console
6. 页面是否进入 `/dashboard`，或者回到原本的 `redirect` 页面

如果你想再确认一次 session 是否真的建立成功，可以直接检查：

```text
GET /api/auth/get-session
```

拿到有效用户和会话后，说明这条链路已经通了。

## 第 6 步：知道登录成功后项目里会发生什么

这部分对理解这次需求很有帮助。

### 6.1 Nexus 会做什么

用户点击 GitHub 登录后，Nexus 会做下面几件事：

1. 读取 `callbackURL`
2. 判断这个地址是不是可信
3. 生成 Better Auth 需要的 `errorCallbackURL`
4. 把请求转发给 Better Auth 的 social sign-in
5. GitHub 回调成功后写入 session cookie
6. 把浏览器重定向回 Console

如果登录入口参数有问题，Nexus 会把用户带回登录页，并追加错误码。

当前会用到的错误码有：

- `email_not_found`
- `invalid_callback_url`
- `github_sign_in_failed`

### 6.2 Console 会做什么

Console 登录页不会手写 GitHub 地址，而是通过 `authApi.getGithubSignInUrl(...)` 统一生成。

这样做有两个直接好处：

- GitHub 登录入口和 Eden 请求共用同一套 API 基址配置
- 如果部署地址有变化，只需要改一处 API 基址配置

GitHub 登录成功后，Console 会再去请求 `/api/auth/get-session`，确认当前用户已经有可用会话。

### 6.3 Dashboard 为什么还要做权限适配

这次需求不只是“能登录”。
还要保证普通用户登录后，首页不会因为缺少管理权限而直接报错。

所以 Dashboard 当前会先读当前用户权限，再决定是否请求这些管理型接口：

- 用户总数
- 角色总数

这样普通用户登录后也可以正常看到首页，只是展示内容会按权限变化。

## 常见问题

### 1. 登录后又回到了登录页

先检查下面 4 项：

1. GitHub OAuth App 的 callback URL 是否和 `BETTER_AUTH_URL` 对应
2. `packages/nexus/config.yaml` 的 `trustedOrigins` 是否包含当前 Console 来源
3. Console 当前 API 基址是否正确
4. 浏览器是否真的可以访问这条 API 地址

### 2. 登录页出现 `error=invalid_callback_url`

这通常表示登录入口地址不合法，或者这条地址不在可信来源里。

优先检查：

- 登录页是不是从当前 Console 页面发起的
- `trustedOrigins` 有没有漏掉当前 Console 来源
- `VITE_API_ORIGIN / VITE_API_ROOT / VITE_API_BASE_URL` 是否写错
- `redirect` 最后是不是被拼成了不可信地址

### 3. 登录页出现 `error=github_sign_in_failed`

这通常表示 GitHub 登录入口没有顺利完成。

优先检查：

- `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 是否正确
- GitHub OAuth App 的 callback URL 是否正确
- 当前 API 地址是否可访问
- Nexus 服务是否已经启动

### 4. 登录页出现 `error=email_not_found`

当前项目需要拿到用户邮箱，才能继续建立账号和会话。

可以先检查：

- 当前 GitHub 账号是否已经完成邮箱验证
- 当前账号是否有可用邮箱
- 授权页里是否正常完成了授权

### 5. 本地明明开着服务，GitHub 还是回不来

通常是下面几种情况：

- 你修改了 `BETTER_AUTH_URL`，但忘了去 GitHub 后台同步修改 callback URL
- Console 页面地址变了，但 `trustedOrigins` 还是旧地址
- Console 走的是独立 API 域名，但前端 API 基址没有改

## 相关文件一览

如果你后面准备继续扩展这条能力，建议先看这些文件：

- `packages/nexus/.env.example`
- `packages/nexus/config.yaml`
- `packages/nexus/src/core/config/better-auth.config.ts`
- `packages/nexus/src/core/security/auth/better-auth.ts`
- `packages/nexus/src/core/security/auth/auth-api.service.ts`
- `packages/console/vite.config.ts`
- `packages/console/src/shared/api/eden.ts`
- `packages/console/src/modules/auth/auth.api.ts`
- `packages/console/src/pages/auth/Login.tsx`
- `docs/authentication.md`
- `docs/console.md`

## GitHub 官方参考

如果你想对照 GitHub 后台步骤，可以继续看这些官方文档：

- 创建 OAuth App：https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
- 修改 OAuth App：https://docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps/modifying-an-oauth-app
- OAuth 授权说明：https://docs.github.com/en/apps/oauth-apps/using-oauth-apps/authorizing-oauth-apps
- Client ID / Client Secret 说明：https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api
