# XDD Zone Core

XDD Zone Core 是一个基于 pnpm workspace 和 Turborepo 的 monorepo，当前维护一个前端控制台、一个 Hono API 服务、一个个人站点、一份接口约定包和一份共享 ESLint / Prettier 配置。

## 现在有哪些包

- `@xdd-zone/fifa`
  前端控制台，放在 `apps/fifa`。
- `@xdd-zone/momo`
  Hono API 服务，放在 `apps/momo`。
- `@xdd-zone/bobo`
  个人站点，放在 `apps/bobo`。
- `@xdd-zone/contracts`
  Fifa 和 Momo 共用的接口 schema、请求类型、响应类型和错误码，放在 `packages/contracts`。
- `@xdd-zone/catppuccin-theme`
  Fifa 和 Bobo 共用的 Catppuccin 主题，放在 `packages/catppuccin-theme`。
- `@xdd-zone/eslint-config`
  共享 ESLint / Prettier 配置，放在 `packages/eslint-config`。

## 仓库结构

```text
.
├── apps/
│   ├── fifa/
│   ├── momo/
│   └── bobo/
├── docs/
│   ├── apps/
│   ├── topics/
│   └── integrations/
├── packages/
│   ├── catppuccin-theme/
│   ├── contracts/
│   └── eslint-config/
├── package.json
├── turbo.json
└── tsconfig.base.json
```

最常看的目录：

- `apps/fifa/src/app/router`
  前端路由类型、页面记录汇总和路由树。
- `apps/fifa/src/app/navigation`
  控制台菜单生成。
- `apps/fifa/src/features`
  Fifa 页面模块。
- `apps/fifa/src/layout`
  控制台整体布局。
- `apps/momo/src/index.ts`
  Node 服务启动入口。
- `apps/momo/src/bootstrap`
  Momo runtime、全局中间件、错误处理和路由组装。
- `apps/momo/src/modules`
  Momo 接口模块。
- `packages/contracts`
  Fifa 和 Momo 共用的接口约定。
- `packages/catppuccin-theme`
  Fifa 和 Bobo 共用的 Catppuccin 主题。
- `packages/eslint-config`
  仓库共享的 ESLint / Prettier 配置。

## 技术栈

- Node.js 22+
- pnpm 10+
- Turborepo 2
- React 19 + Vite 8
- Next.js 16
- Hono 4
- TypeScript 5
- ESLint 10 + Prettier 3

## Monorepo 管理

当前仓库用 pnpm 管理 workspace 和 catalog：

- workspace 范围写在根目录 `pnpm-workspace.yaml` 的 `packages`。
- 公共依赖版本写在根目录 `pnpm-workspace.yaml` 的 `catalog` 和 `catalogs`。
- 子包通过 `catalog:`、`catalog:react`、`catalog:vite`、`catalog:shiki` 引用统一版本。
- 内部包通过 `workspace:*` 引用，例如 Fifa 和 Momo 都引用 `@xdd-zone/contracts`。

当前仓库用 Turborepo 管理任务：

- 根目录脚本统一调用 `turbo run ...`。
- `turbo.json` 定义 `dev`、`build`、`lint`、`format`、`type-check`、`test`、`clean`。
- 单独运行某个包时，用包名过滤，比如 `--filter=@xdd-zone/fifa`。

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

- Fifa: `http://localhost:2333`
- Momo: `http://localhost:7788`
- Bobo: `http://localhost:4399`
- Health: `http://localhost:7788/health`

如果只想启动一个包：

```bash
pnpm dev:fifa
pnpm dev:momo
```

### 3. 请求健康检查

```bash
curl http://localhost:7788/health
```

当前返回：

```json
{
  "ok": true,
  "data": {
    "env": "development",
    "service": "momo",
    "status": "ok"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

## 常用命令

```bash
# 开发
pnpm dev
pnpm dev:fifa
pnpm dev:momo
pnpm dev:bobo

# 构建
pnpm build
pnpm build:fifa
pnpm build:momo
pnpm build:bobo

# 检查
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm type-check
pnpm type-check:bobo

# 清理子包构建产物
pnpm clean
```

## 代码放哪里

### 改前端页面

优先看这些位置：

- `apps/fifa/src/features/<module>/pages`
- `apps/fifa/src/features/<module>/routes.tsx`
- `apps/fifa/src/app/router/records.ts`
- `apps/fifa/src/layout`

新增页面先放到对应模块的 `pages/` 目录，再写到同模块的 `routes.tsx`。
如果新增了模块，把模块导出的路由记录加到 `apps/fifa/src/app/router/records.ts`。
菜单从页面记录生成，已有菜单组通常不用改 `app/navigation/navigation.ts`。

### 改后端接口

优先看：

- [docs/apps/momo.md](./docs/apps/momo.md)
- `apps/momo/src/bootstrap/create-app.ts`
- `apps/momo/src/routes/index.ts`
- `apps/momo/src/modules/<module>/<module>.route.ts`

新增接口按模块放到 `apps/momo/src/modules/<module>`，再到 `apps/momo/src/routes/index.ts` 挂载。
Fifa 通过 `@xdd-zone/momo/rpc` 引入 Momo 的 RPC 类型，再用 `hono/client` 创建 RPC client。
页面不要直接调 `momoClient`。Fifa 请求先写到 `apps/fifa/src/api/<module>/*.api.ts`，再在同模块的 `*.query.ts` 里写 TanStack Query hook。

### 改个人站点

优先看：

- [docs/apps/bobo.md](./docs/apps/bobo.md)
- `apps/bobo/app/layout.tsx`
- `apps/bobo/app/page.tsx`
- `apps/bobo/app/globals.css`

开发时运行：

```bash
pnpm dev:bobo
```

## 当前接口范围

- `/`
  返回服务名称和状态。
- `/health`
  返回健康检查状态。
- `/rpc/system/ping`
  返回 Momo ping 结果。
- `/api/auth/*`
  交给 `better-auth` 处理登录、登出、OAuth callback 和 session cookie。
- `/rpc/fifa/auth/me`
  返回当前 `fifa` 用户，要求当前用户有 `fifa.owner`。
- `/rpc/bobo/auth/me`
  返回当前 `bobo` 用户，未登录时返回 `user: null`。
- `/rpc/content/posts`
  后台文章列表和创建文章草稿。
- `/rpc/content/posts/:id`
  后台文章详情。
- `/rpc/content/posts/:id/draft`
  保存文章草稿。
- `/rpc/content/posts/:id/preview-token`
  生成文章预览 token。
- `/rpc/content/posts/:id/publish`
  发布文章。
- `/rpc/content/mdx-components`
  返回 MDX 组件清单。
- `/rpc/content/assets/images`
  上传图片素材。
- `/rpc/content/previews/:token`
  使用预览 token 读取文章 revision。
- `/rpc/content/public/posts`
  公开文章列表。
- `/rpc/content/public/posts/:slug`
  公开文章详情。

## 文档入口

按任务读文档：

- 改仓库结构或模块职责，看 [docs/architecture.md](./docs/architecture.md)。
- 改开发流程，看 [docs/development.md](./docs/development.md)。
- 改后端接口，看 [docs/apps/momo.md](./docs/apps/momo.md) 和 [docs/topics/api.md](./docs/topics/api.md)。
- 改前端页面，看 [docs/apps/fifa.md](./docs/apps/fifa.md) 和 [docs/topics/theme.md](./docs/topics/theme.md)。
- 改个人站点，看 [docs/apps/bobo.md](./docs/apps/bobo.md)。

## 提交前最小检查

```bash
pnpm format:check
pnpm lint
pnpm type-check
```
