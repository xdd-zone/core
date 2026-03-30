# XDD Zone Core

XDD Zone Core 是一个基于 Bun 的全栈 monorepo，当前同时维护后台前端和 Elysia API 服务~

主要包：

- `@xdd-zone/console`
  - 后台管理前端
  - 负责路由、导航、布局、登录态和系统管理页面接入
- `@xdd-zone/nexus`
  - Elysia API 服务
  - 负责接口、认证、权限、OpenAPI 和 Eden 类型入口
- `@xdd-zone/eslint-config`
  - 仓库共享的 ESLint / Prettier 配置

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

`packages/nexus/src/` 当前结构：

```text
packages/nexus/src/
├── app.ts
├── server.ts
├── index.ts
├── modules/
├── core/
├── infra/
├── shared/
└── eden/
```

其中：

- `modules/`
  - 按功能组织 Elysia 模块
  - 每个模块的 `index.ts` 直接定义路由入口
  - `model.ts` 放 HTTP schema
  - `service.ts` 放业务编排
  - `repository.ts` 或 `*.repository.ts` 放 Prisma 访问
- `core/http/`
  - HTTP 基础插件和应用装配
- `core/security/`
  - 认证上下文、守卫、插件和权限能力
- `infra/`
  - Prisma、数据库辅助能力、日志
- `shared/`
  - OpenAPI 辅助函数和通用 schema
- `eden/`
  - 仓库内联调与 smoke test 使用的类型入口

## 技术栈

- Bun 1.3.5
- React 19 + Vite 7
- Elysia 1.4.x
- Better Auth 1.4.x
- PostgreSQL + Prisma 7.x
- Zod 4.x
- TypeScript strict

## 快速开始

### 安装依赖

```bash
bun install
```

### 配置环境变量

至少需要：

```env
DATABASE_URL="postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local"
BETTER_AUTH_URL="http://localhost:7788"
BETTER_AUTH_SECRET="replace-with-a-secure-secret"
```

### 准备数据库

```bash
bun run prisma:generate
bun run db:local:prepare
```

### 启动开发服务

```bash
bun run dev
```

默认地址：

- Console: `http://localhost:2333`
- API: `http://localhost:7788/api`
- OpenAPI 页面: `http://localhost:7788/openapi`
- OpenAPI 文档接口: `http://localhost:7788/openapi/json`
- Health: `http://localhost:7788/api/health`

## 常用命令

```bash
# dev
bun run dev
bun run dev:console
bun run dev:nexus

# build
bun run build
bun run build:console
bun run build:nexus

# quality
bun run lint
bun run lint:fix
bun run format
bun run format:check
bun run type-check

# db
bun run db:local:up
bun run db:local:down
bun run db:local:reset
bun run db:local:status
bun run db:local:url
bun run db:local:logs
bun run db:local:prepare
bun run prisma:generate
bun run prisma:migrate
bun run prisma:push
bun run prisma:reset
bun run seed
```

## 开发约定

前端主要目录：

- `packages/console/src/app/router`
  - 路由树、登录重定向和页面元信息
- `packages/console/src/app/navigation`
  - 侧边栏和移动端菜单配置
- `packages/console/src/modules/auth`
  - 登录、登出和 session 查询
- `packages/console/src/modules/user`
  - 用户列表、用户详情和资料更新请求
- `packages/console/src/modules/rbac`
  - 角色、用户角色和权限请求
- `packages/console/src/layout`
  - 后台布局、头部和标签页
- `packages/console/src/pages`
  - 页面入口，包括用户、角色、我的资料、我的权限和示例页

后端主要目录：

- `packages/nexus/src/modules/*/index.ts`
  - 模块路由入口
- `packages/nexus/src/modules/*/model.ts`
  - body / query / params / response schema
- `packages/nexus/src/modules/*/service.ts`
  - 业务编排
- `packages/nexus/src/modules/*/repository.ts`
  - Prisma 访问
- `packages/nexus/src/core/security`
  - 认证上下文、守卫、插件和权限能力
- `packages/nexus/src/shared/openapi`
  - `apiDetail(...)`
- `packages/nexus/src/eden`
  - Eden 类型与 smoke test

新增或修改接口时，默认按下面顺序推进：

```text
调整 model
  -> 调整 service / repository
  -> 在模块 index.ts 注册路由
  -> 回归验证
```

## 当前接口

认证：

- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`
- `GET /api/auth/me`

用户：

- `GET /api/user/me`
- `PATCH /api/user/me`
- `GET /api/user`
- `GET /api/user/:id`
- `PATCH /api/user/:id`
- `PATCH /api/user/:id/status`

RBAC：

- `GET /api/rbac/roles`
- `GET /api/rbac/users/:userId/roles`
- `POST /api/rbac/users/:userId/roles`
- `DELETE /api/rbac/users/:userId/roles/:roleId`
- `GET /api/rbac/users/:userId/permissions`
- `GET /api/rbac/users/me/roles`
- `GET /api/rbac/users/me/permissions`

## 权限模型

- 固定角色：`superAdmin / admin / user`
- 权限以 `packages/nexus/src/core/security/permissions/permissions.ts` 为准
- `own` 只用于当前用户资料场景
- 后台前端默认以后端 `401 / 403` 结果为准

## 相关文档

- [文档入口](./docs/index.md)
- [Console 前端指南](./docs/console.md)
- [架构说明](./docs/architecture.md)
- [开发指南](./docs/development.md)
- [API 指南](./docs/api.md)
- [认证说明](./docs/authentication.md)
- [RBAC 指南](./docs/rbac.md)
