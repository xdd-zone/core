# XDD Zone Console 前端参考

这个文件提供 `packages/console` 后台管理前端的开发落点、骨架和检查清单。生成前端代码时，优先参考现有同类文件，再按这里的结构补齐。

## 先看哪些文件

根据任务类型，优先打开：

- 路由与守卫：
  - `packages/console/src/app/router/routes.tsx`
  - `packages/console/src/app/router/guards.tsx`
  - `packages/console/src/app/router/types.ts`
- 导航与标签：
  - `packages/console/src/app/navigation/navigation.ts`
  - `packages/console/src/hooks/useRouteListener.ts`
  - `packages/console/src/utils/routeUtils.ts`
  - `packages/console/src/stores/modules/tabBar.ts`
- 认证：
  - `packages/console/src/modules/auth/auth.api.ts`
  - `packages/console/src/modules/auth/auth.store.ts`
  - `packages/console/src/pages/auth/Login.tsx`
- 布局与页面壳：
  - `packages/console/src/layout/RootLayout.tsx`
  - `packages/console/src/layout/components/app-content/AppContent.tsx`
  - `packages/console/src/components/common/Breadcrumb.tsx`
- 主题与样式：
  - `packages/console/docs/theme.md`
  - `packages/console/src/stores/modules/setting.ts`
  - `packages/console/src/utils/theme.ts`
  - `packages/console/src/assets/styles/theme/*`

## 分层落点

新增一个后台页面时，通常涉及这些层：

1. `packages/console/src/pages/*`
2. `packages/console/src/app/router/routes.tsx`
3. `packages/console/src/app/navigation/navigation.ts`
4. `packages/console/src/i18n/locales/zh.ts` 与 `en.ts`
5. 按需补 `modules/*`、`layout/*`、`stores/modules/*`

## 路由模型

当前路由模型只有两层：

- `GuestOnly`
  - `/login`
- `RequireAuth`
  - 所有后台页面

根路径 `/` 统一由 `RootIndexRedirect` 根据登录态重定向，不要把这层逻辑拆到页面内部。

## 路由骨架

新增后台页面时，优先沿用现有 lazy route 形式：

```tsx
{
  handle: {
    icon: Users,
    title: 'menu.userManagement',
  },
  lazy: async () => {
    const { UserList } = await import('@console/pages/user/UserList')

    return { Component: UserList }
  },
  path: 'users',
}
```

注意：

- `handle.title` 优先使用 i18n key，不直接写死展示文案。
- 这个标题会被 `TabBar` 和面包屑复用。
- 如果页面不应该生成标签页，显式设置 `handle.tab = false`。
- 纯容器路由、重定向路由、错误页不要当成普通页面标签。

## 导航骨架

新增后台入口时，导航与路由通常需要同步：

```ts
{
  icon: Users,
  key: 'system',
  label: 'menu.systemManagement',
  children: [
    {
      key: 'users',
      label: 'menu.userManagement',
      path: '/users',
    },
  ],
}
```

注意：

- `key` 保持稳定，不要用随机值。
- `path` 使用绝对路径。
- 菜单负责导航入口，不负责权限裁剪。
- 如果需求只是隐藏入口，不要顺手把路由权限逻辑塞进导航层。

## 页面组件骨架

页面入口组件保持函数组件和具名导出：

```tsx
import { Alert, Card, Table } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Loading } from '@console/components/ui'
import { useDynamicTableHeight } from '@console/hooks/useDynamicTableHeight'

interface UserRow {
  id: string
  nickname: string
}

/**
 * 用户列表页
 */
export function UserList() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<UserRow[]>([])
  const { cardRef, tableScrollY } = useDynamicTableHeight(loading)

  useEffect(() => {
    void loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <Card ref={cardRef} title={t('menu.userManagement')}>
      <Alert type="info" showIcon message={t('common.loading')} />
      <Table<UserRow> rowKey="id" dataSource={items} scroll={{ y: tableScrollY }} />
    </Card>
  )
}
```

页面约定：

