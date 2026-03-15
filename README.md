# XDD Zone Core

XDD Zone Core 是一个基于 Bun 的后端 monorepo，当前由 3 个核心包组成：

- `@xdd-zone/nexus`：Elysia API 服务
- `@xdd-zone/client`：HTTP Client SDK
- `@xdd-zone/schema`：跨服务端与客户端共享的唯一契约源

当前主架构采用 Elysia-first 结构：

- 服务端使用 `app.ts + server.ts + plugins/ + routes/ + modules/`
- 成功响应直接返回业务数据
- 错误响应统一由错误插件输出
- client 默认直接返回业务数据
- schema 统一维护请求、领域对象、HTTP 成功契约和错误契约

## 仓库结构

```text
.
├── docs/
├── packages/
│   ├── client/
│   ├── nexus/
│   └── schema/
├── scripts/
├── package.json
└── tsconfig.base.json
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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/xdd_core"
BETTER_AUTH_URL="http://localhost:7788"
BETTER_AUTH_SECRET="replace-with-a-secure-secret"
```

### 3. 初始化数据库

```bash
bun run prisma:generate
bun run prisma:push
bun run seed
```

### 4. 启动开发服务

```bash
bun run dev
```

默认地址：

- API: `http://localhost:7788/api`
- OpenAPI: `http://localhost:7788/openapi`
- Health: `http://localhost:7788/api/health`

## 常用命令

```bash
# dev
bun run dev
bun run dev:nexus
bun run dev:client

# build
bun run build
bun run build:nexus
bun run build:client

# quality
bun run lint
bun run lint:fix
bun run format
bun run format:check
bun run type-check

# db
bun run prisma:generate
bun run prisma:migrate
bun run prisma:push
bun run prisma:reset
bun run seed

# test db
bun run test:db
bun run test:db start
bun run test:db stop
bun run test:db reset
```

## 当前开发约定

- `packages/nexus/src/routes/*` 只负责 route、schema、plugin 组合与 service 调用
- `packages/nexus/src/modules/*` 是纯业务层
- 鉴权职责拆分为：
  - `authPlugin`：读取会话
  - `protectedPlugin`：要求登录
  - `permissionPlugin + permit`：权限判断
- 分页成功结构统一为：
  - `items`
  - `total`
  - `page`
  - `pageSize`
  - `totalPages`

## 文档入口

- [文档总入口](./docs/index.md)
- [架构说明](./docs/architecture.md)
- [API 指南](./docs/api.md)
- [开发指南](./docs/development.md)
- [项目 Skill](./docs/skills.md)

## 包文档

- [packages/nexus/README.md](./packages/nexus/README.md)
- [packages/client/README.md](./packages/client/README.md)
- [packages/schema/README.md](./packages/schema/README.md)
