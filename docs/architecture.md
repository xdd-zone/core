# 项目结构

这份文档只说明当前代码怎么放。

## 当前包

仓库是 `pnpm + Turborepo` 的 monorepo，当前有三个包：

- `apps/console`
  前端控制台，包名是 `@xdd-zone/console`。
- `apps/nexus`
  Hono API 服务，包名是 `@xdd-zone/nexus`。
- `packages/eslint-config`
  共享 ESLint / Prettier 配置，包名是 `@xdd-zone/eslint-config`。

## 根目录

```text
.
├── apps/
│   ├── console/
│   └── nexus/
├── docs/
├── packages/
│   └── eslint-config/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## `apps/nexus`

当前 Nexus 是基础 Hono 示例服务。

主要文件：

- `apps/nexus/src/index.ts`
  创建 Hono app，定义示例接口，导出 `AppType`，并在直接运行时启动 Node 服务。

当前接口：

- `GET /`
- `GET /health`
- `GET /api/example`

新增接口先放在 `apps/nexus/src/index.ts`。接口变多后，再用 Hono 的 `app.route()` 或 `basePath()` 分组。

## `apps/console`

当前 Console 保留基础控制台框架和示例页。

主要目录：

- `apps/console/src/app/router`
  路由树。
- `apps/console/src/app/navigation`
  左侧菜单。
- `apps/console/src/layout`
  控制台布局。
- `apps/console/src/pages`
  页面入口。
- `apps/console/src/assets/styles`
  全局样式和主题变量。
- `apps/console/src/stores`
  前端本地状态。

当前前端没有接入 Nexus 业务接口。

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
