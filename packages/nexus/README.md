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

```bash
bun run dev
```

默认地址：

- API: `http://localhost:7788/api`
- OpenAPI UI: `http://localhost:7788/openapi`
- OpenAPI JSON: `http://localhost:7788/openapi/json`

## 常用命令

```bash
bun run dev
bun run build
bun run type-check
bun run prisma:generate
bun run prisma:migrate
bun run prisma:push
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

- 固定角色只保留 `superAdmin / admin / user`
- 权限以 `core/security/permissions/permissions.ts` 为准
- `own` 只用于当前用户资料场景

## 响应约定

- 成功响应直接返回业务数据
- 删除或无 body 接口返回 `204`
- 错误响应统一由错误插件处理

## 开发约定

- 模块入口 `index.ts` 直接定义路由
- route schema 与 response schema 统一从模块 `model.ts` 引用
- service 负责业务编排
- repository 负责 Prisma 访问
- OpenAPI 统一使用 `apiDetail(...)`

## 接口概览

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

## 相关文档

- [架构说明](../../docs/architecture.md)
- [开发指南](../../docs/development.md)
- [认证说明](../../docs/authentication.md)
- [RBAC 指南](../../docs/rbac.md)
