# 测试和检查

这份文档只写当前仓库能直接跑的命令。

## 根目录检查

```bash
pnpm format:check
pnpm lint
pnpm type-check
```

如果要直接格式化：

```bash
pnpm format
```

## Console 检查

```bash
pnpm lint:console
pnpm type-check:console
pnpm build:console
```

## Nexus 检查

```bash
pnpm type-check:nexus
pnpm build:nexus
cd apps/nexus && pnpm test
```

`@xdd-zone/nexus` 的测试文件放在：

```text
apps/nexus/src/test
```

接口测试使用 `app.request()`，不需要启动真实端口。

## Bobo 检查

```bash
pnpm lint:bobo
pnpm type-check:bobo
pnpm build:bobo
```

只改 `apps/bobo` 的 Markdown 时，可以只跑：

```bash
pnpm --filter @xdd-zone/bobo format:check
```

## 只改文档

只改 `docs/` 或 README 时，当前没有单独的 Markdown 检查命令。

手动确认：

- 文档里的路径存在。
- 文档里的命令存在。
- 文档没有写当前代码里没有的接口、页面、目录和环境变量。
