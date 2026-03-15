# 测试指南

## 测试分层

当前仓库主要有 3 类验证：

### 1. 静态检查

```bash
bun run lint
bun run format:check
bun run type-check
```

### 2. 单元 / 插件 / schema 测试

```bash
bun run --filter @xdd-zone/nexus test
bun test packages/schema/test/contracts.test.ts
bun test packages/client/src/core/request.test.ts
```

### 3. 集成脚本

```bash
bun packages/client/test-integration.ts
```

该脚本当前覆盖：

- 管理员 happy path
- 匿名访问 `401`
- 普通用户 own/me 成功路径
- 普通用户访问管理员接口 `403`
- 临时账号创建与清理

## 测试数据库

仓库提供测试数据库管理脚本：

```bash
bun run test:db
bun run test:db start
bun run test:db stop
bun run test:db reset
```

默认测试数据库信息：

- host: `localhost`
- port: `5433`
- user: `postgres`
- password: `postgres`

## 推荐回归流程

### 协议或 client 变更

```bash
bun test packages/client/src/core/request.test.ts
bun packages/client/test-integration.ts
```

### 权限或 auth 变更

```bash
bun run --filter @xdd-zone/nexus test
bun packages/client/test-integration.ts
```

### schema 变更

```bash
bun test packages/schema/test/contracts.test.ts
bun run type-check
```

## 提交前最小检查

```bash
bun run format
bun run lint
bun run type-check
```
