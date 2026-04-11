# Console 前端指南

这份文档说明 `packages/console` 现在怎么组织，以及改页面时该先看哪几处。

## 包定位

`@xdd-zone/console` 是后台管理前端，当前主要负责：

- 页面、布局、导航
- 登录页和登录态恢复
- 页面访问控制
- 调用 Nexus 接口并展示结果
- 主题切换和示例页

## 开始改 UI 前先做什么

只要任务涉及页面、布局、导航或展示型组件，先看：

1. `packages/console/design-context.md`
2. `packages/console/README.md`
3. 这份文档

## 关键目录

```text
packages/console/src/
├── app/
├── components/
├── layout/
├── modules/
├── pages/
├── stores/
└── utils/
```

最常改的地方：

- `app/router`
  路由树、登录守卫、重定向。
- `app/navigation`
  菜单配置。
- `app/access/access-control.ts`
  页面访问控制。
- `modules/auth`
  登录、登出、session 查询。
- `modules/user`
  用户相关请求。
- `modules/rbac`
  角色和权限相关请求。
- `modules/post`、`modules/comment`、`modules/media`、`modules/site-config`
  内容管理相关请求。
- `pages/*`
  页面入口。

## 路由模型

当前路由统一放在：

- `packages/console/src/app/router/routes.tsx`

当前主要路径：

- `/login`
- `/dashboard`
- `/users`
- `/users/$id`
- `/users/$id/edit`
- `/users/$id/access`
- `/roles`
- `/profile`
- `/my-access`
- `/articles`
- `/articles/new`
- `/articles/$id`
- `/articles/$id/edit`
- `/categories`
- `/tags`
- `/comments`
- `/article-settings`
- `/ui-showcase`
- `/markdown-example`
- `/tiptap-example`
- `/image-crop`
- `/error-example`
- `/forbidden-example`
- `/not-found-example`
- `/403`
- `/404`

## 菜单和路由怎么配合

- 路由负责页面访问和跳转
- 菜单负责展示入口
- 页面是否允许访问，还会再走 `app/access/access-control.ts`

当前菜单放在：

- `packages/console/src/app/navigation/navigation.ts`

如果你新增页面，通常要同时检查这三处：

1. `routes.tsx`
2. `navigation.ts`
3. `access-control.ts`

## 登录态模型

前端登录态由后端 session cookie 驱动。

当前做法：

1. 通过 `GET /api/auth/get-session` 读取当前会话
2. React Query 缓存 session
3. 路由进入前先确认 session
4. 登录成功或登出后，更新缓存和页面跳转

主要文件：

- `packages/console/src/modules/auth/auth.query.ts`
- `packages/console/src/modules/auth/auth.store.ts`
- `packages/console/src/app/router/guards.tsx`

## 请求层怎么写

前端统一在这里创建 Treaty 客户端：

- `packages/console/src/shared/api/eden.ts`

页面和模块默认直接用这个客户端，不再额外写一层一一对应的接口包装。

需要明确 HTTP 类型时，从 `@xdd-zone/nexus/*-types` 引入。

## 页面访问控制

页面级访问控制统一在：

- `packages/console/src/app/access/access-control.ts`

这里负责判断当前用户能不能进入某个后台路径。
如果后端接口返回 `401 / 403`，前端页面也应保持同样语义。

## 当前页面分组

### 系统管理

- 用户列表
- 用户详情
- 用户编辑
- 指定用户权限
- 角色列表
- 我的资料
- 我的权限

### 内容管理

- 文章列表
- 新建文章
- 文章详情
- 编辑文章
- 分类管理
- 标签管理
- 评论管理
- 文章设置

### 示例页

- UI Showcase
- Markdown Example
- Tiptap Example
- Image Crop
- Error Example
- Forbidden Example
- Not Found Example

## 改动建议

### 新增页面

按这个顺序看：

1. 是否已经有后端接口
2. `routes.tsx` 是否需要加新路径
3. `navigation.ts` 是否需要加新入口
4. `access-control.ts` 是否需要补访问规则
5. `modules/*` 是否需要补 query / mutation

### 改登录或 GitHub 登录

同时检查：

- `packages/console/src/modules/auth/auth.api.ts`
- `packages/console/src/modules/auth/auth.query.ts`
- `packages/console/src/pages/auth/Login.tsx`
- `packages/console/src/app/router/guards.tsx`

### 改主题

看：

- `packages/console/src/assets/styles/theme/*`
- `packages/console/src/utils/theme.ts`
- `packages/console/src/utils/catppuccin.antd.ts`
- [docs/theme.md](./theme.md)
