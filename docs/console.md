# Console 前端指南

这份文档说明 `apps/console` 当前怎么组织。

## 当前保留内容

`@xdd-zone/console` 现在保留基础控制台框架：

- React / Vite 入口。
- TanStack Router 路由。
- 基础布局、侧边菜单、顶部栏、标签栏和设置抽屉。
- Catppuccin 主题。
- 首页、404 页面和几个示例页。

当前没有接入 Nexus 业务接口，也没有登录、权限和业务模块。

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
├── layout/
├── pages/
├── stores/
└── utils/
```

最常改的地方：

- `app/router`
  路由树。
- `app/navigation`
  菜单配置。
- `layout`
  控制台整体布局。
- `pages`
  页面入口。
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
apps/console/src/app/router/routes.tsx
```

菜单文件：

```text
apps/console/src/app/navigation/navigation.ts
```

新增页面通常要同时检查：

1. `routes.tsx`
2. `navigation.ts`
3. `apps/console/src/pages/<feature>/`

如果页面不需要出现在菜单里，只改路由和页面组件。

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
