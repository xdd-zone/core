# Console 路由和页面架构设计

这份文档说明 `apps/console` 后续怎么组织页面、路由、菜单和布局信息。

当前设计采用模块级路由清单。每个模块维护自己的页面列表，`app/router` 只负责把这些页面挂到 TanStack Router。

## 目标

- 页面按模块放，新增业务页时先找到对应模块。
- `path`、标题、图标、菜单、标签页、布局宽度写在同一条页面记录里。
- 菜单和标签页从页面记录生成，不再手写第二份标题和路径。
- 布局只读取和布局有关的字段。
- 先不加权限、远程菜单、动态路由。

## 目录

后续页面按这个结构放：

```text
apps/console/src/
├── app/
│   ├── navigation/
│   └── router/
├── features/
│   ├── home/
│   │   ├── pages/
│   │   │   └── Home.tsx
│   │   └── routes.tsx
│   ├── examples/
│   │   ├── pages/
│   │   └── routes.tsx
│   └── errors/
│       ├── pages/
│       └── routes.tsx
└── layout/
```

模块目录规则：

- `features/<module>/pages/` 放页面组件。
- `features/<module>/routes.tsx` 放这个模块的页面记录。
- `app/router/routes.tsx` 汇总模块页面记录，创建 TanStack Router 路由树。
- `app/navigation/navigation.ts` 从页面记录生成 Ant Design 菜单数据。
- `layout/` 不保存页面清单，只读取当前路由的布局字段。

## 页面记录

页面记录使用一个轻量类型：

```ts
interface ConsoleRouteRecord {
  id: string
  path: string
  title: string
  component: RouteComponent
  icon?: LucideIcon
  menu?: false | ConsoleMenuMeta
  tab?: false | ConsoleTabMeta
  layout?: ConsoleLayoutMeta
}

interface ConsoleMenuMeta {
  group?: string
  order?: number
}

interface ConsoleTabMeta {
  closable?: boolean
}

interface ConsoleLayoutMeta {
  contentWidth?: 'default' | 'full'
}
```

字段规则：

- `id` 用稳定短名，例如 `home`、`examples.uiShowcase`。
- `path` 写完整路径，例如 `/`、`/ui-showcase`。
- `title` 写 i18n key，例如 `menu.home`。
- `component` 指向页面组件或懒加载页面组件。
- `icon` 给菜单和标签页用。
- `menu: false` 表示这个页面不进菜单。
- `tab: false` 表示这个页面不生成标签页。
- `layout.contentWidth` 只给 `AppContent` 用。

## 模块写法

`features/examples/routes.tsx` 示例：

```tsx
import { lazyRouteComponent } from '@tanstack/react-router'
import { LayoutTemplate } from 'lucide-react'

import type { ConsoleRouteRecord } from '@console/app/router/types'

export const exampleRoutes: ConsoleRouteRecord[] = [
  {
    component: lazyRouteComponent(() => import('./pages/UiShowcase'), 'UiShowcase'),
    icon: LayoutTemplate,
    id: 'examples.uiShowcase',
    layout: {
      contentWidth: 'full',
    },
    menu: {
      group: 'examples',
      order: 10,
    },
    path: '/ui-showcase',
    title: 'menu.uiShowcase',
  },
]
```

首页记录示例：

```tsx
export const homeRoutes: ConsoleRouteRecord[] = [
  {
    component: Home,
    icon: House,
    id: 'home',
    layout: {
      contentWidth: 'full',
    },
    path: '/',
    tab: {
      closable: false,
    },
    title: 'menu.home',
  },
]
```

错误页记录示例：

```tsx
export const errorRoutes: ConsoleRouteRecord[] = [
  {
    component: NotFound,
    id: 'errors.notFound',
    menu: false,
    path: '/404',
    tab: false,
    title: 'error.notFound.title',
  },
]
```

## 路由生成

`app/router/routes.tsx` 做三件事：

1. 创建 `rootRoute` 和 `appLayoutRoute`。
2. 读取所有模块导出的页面记录。
3. 把页面记录转成 `createRoute()`。

页面记录转路由时，把页面记录保存到 `staticData`：

```ts
staticData: {
  id: record.id,
  icon: record.icon,
  layout: record.layout,
  tab: record.tab,
  title: record.title,
}
```

`staticData` 只放布局、标签页和面包屑需要的字段。不把菜单分组和排序放进去。

## 菜单生成

`app/navigation/navigation.ts` 不再手写页面菜单。

它从页面记录中筛选：

- 有 `menu: false` 的页面跳过。
- 没有 `menu` 字段的页面默认进入一级菜单。
- 有 `menu.group` 的页面放入对应菜单组。
- 菜单顺序先按 `menu.order`，再按记录出现顺序。

菜单组单独声明：

```ts
export const navigationGroups = {
  examples: {
    icon: FolderOpen,
    label: 'menu.examples',
    order: 20,
  },
}
```

这样可以避免每个页面重复写父级菜单信息。

## 标签页

`useRouteListener` 继续监听当前路由。

它从当前 route match 的 `staticData` 生成标签页：

- 没有 `title` 时不生成标签页。
- `tab: false` 时不生成标签页。
- `tab.closable === false` 时不可关闭。
- `icon` 使用 route meta 里的图标。
- `path` 使用当前 match 的 pathname。

`stores/modules/tabBar.ts` 不再手写首页标题和图标。默认首页标签从首页页面记录生成。

## 布局

`AppContent` 只读取当前路由的 `layout.contentWidth`。

- 没写 `layout.contentWidth` 时使用默认内容宽度。
- `layout.contentWidth === 'full'` 时使用全宽内容区。

页面标题、说明、筛选区、表格等内容继续由页面组件自己写。布局不负责替页面拼顶部区域。

## 现有页面迁移

第一步迁移当前页面：

- `pages/home/Home.tsx` 移到 `features/home/pages/Home.tsx`。
- `pages/error/NotFound.tsx` 移到 `features/errors/pages/NotFound.tsx`。
- `pages/example/*` 移到 `features/examples/pages/`。

第二步新增模块路由文件：

- `features/home/routes.tsx`
- `features/errors/routes.tsx`
- `features/examples/routes.tsx`

第三步改公共代码：

- `app/router/types.ts` 定义 `ConsoleRouteRecord` 和 route meta。
- `app/router/routes.tsx` 从模块记录生成路由树。
- `app/navigation/navigation.ts` 从模块记录生成菜单。
- `utils/routeUtils.ts` 从 route meta 生成标签页。
- `stores/modules/tabBar.ts` 去掉写死的首页标题和图标。

## 不做的事

这次不做这些功能：

- 不做远程菜单。
- 不做权限过滤。
- 不做动态路由注册。
- 不做页面自动扫描。
- 不改 Nexus 接口。
- 不改主题系统。

这些功能等登录、权限和业务接口接入后再处理。

## 检查命令

改完后跑：

```bash
pnpm type-check:console
pnpm lint:console
pnpm build:console
```

如果根目录脚本没有这些命令，就改跑：

```bash
cd apps/console
pnpm type-check
pnpm lint
pnpm build
```
