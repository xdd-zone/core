# @xdd-zone/console

`@xdd-zone/console` 是 XDD Zone Core 的前端控制台包。

## 当前保留内容

- React / Vite 入口
- TanStack Router 路由
- 基础布局、导航、标签栏和设置抽屉
- Catppuccin 主题
- 首页和 404 页面

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
├── layout/
├── pages/
├── stores/
└── utils/
```

最常改的目录：

- `app/router`
  路由树。
- `app/navigation`
  左侧菜单配置。
- `layout`
  控制台整体布局。
- `pages/home`
  首页。
- `pages/error`
  错误页。

## 当前页面路径

- `/`
- `/404`

## 新增页面时通常要改哪几处

1. `apps/console/src/app/router/routes.tsx`
2. `apps/console/src/app/navigation/navigation.ts`
3. `apps/console/src/pages/<feature>/`

## 开发前先看

只要任务涉及页面、布局、导航或展示型组件，先看：

1. `apps/console/design-context.md`
2. `docs/console.md`
3. `docs/theme.md`
