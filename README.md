# XDD Zone Core

XDD Zone Core 是一个基于 pnpm workspace 和 Turborepo 的 monorepo，当前维护一个前端控制台、一个 Hono API 服务、一份接口约定包和一份共享 ESLint / Prettier 配置。

## 现在有哪些包

- `@xdd-zone/console`
  前端控制台，放在 `apps/console`。
- `@xdd-zone/nexus`
  Hono API 服务，放在 `apps/nexus`。
- `@xdd-zone/contracts`
  Console 和 Nexus 共用的接口 schema、请求类型、响应类型和错误码，放在 `packages/contracts`。
- `@xdd-zone/eslint-config`
  共享 ESLint / Prettier 配置，放在 `packages/eslint-config`。

## 仓库结构

```text
.
├── apps/
│   ├── console/
│   └── nexus/
├── docs/
├── packages/
│   ├── contracts/
│   └── eslint-config/
├── package.json
├── turbo.json
└── tsconfig.base.json
```

最常看的目录：

- `apps/console/src/app/router`
  前端路由类型、页面记录汇总和路由树。
- `apps/console/src/app/navigation`
  控制台菜单生成。
- `apps/console/src/features`
  Console 页面模块。
- `apps/console/src/layout`
  控制台整体布局。
- `apps/nexus/src/index.ts`
  Hono app、示例接口和 Node 服务启动入口。
- `packages/contracts`
  Console 和 Nexus 共用的接口约定。
- `packages/eslint-config`
  仓库共享的 ESLint / Prettier 配置。

## 技术栈

- Node.js 22+
- pnpm 10+
- Turborepo 2
- React 19 + Vite 8
- Hono 4
- TypeScript 5
- ESLint 9 + Prettier 3

## Monorepo 管理

当前仓库用 pnpm 管理 workspace 和 catalog：

- workspace 范围写在根目录 `pnpm-workspace.yaml` 的 `packages`。
- 公共依赖版本写在根目录 `pnpm-workspace.yaml` 的 `catalog` 和 `catalogs`。
- 子包通过 `catalog:`、`catalog:react`、`catalog:vite`、`catalog:shiki` 引用统一版本。
- 内部包通过 `workspace:*` 引用，例如 Console 和 Nexus 都引用 `@xdd-zone/contracts`。

当前仓库用 Turborepo 管理任务：

- 根目录脚本统一调用 `turbo run ...`。
- `turbo.json` 定义 `dev`、`build`、`lint`、`format`、`type-check`、`test`、`clean`。
- 单独运行某个包时，用包名过滤，比如 `--filter=@xdd-zone/console`。

包名保持当前写法，不改成文章里的 `web`、`admin`、`api`。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发环境

```bash
pnpm dev
```

默认地址：

- Console: `http://localhost:2333`
- Nexus: `http://localhost:7788`
- Health: `http://localhost:7788/health`

如果只想启动一个包：

```bash
pnpm dev:console
pnpm dev:nexus
```

### 3. 请求健康检查

```bash
curl http://localhost:7788/health
```

当前返回：

```json
{
  "status": "ok"
}
```

## 常用命令

```bash
# 开发
pnpm dev
pnpm dev:console
pnpm dev:nexus

# 构建
pnpm build
pnpm build:console
pnpm build:nexus

# 检查
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm type-check

# 清理子包构建产物
pnpm clean
```

## 代码放哪里

### 改前端页面

优先看这些位置：

- `apps/console/src/features/<module>/pages`
- `apps/console/src/features/<module>/routes.tsx`
- `apps/console/src/app/router/records.ts`
- `apps/console/src/layout`

新增页面先放到对应模块的 `pages/` 目录，再写到同模块的 `routes.tsx`。
如果新增了模块，把模块导出的路由记录加到 `apps/console/src/app/router/records.ts`。
菜单从页面记录生成，已有菜单组通常不用改 `app/navigation/navigation.ts`。

### 改后端接口

优先看：

- [docs/nexus.md](./docs/nexus.md)
- `apps/nexus/src/app.ts`
- `apps/nexus/src/routes/index.ts`

新增接口按模块放到 `apps/nexus/src/modules/<module>`，再到 `apps/nexus/src/routes/index.ts` 挂载。
Console 通过 `@xdd-zone/nexus/rpc` 引入 Nexus 的 RPC 类型，再用 `hono/client` 创建 RPC client。
页面不要直接调 `nexusClient`。Console 请求先写到 `apps/console/src/api/<module>/*.api.ts`，再在同模块的 `*.query.ts` 里写 TanStack Query hook。

## 当前接口范围

- `/`
  返回服务名称和状态。
- `/health`
  返回健康检查状态。
- `/rpc/system/ping`
  返回 Nexus ping 结果。

## 文档入口

按任务读文档：

- 改仓库结构或模块职责，看 [docs/architecture.md](./docs/architecture.md)。
- 改开发流程，看 [docs/development.md](./docs/development.md)。
- 改后端接口，看 [docs/nexus.md](./docs/nexus.md) 和 [docs/api.md](./docs/api.md)。
- 改前端页面，看 [docs/console.md](./docs/console.md) 和 [docs/theme.md](./docs/theme.md)。

## 提交前最小检查

```bash
pnpm format:check
pnpm lint
pnpm type-check
```
