# Console 前端指南

## 包定位

`@xdd-zone/console` 是当前仓库中的后台管理前端，负责：

- 管理后台页面与交互
- 路由、导航、布局与 TabBar
- 登录态初始化与登录/登出流程
- 调用 `@xdd-zone/nexus` 提供的认证与业务接口


前端工作方式很直接：

- TanStack Router 在路由进入前完成登录态判断与重定向
- TanStack Query 负责认证请求、会话缓存与 mutation 状态
- 菜单负责导航组织与页面入口
- 页面业务权限以服务端返回的 `401 / 403` 为准
- 登录态以 `/api/auth/get-session` 作为统一判断依据
- Dashboard 首页会根据当前权限决定显示哪些指标和常用入口

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

## 设计上下文

`packages/console` 的界面设计规则统一写在：

- [packages/console/.impeccable.md](../packages/console/.impeccable.md)

只要任务涉及 React 组件、页面、布局、导航或其他界面调整，开始开发前统一按下面顺序执行：

1. 先读取 `packages/console/.impeccable.md`
2. 先调用 `frontend-design` 技能
3. 再继续界面实现

如果任务继续涉及布局节奏、说明文案、排版和界面收尾，再继续调用对应设计技能。

执行时以 `packages/console/.impeccable.md` 中的当前规则为准，不跳过设计上下文直接决定页面风格。

## 目录结构

`packages/console/src/` 的关键结构如下：