- 用户可见文案优先使用 `useTranslation()`。
- 加载态优先复用 `<Loading />`。
- 错误提示优先复用 Antd `Alert` 或 `message`。
- 页面局部状态留在组件内部；只有跨页面复用或需要持久化时才上移。

## Auth 相关约定

认证能力集中在 `packages/console/src/modules/auth/*`：

- `auth.api.ts`
  - `/api/auth/get-session`
  - `/api/auth/sign-in/email`
  - `/api/auth/sign-out`
- `auth.store.ts`
  - `bootstrapSession`
  - `login`
  - `logout`

不要在以下位置复制认证流程：

- `app/router/*`
- `layout/*`
- 普通业务页面

如果页面只是使用当前登录用户状态，优先从 `useAuthStore()` 读取，而不是重新请求 session。

## 布局与壳层约定

后台壳层由 `RootLayout` 统一负责：

- 背景 `Pattern`
- 左右 / 上下布局切换
- `SettingDrawer`
- `MobileDrawer`
- 路由监听与 TabBar 联动

这意味着：

- 页面组件只写内容区，不重复包一层后台壳。
- 如果改动会影响导航、标签、移动端菜单或设置抽屉，优先去 `layout/*`、`hooks/useRouteListener.ts`、`stores/modules/*` 查。

## TabBar 与面包屑约定

- `TabBar` 通过路由 `handle.title` 生成标题。
- `Breadcrumb` 通过 `handle.breadcrumbTitle || handle.title` 生成层级。
- `/login`、`/403`、`/404` 默认不进 TabBar。
- 想让页面标题、标签和面包屑一致，优先从路由 `handle` 统一维护。

## 样式与主题约定

当前项目是 `Ant Design + Tailwind + Catppuccin` 的组合：

- 基础控件优先使用 Antd。
- 布局、间距、细节状态优先使用 Tailwind。
- 优先使用语义类：
  - `bg-surface`
  - `bg-surface-muted`
  - `text-fg`
  - `text-fg-muted`
  - `border-border`
  - `bg-overlay-0`
  - `text-primary`
- 不要新建一套平行主题系统。
- 除非现有代码已经这样做，否则不要到处硬编码 hex 颜色。

## i18n 约定

新增文案时：

1. 先确定 key 的命名空间，例如 `menu.*`、`common.*`、`auth.*`
2. 同步修改：
   - `packages/console/src/i18n/locales/zh.ts`
   - `packages/console/src/i18n/locales/en.ts`
3. 页面和导航里只引用 key，不直接写死文案

## 与 Nexus 联调时的判断顺序

如果需求涉及接口联调，先问自己：

1. `nexus` 接口是否已经存在
2. 登录态是否只依赖 `/api/auth/get-session`
3. 这个页面是未登录不可访问，还是接口返回 `403` 后再提示

如果后端接口还没准备好，先改 `packages/nexus`，不要在前端临时发明兼容协议。

## 常见坏味道与替代写法

坏味道：

```tsx
if (user.role !== 'admin') {
  return <Navigate to="/403" replace />
}
```

替代：

```tsx
// 前端只做是否登录判断，细粒度权限以后端接口结果为准
```

坏味道：

```tsx
const routes = [{ path: '/users', title: '用户管理' }]
```

替代：

```tsx
const routes = [{ path: '/users', handle: { title: 'menu.userManagement' } }]
```

坏味道：

```tsx
<div style={{ background: '#fff', color: '#333' }} />
```

替代：

```tsx
<div className="bg-surface text-fg" />
```

## 完成后的检查清单

- 页面是否放在正确的 `pages/*` 位置
- 路由是否挂在正确的 public / protected 分组
- 导航是否只承担入口职责，没有混入权限判断
- `handle.title / breadcrumbTitle / tab` 是否符合页面语义
- `zh / en` 文案是否补齐
- 认证请求是否仍然集中在 `modules/auth/*`
- 是否复用了现有布局和主题语义类
- TabBar、面包屑、移动端菜单和设置抽屉行为是否未回退
- 是否完成 `lint / type-check / build`
