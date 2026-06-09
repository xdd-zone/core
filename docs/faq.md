# 常见问题

## 当前是什么技术栈

当前仓库是 `pnpm + Turborepo + React + Hono` 的 monorepo。

主要包：

- `apps/fifa`
- `apps/momo`
- `packages/eslint-config`

## Momo 地址是什么

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

## Fifa 地址是什么

本地默认地址：

```text
http://localhost:2333
```

启动命令：

```bash
pnpm dev:fifa
```

## 本机检查怎么跑

```bash
pnpm format:check
pnpm lint
pnpm type-check
```
