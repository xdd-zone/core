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
- `core/security/`
  认证、权限、守卫、插件。
- `core/http/`
  CORS、OpenAPI、错误处理、请求日志。
- `core/config/`
  读取 `config.yaml` 和环境变量。
- `public/`
  给前端复用的类型、Eden 类型、权限常量。

## 模块怎么组织

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

当前约定：

- `index.ts` 写路由、schema 绑定、鉴权声明、`apiDetail(...)`
- `model.ts` 写 body / query / params / response schema
- `service.ts` 写业务逻辑
- `repository.ts` 写 Prisma 查询和写入

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

### 其他导出

- `@xdd-zone/nexus/eden`
  Eden 类型入口。
- `@xdd-zone/nexus/permissions`
  权限常量、角色常量、权限匹配函数。
- `@xdd-zone/nexus/public`
  聚合 HTTP 类型和 Eden 类型。

## 当前接口分组

- `/api/auth/*`
- `/api/user/*`
- `/api/rbac/*`
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
