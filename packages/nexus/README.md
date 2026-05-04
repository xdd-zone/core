# @xdd-zone/nexus

`@xdd-zone/nexus` 是 XDD Zone Core 的 Elysia API 服务。

## 目录结构

```text
src/
├── app.ts
├── server.ts
├── index.ts
├── bootstrap/
├── core/
├── infra/
├── modules/
├── public/
├── shared/
└── eden/
```

最常改的目录：

- `modules/`
  业务模块和接口。
- `core/auth/`
  认证实例、session 和认证接口服务。
- `core/access/`
  认证插件、权限插件和守卫。
- `core/permissions/`
  系统基础权限、权限判断和权限注册表。
- `core/http/`
  CORS、OpenAPI、错误处理、请求日志。
- `core/config/`
  读取 `config.yaml` 和环境变量。
- `public/`
  给前端复用的类型、Eden 类型、权限导出。

## 模块怎么组织

推荐结构：

```text
modules/<feature>/
├── index.ts
├── routes.ts
├── model.ts
├── openapi.ts
├── mapper.ts
├── service.ts
├── repository.ts
├── permissions.ts
├── constants.ts
└── types.ts
```

当前约定：

- `index.ts` 只做该模块的普通导出
- `routes.ts` 写路由、schema 绑定、鉴权声明和 service 调用
- `model.ts` 写 body / query / params / response schema
- `openapi.ts` 写 `apiDetail(...)`
- `mapper.ts` 写数据库数据到 HTTP 返回结构的转换；没有转换逻辑的模块不用建
- `service.ts` 写业务逻辑
- `repository.ts` 写 Prisma 查询和写入
- `permissions.ts` 写该模块自己的权限常量和权限说明

系统基础权限只放在：

```text
src/core/permissions/permissions.ts
```

业务权限放在各自模块，比如：

```text
src/modules/post/permissions.ts
src/modules/media/permissions.ts
src/modules/comment/permissions.ts
src/modules/site-config/permissions.ts
```

业务权限说明汇总在：

```text
src/modules/permissions.ts
```

不要把业务权限写进 `src/core/permissions/permissions.ts`。

## 运行前要配什么

至少准备这些环境变量：

```env
DATABASE_URL=postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local
BETTER_AUTH_URL=http://localhost:7788
BETTER_AUTH_SECRET=replace-with-a-secure-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

还要确认：

- `packages/nexus/config.yaml` 里的 `auth.trustedOrigins` 包含当前前端来源
- `packages/nexus/config.yaml` 里的 `auth.methods` 已按当前环境设置好
- GitHub callback URL 是 `{BETTER_AUTH_URL}/api/auth/callback/github`

## 常用命令

```bash
cd packages/nexus

bun run dev
bun run build
bun run type-check
bun run test
bun run prisma:generate
bun run prisma:push
bun run prisma:push:reset
bun run prisma:reset
bun run seed
```

## 当前公开导出

### HTTP 类型

- `@xdd-zone/nexus/auth-types`
- `@xdd-zone/nexus/user-types`
- `@xdd-zone/nexus/rbac-types`
- `@xdd-zone/nexus/post-types`
- `@xdd-zone/nexus/comment-types`
- `@xdd-zone/nexus/media-types`
- `@xdd-zone/nexus/site-config-types`
- `@xdd-zone/nexus/public-site-types`

### 其他导出

- `@xdd-zone/nexus/eden`
  Eden 类型入口。
- `@xdd-zone/nexus/permissions`
  系统权限、业务权限、角色常量、权限匹配函数。
- `@xdd-zone/nexus/public`
  聚合 HTTP 类型和 Eden 类型。

## 当前接口分组

- `/api/auth/*`
- `/api/user/*`
- `/api/rbac/*`
- `/api/public-site/*`
- `/api/post/*`
- `/api/preview/markdown`
- `/api/site-config`
- `/api/media/*`
- `/api/comment/*`

## 改接口时的默认顺序

```text
先改 model.ts
-> 再改 service.ts / repository.ts
-> 最后改 index.ts
-> 再看 OpenAPI 和测试
```

## 相关文档

- [仓库 README](../../README.md)
- [架构说明](../../docs/architecture.md)
- [开发指南](../../docs/development.md)
- [API 指南](../../docs/api.md)
- [认证说明](../../docs/authentication.md)
- [RBAC 指南](../../docs/rbac.md)
- [Eden 指南](../../docs/eden.md)
