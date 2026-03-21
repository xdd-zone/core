# XDD Zone Core

XDD Zone Core 是一个基于 Bun 的后端 monorepo，主要由以下包组成：

- `@xdd-zone/nexus`
  - Elysia API 服务
  - 服务端 contract、OpenAPI、权限与认证能力的真相源
- `@xdd-zone/eslint-config`
  - 仓库共享的 ESLint / Prettier 配置

新增或修改接口的标准动作如下：

```text
改 Nexus contract / route / service / repository
  -> 导出 OpenAPI
  -> 用 Eden / OpenAPI / 测试回归
```

## 架构摘要

- HTTP 边界 schema 主要位于 `packages/nexus/src/modules/*/*.contract.ts` 与 `packages/nexus/src/shared/schema/*`
- route 层使用声明式权限表达：
  - `auth: 'required'`
  - `permission`
  - `own`
  - `me`
- Better Auth 的 HTTP 适配位于 `packages/nexus/src/core/auth/`
- OpenAPI 作为服务端协议导出物保留
- 仓库内联调与 smoke test 使用 Eden 作为内部类型基线

## 仓库结构

```text
.
├── docs/
├── packages/
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

- API: `http://localhost:7788/api`
- OpenAPI UI: `http://localhost:7788/openapi`
- OpenAPI JSON: `http://localhost:7788/openapi/json`
- Health: `http://localhost:7788/api/health`

## 常用命令

```bash
# dev
bun run dev
bun run dev:nexus

# build
bun run build
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

新增或修改接口时，优先按下面的职责拆分：

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

## 文档入口

- [文档总入口](./docs/index.md)
- [架构说明](./docs/architecture.md)
- [开发指南](./docs/development.md)
- [API 指南](./docs/api.md)
- [认证说明](./docs/authentication.md)
- [RBAC 指南](./docs/rbac.md)
- [测试指南](./docs/testing.md)

## 包文档

- [packages/nexus/README.md](./packages/nexus/README.md)
