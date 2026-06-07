# Console 前端指南

这份文档说明 `apps/console` 当前怎么组织。

## 当前保留内容

`@xdd-zone/console` 现在保留基础控制台框架：

- React / Vite 入口。
- TanStack Router 路由。
- 基础布局、侧边菜单、顶部栏、标签栏和设置抽屉。
- Catppuccin 主题。
- 首页、404 页面和几个示例页。

当前首页接入了 Nexus 的最小验证接口。当前没有登录、权限和业务模块。

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
  调 Nexus 的请求入口。当前有 `api/client.ts` 和 `api/system/ping.ts`。
- `components`
  通用组件和示例组件。
- `stores`
  设置、标签栏等本地状态。

## 当前页面路径

- `/`
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
apps/console/src/api/system/ping.ts
```

默认 Nexus 地址是：

```text
http://localhost:7788
```

如果要改地址，在 Console 环境变量里设置：

```text
VITE_NEXUS_BASE_URL=http://localhost:7788
```

当前首页会请求：

```text
POST /rpc/system/ping
```

## 主题

主题说明看：

- [theme.md](./theme.md)

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
