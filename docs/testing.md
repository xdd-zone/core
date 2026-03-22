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

- `authPlugin` 基础行为
- `permission / own / me` 基础行为
- Eden typed smoke：
  - `/api/health`
  - 匿名 `/api/auth/get-session`
  - 登录态 `/api/auth/me`
  - own `/api/user/:id`
  - own `/api/rbac/users/:userId/permissions`
  - me `/api/rbac/users/me/roles`
  - me `/api/rbac/users/me/permissions`
- OpenAPI smoke：
  - `/openapi/json` 可导出
  - 关键路径进入导出物

### 3. OpenAPI 导出验证

```bash
bun run --filter @xdd-zone/nexus export:openapi
```

主要覆盖：

- OpenAPI 可正常导出
- 不再写入已删除目录
- 导出产物落到 `packages/nexus/openapi/openapi.json`

## 本地数据库

仓库提供统一的本地数据库运行时：

```bash
bun run db:local:up
bun run db:local:down
bun run db:local:reset
bun run db:local:prepare
```

默认本地数据库信息：

- host: `localhost`
- port: `55432`
- database: `xdd_core_local`
- user: `xdd`
- password: `xdd_local_dev`

推荐先执行：

```bash
bun run db:local:prepare
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
bun run --filter @xdd-zone/nexus export:openapi
bun run --filter @xdd-zone/nexus type-check
bun run --filter @xdd-zone/nexus test
```

### 改了 auth / permission / own / me

```bash
bun run --filter @xdd-zone/nexus test
bun run --filter @xdd-zone/nexus export:openapi
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
bun run --filter @xdd-zone/nexus export:openapi
```
