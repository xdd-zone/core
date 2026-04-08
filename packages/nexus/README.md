# @xdd-zone/nexus

`@xdd-zone/nexus` 是 XDD Zone Core 的 Elysia API 服务。

## 目录结构

```text
src/
├── index.ts
├── app.ts
├── server.ts
├── modules/
├── core/
├── infra/
├── public/
├── shared/
└── eden/
```

职责划分：

- `modules/`
  - 按功能组织 Elysia 模块
  - 模块目录内直接放路由入口、model、service、repository
- `core/http/`
  - HTTP 基础插件和应用装配
- `core/security/`
  - 认证上下文、守卫、插件和权限能力
- `core/config/`
  - 应用配置
- `infra/`
  - 数据库与日志
- `public/`
  - 提供给前端和联调层使用的公共类型与权限工具
- `shared/`
  - OpenAPI 辅助函数与通用 schema
- `eden/`
  - 仓库内联调和 smoke test

## 模块结构

推荐结构：

```text
modules/<feature>/
├── index.ts
├── model.ts
├── service.ts
├── repository.ts
├── constants.ts
└── types.ts
```

说明：

- `index.ts`
  - Elysia 路由入口
  - 定义 prefix、tags、鉴权和 OpenAPI 说明
- `model.ts`
  - body / query / params / response schema
- `service.ts`
  - 业务编排
- `repository.ts`
  - Prisma 查询与写入

不是每个模块都必须包含全部文件。按当前功能需要组织即可。

## 运行

启动前至少配置：

```env
DATABASE_URL=postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local
BETTER_AUTH_URL=http://localhost:7788
BETTER_AUTH_SECRET=replace-with-a-secure-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

当前 GitHub 登录默认启用。启动前还要确认：

- `packages/nexus/config.yaml` 的 `trustedOrigins` 包含当前 Console 来源
- `packages/nexus/config.yaml` 的 `auth.methods` 已按当前环境设置好
- GitHub OAuth App 的 callback URL 使用 `BETTER_AUTH_URL` 对应的 `/api/auth/callback/github`
- Console 当前使用的 API 基址可以直达 Nexus

登录方式开关统一在 `packages/nexus/config.yaml` 维护：

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

说明：

- `enabled`
  - 控制当前方式是否允许登录
- `allowSignUp`
  - 控制当前方式是否允许首次创建用户
- `google` / `wechat`
  - 当前只控制 Console 登录页状态和后续接入口
  - 这次不注册 OAuth provider

如果当前环境关闭 GitHub 登录，启动时不要求 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`。

数据库约定：

当前项目处于早期阶段，Prisma 暂不维护迁移文件，数据库结构以当前 schema 为准。

修改 schema 后，如果可以直接清空数据，默认执行：

```bash
bun run --filter @xdd-zone/nexus prisma:push:reset
bun run seed
```

如果只想同步 schema，不清空当前数据，使用：

```bash
bun run --filter @xdd-zone/nexus prisma:push
```

```bash
bun run dev
```

默认地址：

- API: `http://localhost:7788/api`
- OpenAPI 页面: `http://localhost:7788/openapi`
- OpenAPI 文档接口: `http://localhost:7788/openapi/json`

## 常用命令

```bash
bun run dev
bun run build
bun run type-check
bun run prisma:generate
bun run prisma:push
bun run prisma:push:reset
bun run prisma:reset
bun run seed
```

## 鉴权与权限

职责说明：

- `core/security/auth/`
  - 接入 Better Auth
  - 解析 session
  - 处理登出
- `core/security/plugins/auth.plugin.ts`
  - 提供会话上下文
  - 支持 `auth: 'required'`
- `core/security/plugins/access.plugin.ts`
  - 组合认证上下文和权限守卫
  - 负责 `permission`、`own`、`me`
- `core/security/permissions/`
  - 维护权限常量和权限查询

约束：

- 固定角色只保留 `superAdmin / user`
- 权限以 `core/security/permissions/permissions.ts` 为准
- `own` 只用于当前用户资料场景

## 响应约定

- 成功响应直接返回业务数据
- 删除或无 body 接口返回 `204`
- 错误响应统一由错误插件处理

## 公共导出

当前对外导出分成两类：

- HTTP 类型
  - `@xdd-zone/nexus/auth-types`
  - `@xdd-zone/nexus/user-types`
  - `@xdd-zone/nexus/rbac-types`
  - `@xdd-zone/nexus/post-types`
  - `@xdd-zone/nexus/media-types`
  - `@xdd-zone/nexus/comment-types`
  - `@xdd-zone/nexus/site-config-types`
  - `@xdd-zone/nexus/public`
- 权限运行时工具
  - `@xdd-zone/nexus/permissions`

说明：

- `*-types` 只放接口相关类型
- `permissions` 放权限常量、角色常量和权限匹配辅助函数
- `public` 当前聚合 Eden 类型和全部 HTTP 类型，不聚合权限运行时工具

## 开发约定

- 模块入口 `index.ts` 直接定义路由
- route schema 与 response schema 统一从模块 `model.ts` 引用
- 给前端使用的 HTTP 类型统一从 `src/public/*-types.ts` 导出
- service 负责业务编排
- repository 负责 Prisma 访问
- OpenAPI 统一使用 `apiDetail(...)`

## 接口概览

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

## 相关文档

- [架构说明](../../docs/architecture.md)
- [开发指南](../../docs/development.md)
- [认证说明](../../docs/authentication.md)
- [RBAC 指南](../../docs/rbac.md)