```text
src/
├── app/
│   ├── navigation/
│   └── router/
├── modules/
│   ├── auth/
│   ├── rbac/
│   └── user/
├── pages/
│   ├── access/
│   ├── example/
│   ├── role/
│   └── user/
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
  - 登录、登出、session 查询与 auth store
- `modules/user/`
  - 用户列表、用户详情、资料更新相关请求与 query
- `modules/rbac/`
  - 角色列表、用户角色、用户权限相关请求与 query
- `pages/user/`
  - 用户列表、用户详情、用户编辑、当前用户资料和指定用户权限页面
- `pages/role/`
  - 角色列表页
- `pages/access/`
  - 当前登录用户权限页
- `pages/example/`
  - 组件主题、Markdown、图片裁剪和错误状态示例页
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
  - 只允许游客访问，支持 `redirect` 和 `error` search，已登录时直接重定向到 `/dashboard`
- 后台受保护页面
  - 仪表盘：`/dashboard`
  - 内容管理：`/articles`、`/categories`、`/tags`、`/comments`、`/article-settings`
  - 系统管理：`/users`、`/users/:id`、`/users/:id/edit`、`/users/:id/access`、`/roles`
  - 当前用户：`/profile`、`/my-access`
  - 功能示例：`/ui-showcase`、`/markdown-example`、`/image-crop`、`/error-example`、`/forbidden-example`、`/not-found-example`
  - 统一在父级 route 的 `beforeLoad` 中校验登录态
- 错误页
  - `/403`
  - `/404`

带参数的用户路由在 `routes.tsx` 中使用 `users/$id` 这类写法。

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

auth store 只保留会话快照相关状态：

- `setSessionPayload(payload)`
- `clearAuth()`

邮箱密码登录继续通过 mutation 调用 `/api/auth/sign-in/email`。

GitHub 登录地址由 `src/modules/auth/auth.api.ts` 统一构造。登录页会根据当前 API 基址生成浏览器跳转地址，地址指向这条基址下的 `/api/auth/sign-in/github?callbackURL=...`。登录完成后，再通过 `ensureAuthSession(...)` 和 `/api/auth/get-session` 恢复前端会话。

## GitHub 登录与 Dashboard 权限适配

GitHub 登录当前按下面流程接入：

1. 登录页读取 `redirect`
2. `authApi.getGithubSignInUrl(...)` 按当前 API 基址生成浏览器跳转地址
3. Nexus 处理 GitHub 回调并写入 session cookie
4. Router 回到目标页后，通过 `ensureAuthSession(...)` 恢复登录态

当前部署要求：

- 本地开发通过 Vite proxy 访问 Nexus
- 生产环境可继续通过同域反向代理访问 `/api`
- 如果使用独立 API 域名，GitHub 登录入口和 Eden 请求会一起复用这条 API 基址，这条地址需要和当前会话策略匹配

Dashboard 首页会先读取当前用户权限，再决定是否继续请求管理型列表接口：

- 具备 `user:read:all` 时才请求用户总数
- 具备 `role:read:all` 时才请求角色总数
- 权限未完成初始化时先显示加载占位
- 无权限时显示“按权限显示”，并保留“我的权限”“我的资料”等自助入口

这样 GitHub 登录后的普通用户也可以直接进入后台首页，不会因为首页主动拉取管理接口而收到 `403`。

代码位置：

- [packages/console/src/modules/auth/auth.api.ts](../packages/console/src/modules/auth/auth.api.ts)
- [packages/console/src/modules/auth/auth.query.ts](../packages/console/src/modules/auth/auth.query.ts)
- [packages/console/src/modules/auth/auth.store.ts](../packages/console/src/modules/auth/auth.store.ts)
- [packages/console/src/pages/auth/Login.tsx](../packages/console/src/pages/auth/Login.tsx)
- [packages/console/src/pages/dashboard/Dashboard.tsx](../packages/console/src/pages/dashboard/Dashboard.tsx)

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
- 系统管理
  - 用户管理：`/users`
  - 角色管理：`/roles`
  - 我的权限：`/my-access`
  - 我的资料：`/profile`
- 功能示例
  - 组件与主题
  - Markdown 演示
  - 图片裁剪
  - 运行时错误
  - 403 权限错误
  - 404 页面不存在

示例页和错误页的文案默认保持简短：

- 标题直接说明当前状态或用途
- 说明文字尽量控制在 1 到 2 句
- 能用按钮直接处理的，不再补很多解释块

列表页中的按钮会继续进入这些页面：

- 用户详情：`/users/:id`
- 用户编辑：`/users/:id/edit`
- 用户权限管理：`/users/:id/access`

头部头像菜单提供两个快捷入口：

- 我的资料：`/profile`
- 我的权限：`/my-access`

当前页面说明：

- `Dashboard`
  - 登录后的默认落点，按当前权限展示首页指标和常用入口
- `ArticleList`、`CategoryList`、`TagList`、`CommentList`、`ArticleSettings`
  - 当前保留内容管理页面入口
- `UserList`
  - 提供用户搜索、状态筛选和分页列表
- `UserDetail`
  - 展示用户资料、登录信息和当前角色
- `UserEdit`
  - 编辑指定用户的基础资料
- `UserAccess`
  - 为指定用户分配角色、移除角色并查看有效权限
- `RoleList`
  - 展示角色分页列表和角色基础信息
- `MyProfile`
  - 维护当前登录用户资料，并同步更新前端 session 快照
- `MyAccess`
  - 查看当前登录用户的角色和权限
- `UiShowcase`
  - 展示 Ant Design 组件、Catppuccin 主题与设计令牌
- `MarkdownExample`
  - 展示 Markdown、GFM 与 Shiki 代码高亮效果
- `ImageCropExample`
  - 展示图片裁剪示例

## 布局与标签页

后台保留统一外壳与页面容器能力：

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

## 主题与样式

当前主题体系统一基于 Catppuccin：

- HTML 根节点使用 `data-theme` 挂载实际主题 ID
  - `latte`
  - `frappe`
  - `macchiato`
  - `mocha`
- Ant Design 主题配置统一通过 `getAntdThemeConfig(...)` 注入
  - 应用根入口
  - 认证页容器
  - 导航菜单
- Tailwind / 自定义样式统一使用语义变量
  - `--color-*`
  - `--ctp-*`
- `dark` 变体覆盖所有深色 Catppuccin 主题，而不是单独依赖 `data-theme="dark"`

相关位置：

- [packages/console/src/utils/catppuccin.antd.ts](../packages/console/src/utils/catppuccin.antd.ts)
- [packages/console/src/utils/theme.ts](../packages/console/src/utils/theme.ts)
- [packages/console/src/assets/styles/theme/variables.css](../packages/console/src/assets/styles/theme/variables.css)
- [packages/console/src/assets/styles/theme/dark-mode.css](../packages/console/src/assets/styles/theme/dark-mode.css)
- [packages/console/src/assets/styles/base/scrollbar.css](../packages/console/src/assets/styles/base/scrollbar.css)

## Markdown 与构建

Markdown 能力当前由 `markdown-to-jsx` 与 Shiki 组合完成：

- `MarkdownExample` 页面用于集中验证 Markdown 渲染效果
- 代码高亮语言按白名单动态加载，未支持语言回退到 `text`
- 常见别名会在高亮前归一化，例如：
  - `ts -> typescript`
  - `bash / sh / zsh -> shellscript`
  - `yml -> yaml`
- 高亮主题与 Catppuccin 主题 ID 对齐

相关位置：

- [packages/console/src/components/ui/markdown/Markdown.tsx](../packages/console/src/components/ui/markdown/Markdown.tsx)
- [packages/console/src/components/ui/markdown/core/code-hightlighter/index.ts](../packages/console/src/components/ui/markdown/core/code-hightlighter/index.ts)
- [packages/console/src/pages/example/MarkdownExample.tsx](../packages/console/src/pages/example/MarkdownExample.tsx)
- [packages/console/vite.config.ts](../packages/console/vite.config.ts)

## 与 Nexus 的协作方式

`console` 默认通过 `/api` 代理访问 `nexus`。

本地开发约定：

- Console: `http://localhost:2333`
- Nexus: `http://localhost:7788`
- 前端通过 Vite proxy 将 `/api` 转发到 `nexus`

