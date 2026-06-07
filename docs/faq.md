# 常见问题

## 当前是什么技术栈

当前仓库是 `pnpm + Turborepo + React + Hono` 的 monorepo。

主要包：

- `apps/console`
- `apps/nexus`
- `packages/eslint-config`

## Nexus 地址是什么

本地默认地址：

```text
http://localhost:7788
```

健康检查：

```text
http://localhost:7788/health
```

## OpenAPI 地址是什么

当前没有 OpenAPI 页面。

## 为什么认证、权限和数据库文档都很短

因为当前代码里还没有这些功能。

旧技术栈重构后，这些专题先保留入口，只写当前状态，避免按旧文档去找不存在的代码。

## Console 地址是什么

本地默认地址：

```text
http://localhost:2333
```

启动命令：

```bash
pnpm dev:console
```

## 本机检查怎么跑

```bash
pnpm format:check
pnpm lint
pnpm type-check
```
