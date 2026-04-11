# XDD Zone Core

XDD Zone Core 是一个基于 Bun 的 monorepo，当前同时维护后台前端和 Elysia API 服务。

## 现在有哪些包

- `@xdd-zone/console`
  后台管理前端，放页面、路由、导航、布局、认证联调和主题。
- `@xdd-zone/nexus`
  后端 API 服务，放接口、认证、权限、OpenAPI、Eden 类型和 Prisma 接入。
- `@xdd-zone/eslint-config`
  仓库共享的 ESLint / Prettier 配置。

## 仓库结构

```text
.
├── docs/
├── packages/
│   ├── console/
│   ├── eslint-config/
│   └── nexus/
├── scripts/
├── package.json
└── tsconfig.base.json
```

最常看的目录：

- `packages/console/src/app/router`
  前端路由、登录校验、重定向。
- `packages/console/src/app/navigation`
  后台菜单和导航分组。
- `packages/console/src/modules`
  前端 query / mutation 和页面侧逻辑。
- `packages/nexus/src/modules`
  后端业务模块，`index.ts` 直接定义路由。
- `packages/nexus/src/core/security`
  认证、权限、守卫和插件。
- `packages/nexus/src/public`
  给前端复用的 HTTP 类型、Eden 类型、权限常量。

## 技术栈

- Bun 1.3.5
- React 19 + Vite 8
- Elysia 1.4.x
- Better Auth 1.5.x
- PostgreSQL + Prisma 7.x
- Zod 4.x
- TypeScript strict

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配环境变量

本地至少准备这些值：

```env
DATABASE_URL=postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local
BETTER_AUTH_URL=http://localhost:7788
BETTER_AUTH_SECRET=replace-with-a-secure-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

还要确认：

- `packages/nexus/config.yaml` 里的 `auth.trustedOrigins` 包含当前 Console 地址。
- `packages/nexus/config.yaml` 里的 `auth.methods` 已按当前环境打开或关闭登录方式。
- GitHub OAuth App 的 callback URL 是 `{BETTER_AUTH_URL}/api/auth/callback/github`。

### 3. 准备数据库

```bash
bun run db prepare
```

如果你刚改了 Prisma schema，并且可以直接清空本地数据，执行：

```bash
bun run prisma:push:reset
bun run seed
```

如果只想同步 schema，不清空数据：

```bash
bun run prisma:push
```

### 4. 启动开发环境

```bash
bun run dev
```

默认地址：

- Console: `http://localhost:2333`
- API: `http://localhost:7788/api`
- OpenAPI 页面: `http://localhost:7788/openapi`
- OpenAPI JSON: `http://localhost:7788/openapi/json`
- Health: `http://localhost:7788/api/health`

## 常用命令

```bash
# 开发
bun run dev
bun run dev:console
bun run dev:nexus

# 构建
bun run build
bun run build:console
bun run build:nexus

# 检查
bun run lint
bun run lint:fix
bun run format
bun run format:check
bun run type-check

# 数据库
bun run db up
bun run db down
bun run db status
bun run db logs
bun run db prepare
bun run prisma:generate
bun run prisma:push
bun run prisma:push:reset
bun run prisma:reset
bun run seed
```

## 代码放哪里

### 改后端接口

优先看这些位置：

- `packages/nexus/src/modules/<feature>/model.ts`
- `packages/nexus/src/modules/<feature>/service.ts`
- `packages/nexus/src/modules/<feature>/repository.ts`
- `packages/nexus/src/modules/<feature>/index.ts`

默认顺序：

```text
先改 model.ts
-> 再改 service.ts / repository.ts
-> 最后在 index.ts 注册或调整路由
```

### 改前端页面

优先看这些位置：

- `packages/console/src/app/router/routes.tsx`
- `packages/console/src/app/router/guards.tsx`
- `packages/console/src/app/navigation/navigation.ts`
- `packages/console/src/modules/*`
- `packages/console/src/pages/*`
- `packages/console/src/app/access/access-control.ts`

当前前端直接用 `packages/console/src/shared/api/eden.ts` 里的 Treaty 客户端调接口，不再单独维护一层 1:1 的 `*.api.ts` 包装。

### 改认证、权限、GitHub 登录

优先看这些位置：

- `packages/nexus/src/core/security/auth`
- `packages/nexus/src/core/security/plugins`
- `packages/nexus/src/core/security/guards`
- `packages/nexus/src/core/security/permissions`
- `packages/console/src/modules/auth`
- `packages/console/src/pages/auth/Login.tsx`

## 当前接口范围

当前仓库已经有这些接口分组：

- 认证：`/api/auth/*`
- 用户：`/api/user/*`
- RBAC：`/api/rbac/*`
- 文章：`/api/post/*`
- Markdown 预览：`/api/preview/markdown`
- 站点配置：`/api/site-config`
- 媒体：`/api/media/*`
- 评论：`/api/comment/*`

完整路径和说明看 [docs/api.md](./docs/api.md)。

## 文档入口

按任务读文档：

- 先看 [docs/index.md](./docs/index.md)
- 改仓库结构或模块职责，看 [docs/architecture.md](./docs/architecture.md)
- 改开发流程，看 [docs/development.md](./docs/development.md)
- 改接口，看 [docs/api.md](./docs/api.md)
- 改认证或 GitHub 登录，看 [docs/authentication.md](./docs/authentication.md) 和 [docs/OAuth2/github.md](./docs/OAuth2/github.md)
- 改权限，看 [docs/rbac.md](./docs/rbac.md)
- 改前端页面，看 [docs/console.md](./docs/console.md) 和 [docs/theme.md](./docs/theme.md)

## 提交前最小检查

```bash
bun run format
bun run lint
bun run type-check
```

如果这次改动碰到接口、认证、权限、OpenAPI 或 Eden，再加上：

```bash
bun run --filter @xdd-zone/nexus test
```