前端主要依赖的认证接口：

- `GET /api/auth/sign-in/github`
- `GET /api/auth/callback/github`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`

其中：

- GitHub 登录通过浏览器重定向进入，不走 Eden Treaty 请求封装
- 邮箱登录、登出和 session 查询继续通过现有 Query / Mutation 处理

当前系统管理页面还会调用：

- 用户接口：`GET /api/user`、`GET /api/user/:id`、`PATCH /api/user/:id`、`GET /api/user/me`、`PATCH /api/user/me`
- 角色与权限接口：`GET /api/rbac/roles`、`GET /api/rbac/users/:userId/roles`、`POST /api/rbac/users/:userId/roles`、`DELETE /api/rbac/users/:userId/roles/:roleId`、`GET /api/rbac/users/:userId/permissions`、`GET /api/rbac/users/me/roles`、`GET /api/rbac/users/me/permissions`

相关请求位置：

- [packages/console/src/modules/user/index.ts](../packages/console/src/modules/user/index.ts)
- [packages/console/src/modules/rbac/index.ts](../packages/console/src/modules/rbac/index.ts)

联调时需要注意：

- Better Auth 会校验请求来源
- `packages/nexus/config.yaml` 中需要包含前端实际访问来源，例如 `http://localhost:2333`

## 权限语义

前端与服务端的权限分工如下：

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
6. 通过侧边栏进入 `/users`、`/roles`，确认列表和分页请求正常
7. 进入 `/users/:id`、`/users/:id/edit`、`/users/:id/access`，确认详情、编辑和角色分配流程正常
8. 通过头像菜单进入 `/profile` 与 `/my-access`，确认资料页和当前用户权限页正常
9. 切换不同 Catppuccin 主题后，菜单、抽屉、认证页样式保持一致
10. 访问 `/ui-showcase`，确认组件、设计令牌与主题色展示正常
11. 访问 `/markdown-example`、`/image-crop`、`/error-example`、`/forbidden-example` 和 `/not-found-example`，确认示例页按预期渲染

## 相关阅读

- [README.md](../README.md)
- [architecture.md](./architecture.md)
- [development.md](./development.md)
- [authentication.md](./authentication.md)
- [packages/console/README.md](../packages/console/README.md)
