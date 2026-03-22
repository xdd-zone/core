# Console 前端指南

## 包定位

`@xdd-zone/console` 是当前仓库中的后台管理前端，负责：

- 管理后台页面与交互
- 路由、导航、布局与标签页
- 登录态初始化与登录/登出流程
- 消费 `@xdd-zone/nexus` 提供的认证与业务接口


前端工作方式很直接：

- TanStack Router 在路由进入前完成登录态判断与重定向
- TanStack Query 负责认证请求、会话缓存与 mutation 状态
- 菜单负责导航组织与页面入口
- 页面业务权限以服务端返回的 `401 / 403` 为准
- 登录态以 `/api/auth/get-session` 为唯一真相源

## 技术栈

- React 19
- TypeScript 5.9
- TanStack Router 1.x
- TanStack Query 5.x
- Zustand
- Ant Design 6
- Tailwind CSS 4
- i18next
- Vite 7

## 目录结构

`packages/console/src/` 的关键结构如下：

```text
src/
├── app/
│   ├── navigation/
│   └── router/
├── modules/
│   └── auth/
├── pages/
├── layout/
├── components/
├── hooks/
├── stores/
└── utils/
```

职责划分：

- `app/router/`
  - TanStack Router 路由树、`beforeLoad` 鉴权与 `staticData` 路由元信息
- `app/query-client.ts`
  - QueryClient 初始化与全局 query 默认配置
- `app/navigation/`
  - 导航结构与菜单配置
- `modules/auth/`
  - 登录态请求、auth query、auth store、session 类型
- `pages/`
  - 页面入口组件
- `layout/`
  - 后台整体布局、头部、侧边栏、移动端抽屉
- `stores/`
  - 主题、布局、TabBar 等 UI 状态
- `utils/`
  - 路由辅助、路径处理、主题工具

## 路由模型

路由由一棵集中式 `routeTree` 维护，主要分为：

- 根入口 `/`
  - 在 `beforeLoad` 中根据当前 session 自动跳转 `/login` 或 `/dashboard`
- 登录页 `/login`
  - 只允许游客访问，已登录时直接重定向到 `/dashboard`
- 后台受保护页面
  - `/dashboard`
  - `/articles`
  - `/categories`
  - `/tags`
  - `/comments`
  - `/article-settings`
  - `/image-crop`
  - 统一在父级 route 的 `beforeLoad` 中校验登录态
- 错误页
  - `/403`
  - `/404`

页面标题、TabBar、面包屑等元信息统一存放在 route 的 `staticData` 中。

路由配置位置：

- [packages/console/src/app/router/routes.tsx](../packages/console/src/app/router/routes.tsx)

路由入口与 RouterProvider 注册位置：

- [packages/console/src/app/router/index.ts](../packages/console/src/app/router/index.ts)

登录态重定向与搜索参数处理位置：

- [packages/console/src/app/router/guards.tsx](../packages/console/src/app/router/guards.tsx)

## 登录态模型

前端登录态由服务端 session cookie 驱动，TanStack Query 负责请求 `/api/auth/get-session` 并缓存当前会话，TanStack Router 在进入受保护路由前通过 `ensureQueryData(...)` 确保会话状态可用。

auth store 管理：

- `user`
- `session`
- `isAuthenticated`

认证异步能力由 TanStack Query 管理：

- `getAuthSessionQueryOptions()`
  - 定义当前 session query
- `ensureAuthSession(queryClient)`
  - 供路由 `beforeLoad` 使用，确保进入页面前已拿到 session
- `useLoginMutation()`
  - 登录并回填最新 session
- `useLogoutMutation()`
  - 登出并清空当前 session cache

auth store 只保留会话快照消费边界：

- `setSessionPayload(payload)`
- `clearAuth()`

代码位置：

- [packages/console/src/modules/auth/auth.api.ts](../packages/console/src/modules/auth/auth.api.ts)
- [packages/console/src/modules/auth/auth.query.ts](../packages/console/src/modules/auth/auth.query.ts)
- [packages/console/src/modules/auth/auth.store.ts](../packages/console/src/modules/auth/auth.store.ts)

应用启动入口会统一注册 QueryClientProvider 与 RouterProvider：

- [packages/console/src/App.tsx](../packages/console/src/App.tsx)
- [packages/console/src/app/query-client.ts](../packages/console/src/app/query-client.ts)

## 菜单与导航

菜单和路由分别承担不同职责：

- 路由负责页面访问与跳转
- 导航配置负责侧边栏和移动端菜单展示
- 标签页与面包屑根据当前路由 match 的 `staticData` 生成

导航配置位置：

- [packages/console/src/app/navigation/navigation.ts](../packages/console/src/app/navigation/navigation.ts)

导航分组：

- 仪表盘
- 文章管理
  - 文章列表
  - 分类管理
  - 标签管理
  - 评论管理
  - 文章设置
- 功能示例
  - 图片裁剪

## 布局与标签页

后台保留统一外壳与页面容器能力：

- 左右布局
- 上下布局
- 设置抽屉
- 移动端菜单抽屉
- TabBar 标签页

根布局位置：

- [packages/console/src/layout/RootLayout.tsx](../packages/console/src/layout/RootLayout.tsx)

TabBar 会根据路由变化自动添加标签页，但会跳过：

- `/login`
- `/403`
- `/404`

相关位置：

- [packages/console/src/hooks/useRouteListener.ts](../packages/console/src/hooks/useRouteListener.ts)
- [packages/console/src/utils/routeUtils.ts](../packages/console/src/utils/routeUtils.ts)
- [packages/console/src/components/common/Breadcrumb.tsx](../packages/console/src/components/common/Breadcrumb.tsx)

## 与 Nexus 的协作方式

`console` 默认通过 `/api` 代理访问 `nexus`。

本地开发约定：

- Console: `http://localhost:2333`
- Nexus: `http://localhost:7788`
- 前端通过 Vite proxy 将 `/api` 转发到 `nexus`

前端主要依赖的认证接口：

- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`

联调时需要注意：

- Better Auth 会校验请求来源
- `packages/nexus/config.yaml` 中需要包含前端实际访问来源，例如 `http://localhost:2333`

## 权限语义

前端与服务端的权限职责边界如下：

- 未登录访问后台页：TanStack Router 在 `beforeLoad` 阶段跳转 `/login`
- 已登录但接口无权限：以后端返回 `403` 为准，页面内自行处理提示
- 菜单默认面向后台可访问页面组织，不额外承担角色裁剪逻辑

如果你在排查权限问题，建议优先看：

1. [authentication.md](./authentication.md)
2. [rbac.md](./rbac.md)
3. `/api/auth/get-session` 返回是否符合预期

## 开发与验证

只改 `console` 时，常用命令：

```bash
bun run dev:console
bun run lint:console
bun run --filter @xdd-zone/console type-check
bun run build:console
```

前后端联调时建议：

```bash
bun run dev
```

推荐联调检查：

1. 访问 `/login`
2. 提交邮箱密码登录
3. 登录成功后跳转 `/dashboard`
4. 刷新页面后能通过 route `beforeLoad` + `/api/auth/get-session` 恢复登录态
5. 退出登录后返回 `/login`

## 相关阅读

- [README.md](../README.md)
- [architecture.md](./architecture.md)
- [development.md](./development.md)
- [authentication.md](./authentication.md)
- [packages/console/README.md](../packages/console/README.md)
