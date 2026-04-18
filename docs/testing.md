# 测试指南

这份文档只列当前仓库常用的检查命令。

## 基础检查

```bash
bun run format
bun run lint
bun run type-check
```

如果只想先看格式：

```bash
bun run format:check
```

## Nexus 测试

```bash
bun run --filter @xdd-zone/nexus test
```

当前会覆盖：

- Eden smoke
- OpenAPI smoke
- 认证接口
- 用户接口
- RBAC 接口
- 登录态和权限语义

## Console 检查

```bash
bun run lint:console
bun run --filter @xdd-zone/console type-check
bun run build:console
```

## 本地数据库

常用命令：

```bash
bun run db up
bun run db down
bun run db status
bun run db logs
bun run db prepare
```

本地默认数据库：

- host: `localhost`
- port: `55432`
- database: `xdd_core_local`
- user: `xdd`
- password: `xdd_local_dev`

## 按改动类型选命令

### 只改文档

当前根目录的 `bun run format:check` 只检查 `packages/`，不会检查 `README.md` 和 `docs/`。

只改 Markdown 时，先手动核对：

1. 路径和文件名是否存在
2. 命令名是否和 `package.json` 一致
3. 接口地址、环境变量和页面路径是否还是当前实现

如果这次改动同时碰了 `packages/` 里的文件，再补：

```bash
bun run format:check
```

### 改前端

```bash
bun run lint:console
bun run --filter @xdd-zone/console type-check
bun run build:console
```

### 改后端接口、认证、权限、OpenAPI、Eden

```bash
bun run --filter @xdd-zone/nexus type-check
bun run --filter @xdd-zone/nexus test
```

### 提交前最小检查

```bash
bun run format
bun run lint
bun run type-check
```
