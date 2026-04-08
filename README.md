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
├── public/
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
- `public/`
  - 提供给前端和联调层使用的公共导出
  - `*-types` 放 HTTP 类型
  - `permissions` 放权限常量和匹配辅助函数
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
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

当前 `packages/nexus` 默认启用 GitHub 登录。启动前还要确认：

- `packages/nexus/config.yaml` 的 `trustedOrigins` 包含当前 Console 来源
- `packages/nexus/config.yaml` 的 `auth.methods` 已按当前环境设置好登录方式
- GitHub OAuth App 的 callback URL 使用 `BETTER_AUTH_URL` 对应的 `/api/auth/callback/github`
- Console 当前使用的 API 基址可以直达 Nexus

登录方式开关统一在 `packages/nexus/config.yaml` 维护，例如：

```yaml
auth:
  methods:
    emailPassword:
      enabled: true
      allowSignUp: true
    github:
      enabled: true
      allowSignUp: true
    google:
      enabled: false
      allowSignUp: false
    wechat:
      enabled: false
      allowSignUp: false
```

字段说明：

- `enabled`
  - 控制这条登录方式是否允许使用
- `allowSignUp`
  - 控制这条登录方式是否允许首次创建用户
- `google` / `wechat`
  - 当前只用于控制登录页状态和后续接入口
  - 这次还不会直接发起 OAuth2 登录

如果关闭邮箱密码登录，Console 登录页会继续保留邮箱表单，但输入框和提交按钮会改为禁用状态，页面布局不会变化。

### 准备数据库

当前项目处于早期阶段，Prisma 暂不维护迁移文件，数据库结构以当前 schema 为准。

首次准备本地数据库时，执行：

```bash
bun run prisma:generate
bun run db prepare
```

修改 schema 后，如果可以直接清空数据，默认执行：

```bash
bun run --filter @xdd-zone/nexus prisma:push:reset
bun run seed
```

如果只想同步 schema，不清空当前数据，使用：

```bash
bun run --filter @xdd-zone/nexus prisma:push
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
bun run db up
bun run db down
bun run db reset
bun run db status
bun run db url
bun run db logs
bun run db prepare
bun run prisma:generate
bun run prisma:push
bun run prisma:push:reset
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
  - 登录、登出、session 查询和 GitHub 登录地址 helper
- `packages/console/src/modules/user`
  - 用户列表、用户详情和资料更新 query / mutation
- `packages/console/src/modules/rbac`
  - 角色、用户角色和权限 query / mutation
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
- `packages/nexus/src/public`
  - `auth-types`、`user-types`、`rbac-types`、`post-types`、`media-types`、`comment-types`、`site-config-types`
  - `permissions`
- `packages/nexus/src/eden`
  - Eden 类型与 smoke test

前后端当前默认按下面方式协作：

- Console 的 query / mutation 直接调用 `packages/console/src/shared/api/eden.ts` 中的 Treaty 客户端
- Console 的 HTTP 类型统一从 `@xdd-zone/nexus/auth-types`、`@xdd-zone/nexus/user-types`、`@xdd-zone/nexus/rbac-types`、`@xdd-zone/nexus/post-types`、`@xdd-zone/nexus/media-types`、`@xdd-zone/nexus/comment-types`、`@xdd-zone/nexus/site-config-types` 引入
- Console 的权限常量和匹配辅助函数统一从 `@xdd-zone/nexus/permissions` 引入
- GitHub 登录继续通过浏览器跳转，地址由 `packages/console/src/modules/auth/auth.api.ts` 统一构造

新增或修改接口时，默认按下面顺序推进：

```text
调整 model
  -> 调整 service / repository
  -> 在模块 index.ts 注册路由
  -> 回归验证
```

## 当前接口

认证：

- `GET /api/auth/methods`
- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `GET /api/auth/sign-in/github`
- `GET /api/auth/callback/github`
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

内容：

- `GET /api/post`
- `POST /api/post`
- `GET /api/post/:id`
- `PATCH /api/post/:id`
- `DELETE /api/post/:id`
- `POST /api/post/:id/publish`
- `POST /api/post/:id/unpublish`

预览：

- `POST /api/preview/markdown`

站点配置：

- `GET /api/site-config`
- `PUT /api/site-config`

媒体：

- `GET /api/media`
- `POST /api/media/upload`
- `GET /api/media/:id`
- `GET /api/media/:id/file`
- `DELETE /api/media/:id`

评论：

- `GET /api/comment`
- `GET /api/comment/:id`
- `PATCH /api/comment/:id/status`
- `DELETE /api/comment/:id`

## 权限模型

- 固定角色：`superAdmin / user`
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
- [GitHub OAuth2 接入指南](./docs/OAuth2/github.md)
- [RBAC 指南](./docs/rbac.md)
