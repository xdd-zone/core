# GitHub OAuth2 接入指南

这份文档只写当前仓库怎么接 GitHub 登录。

## 先准备这几个值

| 名称 | 用途 | 本地示例 |
| ---- | ---- | ---- |
| Console 地址 | 用户打开后台的地址 | `http://localhost:2333` |
| Nexus 服务根地址 | 写到 `BETTER_AUTH_URL` | `http://localhost:7788` |
| GitHub callback URL | GitHub 授权完成后回调到 Nexus 的地址 | `http://localhost:7788/api/auth/callback/github` |
| 前端 API 基址 | Console 在浏览器里访问 API 的地址 | 本地默认走 `/api` 代理 |

callback URL 固定写成：

```text
{BETTER_AUTH_URL}/api/auth/callback/github
```

## 第 1 步：在 GitHub 创建 OAuth App

当前项目用的是 GitHub OAuth App，不是 GitHub App。

GitHub 后台里这样填：

| 字段 | 怎么填 | 本地示例 |
| ---- | ---- | ---- |
| `Application name` | 写一个能区分环境的名字 | `xdd-zone-core-local` |
| `Homepage URL` | 写 Console 地址 | `http://localhost:2333` |
| `Authorization callback URL` | 写 callback URL | `http://localhost:7788/api/auth/callback/github` |

创建完成后拿到：

- `Client ID`
- `Client Secret`

## 第 2 步：写环境变量

至少准备这些：

```env
DATABASE_URL=postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local
BETTER_AUTH_URL=http://localhost:7788
BETTER_AUTH_SECRET=replace-with-a-secure-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 第 3 步：打开项目配置

在 `packages/nexus/config.yaml` 里确认：

```yaml
auth:
  trustedOrigins:
    - http://localhost:2333
  methods:
    github:
      enabled: true
      allowSignUp: true
```

要点：

- `trustedOrigins` 只写来源，不带路径
- `enabled` 控制 GitHub 登录是否可用
- `allowSignUp` 控制第一次 GitHub 登录时是否允许自动创建账号

## 第 4 步：确认前端 API 地址

本地默认走 Vite 代理：

- 浏览器访问 `http://localhost:2333`
- 前端请求 `/api/*`
- Vite 转发到 `http://localhost:7788`

如果你不用默认代理，就在前端环境变量里配置：

- `VITE_API_ORIGIN`
- `VITE_API_ROOT`
- `VITE_API_BASE_URL`

三者选一个即可。

## 第 5 步：启动并验证

```bash
bun run dev
```

按这个顺序验证：

1. 打开 `http://localhost:2333/login`
2. 点击 GitHub 登录
3. 浏览器跳到 GitHub 授权页
4. GitHub 授权完成后回到 Console
5. 页面进入 `/dashboard` 或原来的 `redirect` 地址
6. `GET /api/auth/get-session` 能拿到当前用户

## 相关代码位置

### 后端

- `packages/nexus/src/core/security/auth/better-auth.ts`
- `packages/nexus/src/core/security/auth/auth-api.service.ts`
- `packages/nexus/src/core/security/auth/auth-methods.service.ts`
- `packages/nexus/src/modules/auth/index.ts`

### 前端

- `packages/console/src/modules/auth/auth.api.ts`
- `packages/console/src/modules/auth/auth.query.ts`
- `packages/console/src/pages/auth/Login.tsx`
- `packages/console/src/shared/api/eden.ts`

## 常见问题

### 登录入口打不开

先看：

1. `github.enabled` 是否已打开
2. `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 是否存在
3. 前端 API 基址是否能访问后端

### 授权成功后回到登录页

先看：

1. GitHub callback URL 是否正确
2. `trustedOrigins` 是否包含当前前端地址
3. `BETTER_AUTH_URL` 是否和后端实际地址一致
4. 登录页 URL 上的 `error` 参数是什么
