# Console 前端指南

## 包定位

`@xdd-zone/console` 是当前仓库中的后台管理前端，负责：

- 管理后台页面与交互
- 路由、导航、布局与标签页
- 登录态初始化与登录/登出流程
- 消费 `@xdd-zone/nexus` 提供的认证与业务接口


当前前端的工作方式很直接：

- 前端路由只判断“是否已登录”
- 菜单负责导航组织与页面入口
- 页面业务权限以服务端返回的 `401 / 403` 为准
- 登录态以 `/api/auth/get-session` 为唯一真相源

## 技术栈

- React 19
- TypeScript 5.9
- React Router 7
- Zustand
- Ant Design 6
- Tailwind CSS 4
- i18next
- Vite 7

## 目录结构

当前 `packages/console/src/` 的关键结构如下：

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
  - 应用级路由配置与路由守卫
- `app/navigation/`
  - 导航结构与菜单配置
- `modules/auth/`
  - 登录态请求、auth store、session 类型
- `pages/`
  - 页面入口组件
- `layout/`
  - 后台整体布局、头部、侧边栏、移动端抽屉
- `stores/`
  - 主题、布局、TabBar 等 UI 状态
- `utils/`
  - 路由辅助、路径处理、主题工具

## 路由模型

当前路由按访问场景划分为两组：

- `public routes`
  - `/login`
- `protected routes`
  - `/dashboard`
  - `/articles`
  - `/categories`
  - `/tags`
  - `/comments`
  - `/article-settings`
  - `/image-crop`

配套错误页：

- `/403`
- `/404`

应用入口 `/` 会根据当前登录态自动重定向：

- 已登录 -> `/dashboard`
- 未登录 -> `/login`

路由配置位置：

- [packages/console/src/app/router/routes.tsx](../packages/console/src/app/router/routes.tsx)

守卫组件位置：

- [packages/console/src/app/router/guards.tsx](../packages/console/src/app/router/guards.tsx)

## 登录态模型

前端登录态由服务端 session cookie 驱动，页面刷新后会重新向 `nexus` 请求当前会话。

当前 auth store 管理：

- `user`
- `session`
- `isAuthenticated`
- `isBootstrapping`
- `loginPending`

核心动作：

- `bootstrapSession()`
  - 应用启动时拉取 `/api/auth/get-session`
- `login(payload)`
  - 调用 `/api/auth/sign-in/email`，然后刷新 session
- `logout()`
  - 调用 `/api/auth/sign-out`，然后清空前端状态

代码位置：

- [packages/console/src/modules/auth/auth.api.ts](../packages/console/src/modules/auth/auth.api.ts)
- [packages/console/src/modules/auth/auth.store.ts](../packages/console/src/modules/auth/auth.store.ts)

应用启动入口会统一触发 session 初始化：

- [packages/console/src/App.tsx](../packages/console/src/App.tsx)

## 菜单与导航

菜单和路由分别承担不同职责：

- 路由负责页面访问与跳转
- 导航配置负责侧边栏和移动端菜单展示
- 标签页根据当前访问页面生成

导航配置位置：

- [packages/console/src/app/navigation/navigation.ts](../packages/console/src/app/navigation/navigation.ts)

当前导航分组：

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

当前后台保留统一外壳与页面容器能力：

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

## 与 Nexus 的协作方式

`console` 默认通过 `/api` 代理访问 `nexus`。

本地开发约定：

- Console: `http://localhost:2333`
- Nexus: `http://localhost:7788`
- 前端通过 Vite proxy 将 `/api` 转发到 `nexus`

当前前端主要依赖的认证接口：

- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`

联调时需要注意：

- Better Auth 会校验请求来源
- `packages/nexus/config.yaml` 中需要包含前端实际访问来源，例如 `http://localhost:2333`

## 权限语义

前端与服务端的权限职责边界如下：

- 未登录访问后台页：前端路由守卫拦截并跳 `/login`
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
4. 刷新页面后能通过 `/api/auth/get-session` 恢复登录态
5. 退出登录后返回 `/login`

## 相关阅读

- [README.md](../README.md)
- [architecture.md](./architecture.md)
- [development.md](./development.md)
- [authentication.md](./authentication.md)
- [packages/console/README.md](../packages/console/README.md)
