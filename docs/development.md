# 开发指南

这份文档只写当前仓库的常用开发动作。

## 开发前先确认

- Node.js 22+
- pnpm 10+

## 初始化

```bash
pnpm install
```

## Monorepo 命令入口

根目录脚本通过 Turborepo 调用各个 workspace：

- `apps/console` 的包名是 `@xdd-zone/console`
- `apps/nexus` 的包名是 `@xdd-zone/nexus`
- `packages/eslint-config` 的包名是 `@xdd-zone/eslint-config`

单独运行一个包时，用根目录脚本，不需要先 `cd` 到子目录。

## 常用开发命令

```bash
# 前后端一起跑
pnpm dev

# 只跑后端
pnpm dev:nexus

# 只跑前端
pnpm dev:console

# 基础检查
pnpm format
pnpm lint
pnpm type-check
```

## 改后端接口时怎么走

默认顺序：

1. 先改 `apps/nexus/src/index.ts`
2. 再跑检查

当前 Nexus 是基础 Hono 示例服务。新增接口先放在 `apps/nexus/src/index.ts`。如果接口变多，再用 Hono 的 `app.route()` 或 `basePath()` 分组。

## 改前端页面时怎么走

默认顺序：

1. 先看页面路径和菜单是否要一起改
2. 再补页面实现
3. 跑检查

最常改的文件：

- `apps/console/src/app/router/routes.tsx`
- `apps/console/src/app/navigation/navigation.ts`
- `apps/console/src/pages/*`

## 代码该放哪

### 后端

- Hono app、示例接口、Node 启动入口：`apps/nexus/src/index.ts`

### 前端

- 路由树：`app/router/*`
- 菜单：`app/navigation/*`
- 页面组件：`pages/*`
- 布局壳层：`layout/*`

## 回归检查

### 只改文档

当前仓库没有单独检查 `README.md` 和 `docs/` 的命令。

只改 Markdown 时，先手动检查这几件事：

1. 文档里的路径在仓库里能找到
2. 文档里的命令在当前 `package.json` 里存在
3. 文档里的接口、环境变量和页面路径没有写旧

如果同时改了 `packages/` 里的内容，再补：

```bash
pnpm format:check
```

### 改前端

```bash
pnpm lint:console
pnpm type-check:console
pnpm build:console
```

### 改后端接口

```bash
pnpm type-check:nexus
pnpm build:nexus
```

### 提交前最小检查

```bash
pnpm format:check
pnpm lint
pnpm type-check
```
