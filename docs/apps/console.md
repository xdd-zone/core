# Console 前端指南

这份文档说明 `apps/console` 当前怎么组织。

## 当前保留内容

`@xdd-zone/console` 现在保留基础控制台框架：

- React / Vite 入口。
- TanStack Router 路由。
- 基础布局、侧边菜单、顶部栏、标签栏和设置抽屉。
- Catppuccin 主题。
- 首页、404 页面和几个示例页。

当前首页接入了 Nexus 的健康检查和 ping 验证接口。当前没有登录、权限和业务模块。

## 开始改 UI 前先看

只要任务涉及页面、布局、导航或展示型组件，先看：

1. `apps/console/design-context.md`
2. `apps/console/README.md`
3. 这份文档

## 关键目录

```text
apps/console/src/
├── app/
├── components/
├── features/
├── layout/
├── api/
├── stores/
└── utils/
```

最常改的地方：

- `app/router`
  路由类型、页面记录汇总和路由树。
- `app/navigation`
  菜单生成。
- `features`
  页面模块。每个模块有自己的 `pages/` 和 `routes.tsx`。
- `layout`
  控制台整体布局。
- `api`
  调 Nexus 的请求入口和 TanStack Query hooks。
- `components`
  通用组件和示例组件。
- `stores`
  设置、标签栏等本地状态。

## 当前页面路径

- `/`
- `/env-example`
- `/ui-showcase`
- `/markdown-example`
- `/tiptap-example`
- `/image-crop`
- `/error-example`
- `/forbidden-example`
- `/not-found-example`
- `/404`

## 路由和菜单

路由文件：

```text
apps/console/src/app/router/records.ts
apps/console/src/app/router/routes.tsx
```

菜单文件：

```text
apps/console/src/app/navigation/navigation.ts
```

新增页面通常要检查：

1. `apps/console/src/features/<module>/pages/<Page>.tsx`
2. `apps/console/src/features/<module>/routes.tsx`
3. 新模块要加到 `apps/console/src/app/router/records.ts`

页面记录里的 `menu: false` 表示不进菜单。
页面记录里的 `tab: false` 表示不生成标签页。
页面记录里的 `layout.contentWidth: 'full'` 表示内容区使用全宽。

## Nexus 请求

Console 使用 Hono RPC 调 Nexus。

相关文件：

```text
apps/console/src/api/client.ts
apps/console/src/api/rpc.ts
apps/console/src/api/system/health.api.ts
apps/console/src/api/system/ping.api.ts
apps/console/src/api/system/system.query.ts
apps/console/src/api/system/index.ts
```

文件分工：

- `api/client.ts`
  创建 `nexusClient`，读取 `VITE_NEXUS_BASE_URL`。
- `api/rpc.ts`
  读取 Nexus 返回的 JSON。网络请求失败时返回 `ApiResponse` 失败结构。
- `api/system/*.api.ts`
  调 Nexus RPC。页面不要直接 import `nexusClient`。
- `api/system/system.query.ts`
  放 system 模块的 query key 和 hooks。页面不要手写 system query key。

Console 通过环境变量读取 Nexus 地址：

```text
VITE_NEXUS_BASE_URL=http://localhost:7788
```

Console 当前还会读取运行环境：

```text
VITE_APP_ENV=development
```

示例文件在：

```text
apps/console/.env.example
```

当前首页会请求：

```text
GET /health
POST /rpc/system/ping
```

当前写法：

- `GET /health`
  用 `useSystemHealthQuery()`，页面打开后自动请求，也可以点刷新按钮重新请求。
- `POST /rpc/system/ping`
  用 `usePingSystemMutation()`，只在点击 Ping 按钮时发送。

新增 Console 请求时按这个顺序写：

1. 在 `apps/console/src/api/<module>/<name>.api.ts` 写接口函数。
2. 在 `apps/console/src/api/<module>/<module>.query.ts` 写 query key 和 hook。
3. 页面只 import hook，不直接 import `nexusClient`。
4. `GET` 接口用 `useQuery`，`POST` 接口用 `useMutation`。

## 主题

主题说明看：

- [topics/theme.md](../topics/theme.md)

相关文件：

- `apps/console/src/assets/styles/theme/*`
- `apps/console/src/utils/theme.ts`
- `apps/console/src/utils/catppuccin.antd.ts`

## 运行和检查

```bash
pnpm dev:console
pnpm lint:console
pnpm type-check:console
pnpm build:console
```
