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
  创建 Hono app，注册错误处理，挂载路由，导出 `AppType`。
- `apps/nexus/src/routes`
  按接口域放路由。
- `apps/nexus/src/shared`
  放 Nexus 内部共用的错误类型、Hono 类型和响应 meta 生成函数。

当前接口：

- `GET /`
- `GET /health`
- `POST /rpc/system/ping`

新增接口按域放到 `apps/nexus/src/routes/<domain>`，再到 `apps/nexus/src/routes/index.ts` 挂载。

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
  Console 调 Nexus 的请求入口。当前有 Nexus ping 验证请求。

当前前端首页会请求 Nexus 的 `POST /rpc/system/ping`。

## `packages/contracts`

这里放 Console 和 Nexus 都会引用的接口约定。

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
