# 测试指南

## 测试分层

仓库主要有 3 类验证。

### 1. 静态检查

```bash
bun run lint
bun run format:check
bun run type-check
```

### 2. Nexus 测试

```bash
bun run --filter @xdd-zone/nexus test
```

覆盖内容：

- `core/security/plugins/auth.plugin.ts` 基础行为
- `core/security/plugins/access.plugin.ts` 基础行为
- `permission / own / me` 基础行为
- Eden typed smoke：
  - `/api/health`
  - 匿名 `/api/auth/get-session`
  - 登录态 `/api/auth/me`
  - own `/api/user/me`
  - own `/api/user/:id`
  - 超管 `/api/user`
  - 超管 `/api/user/:id`
  - 超管 `/api/user/:id/status`
  - `/api/rbac/users/:userId/roles`
  - `/api/rbac/users/:userId/permissions`
  - me `/api/rbac/users/me/roles`
  - me `/api/rbac/users/me/permissions`
- OpenAPI smoke：
  - `/openapi/json` 可访问
  - 关键路径进入当前接口说明
  - 当前至少覆盖健康检查、认证、用户与 RBAC 关键路径
  - 认证关键路径包含 `/api/auth/sign-in/github` 和 `/api/auth/callback/github`

### 3. OpenAPI 运行时验证

主要覆盖：

- `/openapi/json` 可访问
- 关键路径进入当前 OpenAPI 文档
- 文档内容与当前认证、用户和 RBAC 路由一致

## 本地数据库

仓库提供统一的本地数据库 CLI：

```bash
bun run db up
bun run db down
bun run db reset
bun run db prepare
```

默认本地数据库信息：

- host: `localhost`
- port: `55432`
- database: `xdd_core_local`
- user: `xdd`
- password: `xdd_local_dev`

推荐先执行：

```bash
bun run db prepare
```

然后再执行 `packages/nexus` 的测试或手动 Prisma 操作。

如果需要手动同步 schema / seed：

```bash
DATABASE_URL=postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local bun run --filter @xdd-zone/nexus prisma:push
DATABASE_URL=postgresql://xdd:xdd_local_dev@localhost:55432/xdd_core_local bun run --filter @xdd-zone/nexus seed
```

## 推荐流程

### 改了接口定义 / OpenAPI / route

```bash
bun run --filter @xdd-zone/nexus type-check
bun run --filter @xdd-zone/nexus test
```

### 改了 auth / permission / own / me

```bash
bun run --filter @xdd-zone/nexus test
```

### 改了 RBAC / 用户底座

```bash
bun run --filter @xdd-zone/nexus test
```

### 只改了文档或低风险说明

```bash
bun run format:check
```

## 提交前最小检查

```bash
bun run format
bun run lint
bun run type-check
```

如果这次改动触及了接口定义或鉴权，再加上：

```bash
bun run --filter @xdd-zone/nexus test
```
