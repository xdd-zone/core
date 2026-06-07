# @xdd-zone/console

`@xdd-zone/console` 是 XDD Zone Core 的前端控制台包。

## 当前保留内容

- React / Vite 入口
- TanStack Router 路由
- 基础布局、导航、标签栏和设置抽屉
- Catppuccin 主题
- 首页、404 页面和几个示例页

当前没有接入后端接口，也没有业务模块。

## 常用命令

```bash
cd apps/console

pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm type-check
```

## 目录结构

```text
src/
├── app/
├── components/
├── features/
├── layout/
├── stores/
└── utils/
```

最常改的目录：

- `app/router`
  路由类型、页面记录汇总和路由树。
- `app/navigation`
  左侧菜单生成。
- `features`
  页面模块。每个模块有自己的 `pages/` 和 `routes.tsx`。
- `layout`
  控制台整体布局。
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

## 新增页面时通常要改哪几处

1. `apps/console/src/features/<module>/pages/<Page>.tsx`
2. `apps/console/src/features/<module>/routes.tsx`
3. 如果是新模块，再把模块记录加到 `apps/console/src/app/router/records.ts`

`apps/console/src/app/navigation/navigation.ts` 会从页面记录生成菜单。已有菜单组只需要在模块页面记录里写 `menu.group`。

## 开发前先看

只要任务涉及页面、布局、导航或展示型组件，先看：

1. `apps/console/design-context.md`
2. `docs/console.md`
3. `docs/theme.md`
