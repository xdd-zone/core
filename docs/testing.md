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
```

`@xdd-zone/nexus` 现在有测试命令，但仓库里还没有测试文件：

```bash
cd apps/nexus
pnpm test
```

这个命令当前使用 `vitest run --passWithNoTests`。

## 只改文档

只改 `docs/` 或 README 时，当前没有单独的 Markdown 检查命令。

手动确认：

- 文档里的路径存在。
- 文档里的命令存在。
- 文档没有写当前代码里没有的接口、页面、目录和环境变量。
