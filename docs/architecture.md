# 项目结构

这份文档只说明当前代码怎么放。

## 当前包

仓库是 `pnpm + Turborepo` 的 monorepo，当前有四个包：

- `apps/console`
  前端控制台，包名是 `@xdd-zone/console`。
- `apps/nexus`
  Hono API 服务，包名是 `@xdd-zone/nexus`。
- `packages/eslint-config`
  共享 ESLint / Prettier 配置，包名是 `@xdd-zone/eslint-config`。
- `packages/contracts`
  Console 和 Nexus 共用的接口类型、schema 和响应结构，包名是 `@xdd-zone/contracts`。

## 根目录

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
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## `apps/nexus`

当前 Nexus 是 Hono API 服务。

主要文件：

- `apps/nexus/src/index.ts`
  直接运行 Nexus 时启动 Node 服务。
- `apps/nexus/src/app.ts`
  创建 Hono app，注册错误处理，挂载路由，导出运行时 app。
- `apps/nexus/src/rpc.ts`
  只导出 `AppType` 类型，给 Console 的 Hono RPC client 使用。
- `apps/nexus/src/routes`
  按接口域放路由。
- `apps/nexus/src/shared`
  放 Nexus 内部共用的错误类型、Hono 类型和响应 meta 生成函数。

后续目录和新增接口规则看：

- [nexus.md](./nexus.md)

当前接口：

- `GET /`
- `GET /health`
- `POST /rpc/system/ping`

新增接口按模块放到 `apps/nexus/src/modules/<module>`，再到 `apps/nexus/src/routes/index.ts` 挂载。模块路由用链式写法注册，`routes/index.ts` 用 `route()` 挂载后接住返回值。

## `apps/console`

当前 Console 保留基础控制台框架和示例页。

主要目录：

- `apps/console/src/app/router`
  路由类型、页面记录汇总和路由树。
- `apps/console/src/app/navigation`
  左侧菜单生成。
- `apps/console/src/features`
  页面模块。每个模块有自己的 `pages/` 和 `routes.tsx`。
- `apps/console/src/layout`
  控制台布局。
- `apps/console/src/assets/styles`
  全局样式和主题变量。
- `apps/console/src/stores`
  前端本地状态。
- `apps/console/src/api`
  Console 调 Nexus 的请求入口和 TanStack Query hooks。

Console 从 `@xdd-zone/nexus/rpc` 通过 `import type` 引入 `AppType`，再用 `hono/client` 创建 Nexus RPC client。

当前 Console 请求相关文件：

- `apps/console/src/api/client.ts`
  创建 `nexusClient`，读取 `VITE_NEXUS_BASE_URL`。
- `apps/console/src/api/rpc.ts`
  读取 Nexus 返回的 JSON。网络失败时返回 `ApiResponse` 失败结构。
- `apps/console/src/api/system/health.api.ts`
  调 `GET /health`。
- `apps/console/src/api/system/ping.api.ts`
  调 `POST /rpc/system/ping`。
- `apps/console/src/api/system/system.query.ts`
  放 system 模块的 query key 和 hooks。

当前前端首页会自动请求 Nexus 的 `GET /health`。点击 Ping 按钮时才请求 `POST /rpc/system/ping`。
页面不直接 import `nexusClient`，也不手写 system query key。

## `packages/contracts`

这里放 Console 和 Nexus 都会引用的接口约定。
这里只放 Console 和 Nexus 都要用的接口 schema、请求类型、响应类型和错误码。页面代码、前端组件、业务 hooks 和只服务单个应用的函数继续放在对应 app 里。

主要目录：

- `packages/contracts/src/common`
  放 `BizCode`、`ApiResponse`、`buildSuccess()` 和 `buildFailure()`。
- `packages/contracts/src/system`
  放系统接口的 schema 和类型。
- `packages/contracts/src/index.ts`
  聚合导出。

Nexus 用这里的 schema 校验请求。Console 用这里的类型构造请求和读取返回值。

## `packages/eslint-config`

这里放共享 ESLint / Prettier 配置。

子包通过 `workspace:*` 引用它。

## 依赖版本

依赖版本主要放在根目录 `pnpm-workspace.yaml`：

- `catalog`
- `catalogs.react`
- `catalogs.vite`
- `catalogs.shiki`

子包依赖优先写 `catalog:`、`catalog:react`、`catalog:vite`、`catalog:shiki` 或 `workspace:*`。
