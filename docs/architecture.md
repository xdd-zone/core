# 项目结构

这份文档只说明当前代码怎么放。

## 当前包

仓库是 `pnpm + Turborepo` 的 monorepo，当前有六个包：

- `apps/fifa`
  前端控制台，包名是 `@xdd-zone/fifa`。
- `apps/momo`
  Hono API 服务，包名是 `@xdd-zone/momo`。
- `apps/bobo`
  个人站点，包名是 `@xdd-zone/bobo`。
- `packages/eslint-config`
  共享 ESLint / Prettier 配置，包名是 `@xdd-zone/eslint-config`。
- `packages/contracts`
  Fifa 和 Momo 共用的接口类型、schema 和响应结构，包名是 `@xdd-zone/contracts`。
- `packages/catppuccin-theme`
  Fifa 和 Bobo 共用的 Catppuccin 主题，包名是 `@xdd-zone/catppuccin-theme`。

## 根目录

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
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## `apps/momo`

当前 Momo 是 Hono API 服务。

主要文件：

- `apps/momo/src/index.ts`
  直接运行 Momo 时启动 Node 服务。
- `apps/momo/src/app.ts`
  创建运行时 app，给测试和包导出使用。
- `apps/momo/src/bootstrap`
  创建 runtime，注册全局中间件、错误处理、404 和一级路由。
- `apps/momo/src/rpc.ts`
  只导出 `AppType` 类型，给 Fifa 的 Hono RPC client 使用。
- `apps/momo/src/routes/index.ts`
  挂载一级路由。
- `apps/momo/src/modules`
  放接口模块。当前系统接口在 `apps/momo/src/modules/system`，认证接口在 `apps/momo/src/modules/auth`。
- `apps/momo/src/middleware`
  放 request context、安全响应头、请求日志、CORS、请求耗时、请求体大小和超时 middleware。
- `apps/momo/src/infra`
  放 Pino logger、PostgreSQL 连接、Drizzle schema 入口、migration 目录、缓存驱动、搜索驱动和文件存储驱动。
- `apps/momo/src/shared`
  放 Momo 内部共用的错误类型、环境变量读取、Hono 类型和响应 meta 生成函数。

后续目录和新增接口规则看：

- [apps/momo.md](./apps/momo.md)

当前接口：

- `GET /`
- `GET /health`
- `POST /rpc/system/ping`
- `GET` 或 `POST /api/auth/*`
- `POST /api/auth/sign-up/email`
- `GET /rpc/fifa/auth/me`
- `GET /rpc/bobo/auth/me`

新增接口按模块放到 `apps/momo/src/modules/<module>`，再到 `apps/momo/src/routes/index.ts` 用 `route()` 挂载。模块路由用链式写法注册。

模块里有多个 service 或 repository 时，按 `apps/momo.md` 的规则迁到 `services/`、`repositories/`，并通过目录下的 `index.ts` 导出。

## `apps/fifa`

当前 Fifa 保留基础控制台框架和示例页。

主要目录：

- `apps/fifa/src/app/router`
  路由类型、页面记录汇总和路由树。
- `apps/fifa/src/app/navigation`
  左侧菜单生成。
- `apps/fifa/src/features`
  页面模块。每个模块有自己的 `pages/` 和 `routes.tsx`。
- `apps/fifa/src/layout`
  控制台布局。
- `apps/fifa/src/assets/styles`
  全局样式和主题变量。
- `apps/fifa/src/stores`
  前端本地状态。
- `apps/fifa/src/api`
  Fifa 调 Momo 的请求入口和 TanStack Query hooks。

Fifa 从 `@xdd-zone/momo/rpc` 通过 `import type` 引入 `AppType`，再用 `hono/client` 创建 Momo RPC client。

当前 Fifa 请求相关文件：

- `apps/fifa/src/api/client.ts`
  创建 `momoClient`，读取 `VITE_MOMO_BASE_URL`。
- `apps/fifa/src/api/rpc.ts`
  读取 Momo 返回的 JSON。网络失败时返回 `ApiResponse` 失败结构。
- `apps/fifa/src/api/system/health.api.ts`
  调 `GET /health`。
- `apps/fifa/src/api/system/ping.api.ts`
  调 `POST /rpc/system/ping`。
- `apps/fifa/src/api/system/system.query.ts`
  放 system 模块的 query key 和 hooks。
- `apps/fifa/src/api/content/posts.api.ts`
  调 Momo content RPC。
- `apps/fifa/src/api/content/content.query.ts`
  放 content 模块的 query key 和 hooks。

当前前端首页会自动请求 Momo 的 `GET /health`。点击 Ping 按钮时才请求 `POST /rpc/system/ping`。
内容模块会请求 Momo 的文章管理、预览 token、MDX 组件和图片上传接口。
页面不直接 import `momoClient`，也不手写 query key。

## `apps/bobo`

当前 Bobo 是个人站点，使用 Next.js App Router。

主要文件：

- `apps/bobo/app/layout.tsx`
  全局布局、字体、metadata 和主题初始化。
- `apps/bobo/app/page.tsx`
  首页。
- `apps/bobo/app/lab`
  样式演示、主题验证和临时页面。
- `apps/bobo/app/globals.css`
  全局样式入口。
- `apps/bobo/components`
  站点组件。
- `apps/bobo/lib`
  主题和 className 工具函数。

后续维护规则看：

- [apps/bobo.md](./apps/bobo.md)

## `packages/contracts`

这里放 Fifa 和 Momo 都会引用的接口约定。
这里只放 Fifa 和 Momo 都要用的接口 schema、请求类型、响应类型和错误码。页面代码、前端组件、业务 hooks 和只服务单个应用的函数继续放在对应 app 里。
这里不能调用 Node.js 或浏览器 API。需要读文件、读环境变量、操作 DOM 或读浏览器存储时，把代码放回对应 app。

主要目录：

- `packages/contracts/src/common`
  放 `BizCode`、`ApiResponse`、`buildSuccess()` 和 `buildFailure()`。
- `packages/contracts/src/system`
  放系统接口的 schema 和类型。
- `packages/contracts/src/index.ts`
  聚合导出。

Momo 用这里的 schema 校验请求。Fifa 用这里的类型构造请求和读取返回值。

## `packages/eslint-config`

这里放共享 ESLint / Prettier 配置。

子包通过 `workspace:*` 引用它。

## `packages/catppuccin-theme`

这里放 Fifa 和 Bobo 共用的 Catppuccin 主题。

主要内容：

- `styles/core.css`
  放 `data-theme` 会切换的 Catppuccin 颜色变量。
- `styles/fifa.css`
  给 Fifa 用，包含 Tailwind 语义 token。
- `styles/bobo.css`
  给 Bobo 用，包含 Tailwind 语义 token 和 Bobo 背景变量。
- `src`
  放主题名、色板、颜色工具函数和 Ant Design 主题配置。

## 依赖版本

依赖版本主要放在根目录 `pnpm-workspace.yaml`：

- `catalog`
- `catalogs.react`
- `catalogs.vite`
- `catalogs.shiki`
- `catalogs.next`

子包依赖优先写 `catalog:`、`catalog:react`、`catalog:vite`、`catalog:shiki` 或 `workspace:*`。

## TypeScript 配置

- `tsconfig.base.json`
  放所有包都会用的 TypeScript 检查规则。
- `tsconfig.browser.json`
  给浏览器代码用，包含 DOM 类型。
- `tsconfig.node.json`
  给 Node.js 代码和 Vite 配置用，包含 Node 类型。
- `tsconfig.package.json`
  给可复用包用，不包含 DOM 类型，也不包含 Node 类型。
