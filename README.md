# XDD Zone Core

XDD Zone Core 是一个基于 Bun 的全栈 monorepo，当前同时包含后端 API 与后台管理前端，主要由以下包组成：

- `@xdd-zone/console`
  - 后台管理前端
  - 基于 `nexus` session 的后台前端
  - 消费服务端认证与业务接口
- `@xdd-zone/nexus`
  - Elysia API 服务
  - 服务端接口定义、OpenAPI、权限与认证能力的唯一来源
- `@xdd-zone/eslint-config`
  - 仓库共享的 ESLint / Prettier 配置

新增或修改接口的标准动作如下：

```text
改 Nexus 接口定义 / route / service / repository
  -> 导出 OpenAPI
  -> 用 Eden / OpenAPI / 测试回归
```

## 架构摘要

- `packages/console` 是后台前端，负责路由、导航、布局与登录态消费
- `packages/nexus` 只维护一套 HTTP 接口定义
- 固定系统角色为 `superAdmin / admin / user`
- 权限表达围绕固定角色和稳定权限能力展开
- `own` 只用于用户自己的资料场景，资源归属判断由具体业务模块自行负责
- Better Auth 的 HTTP 适配位于 `packages/nexus/src/core/auth/`
- OpenAPI 作为服务端接口说明导出物保留
- 仓库内联调与 smoke test 使用 Eden 作为内部类型基线

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

更细一点的服务端结构：

```text
packages/nexus/src/
├── app.ts
├── server.ts
├── routes/
├── modules/
├── core/
├── infra/
├── shared/
└── eden/
```

## 技术栈

- Bun 1.3.5
- React 19 + Vite 7
- Elysia 1.4.x
- Better Auth 1.4.x
- PostgreSQL + Prisma 7.x
- Zod 4.x
- TypeScript strict

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

至少需要：

```env
DATABASE_URL="postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local"
BETTER_AUTH_URL="http://localhost:7788"
BETTER_AUTH_SECRET="replace-with-a-secure-secret"
```

### 3. 准备本地数据库

```bash
bun run prisma:generate
bun run db:local:prepare
```

### 4. 启动开发服务

```bash
bun run dev
```

默认地址：

- Console: `http://localhost:2333`
- API: `http://localhost:7788/api`
- OpenAPI UI: `http://localhost:7788/openapi`
- OpenAPI JSON: `http://localhost:7788/openapi/json`
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

# openapi export
bun run --filter @xdd-zone/nexus export:openapi

```

## 日常开发模型

后台前端改动时，优先按下面的职责拆分：

- `packages/console/src/app/router`
  - 应用级路由与登录守卫
- `packages/console/src/app/navigation`
  - 后台菜单配置
- `packages/console/src/modules/auth`
  - session 请求与 auth store
- `packages/console/src/layout`
  - 布局、侧边栏、头部、TabBar
- `packages/console/src/pages`
  - 页面入口

当前 `console` 采用的基础模型：

- 路由只区分 public / protected
- 登录态唯一真相源是 `/api/auth/get-session`
- 菜单与路由解耦
- 细粒度权限以后端 `401 / 403` 为准

后端接口改动时，优先按下面的职责拆分：

- `packages/nexus/src/modules/*/*.contract.ts`
  - 定义 body / query / params / response
- `packages/nexus/src/routes/*.route.ts`
  - 负责 HTTP 结构、声明式权限、`apiDetail(...)`
- `packages/nexus/src/modules/*/*.service.ts`
  - 负责业务编排
- `packages/nexus/src/modules/*/*.repository.ts`
  - 负责 Prisma 访问
- `packages/nexus/openapi/openapi.json`
  - 服务端导出的 OpenAPI 文档产物

## 当前能力

认证与会话：

- 注册、登录、登出、获取会话

用户资料：

- `GET /api/user/me`
- `PATCH /api/user/me`
- `GET /api/user`
- `GET /api/user/:id`
- `PATCH /api/user/:id`
- `PATCH /api/user/:id/status`

RBAC 底座：

- `GET /api/rbac/roles`
- `GET /api/rbac/users/:userId/roles`
- `POST /api/rbac/users/:userId/roles`
- `DELETE /api/rbac/users/:userId/roles/:roleId`
- `GET /api/rbac/users/:userId/permissions`
- `GET /api/rbac/users/me/roles`
- `GET /api/rbac/users/me/permissions`

系统角色与权限：

- `superAdmin`
- `admin`
- `user`
- `user:read:own`
- `user:update:own`
- `user:read:all`
- `user:update:all`
- `user:disable:all`
- `role:read:all`
- `user_role:assign:all`
- `user_role:revoke:all`
- `user_permission:read:own`
- `user_permission:read:all`
- `system:manage`

## 文档入口

- [文档总入口](./docs/index.md)
- [架构说明](./docs/architecture.md)
- [Console 前端指南](./docs/console.md)
- [开发指南](./docs/development.md)
- [API 指南](./docs/api.md)
- [认证说明](./docs/authentication.md)
- [RBAC 指南](./docs/rbac.md)
- [测试指南](./docs/testing.md)

## 包文档

- [packages/console/README.md](./packages/console/README.md)
- [packages/nexus/README.md](./packages/nexus/README.md)
