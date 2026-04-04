# XDD Zone Console 参考

## 目录

1. 当前前端结构
2. 改页面前先看哪里
3. 当前前端协作方式
4. 路由、导航、访问控制骨架
5. 页面与联调检查清单

## 当前前端结构

当前 `packages/console/src/` 重点目录：

```text
src/
├── app/
│   ├── access/
│   ├── navigation/
│   └── router/
├── modules/
│   ├── auth/
│   ├── rbac/
│   └── user/
├── pages/
├── layout/
├── hooks/
├── stores/
└── shared/api/
```

关键结论：

- 路由集中在 `app/router/routes.tsx`
- 登录重定向和游客/登录校验在 `app/router/guards.tsx`
- 页面访问权限在 `app/access/access-control.ts`
- 菜单在 `app/navigation/navigation.ts`
- 认证、用户、RBAC 请求都通过模块内 `*.query.ts` 直接调用 Eden Treaty
- GitHub 登录地址由 `modules/auth/auth.api.ts` 构造
- 后台壳层统一在 `layout/*`

不要继续沿用旧的 `user.api.ts`、`rbac.api.ts` 或在页面里自己写一层平行请求封装。

## 改页面前先看哪里

### 所有 Console 界面任务

先看：

- `packages/console/.impeccable.md`
- `docs/console.md`
- `packages/console/README.md`

### 路由、页面入口、TabBar、面包屑

- `packages/console/src/app/router/routes.tsx`
- `packages/console/src/app/router/guards.tsx`
- `packages/console/src/hooks/useRouteListener.ts`

### 菜单和后台入口

- `packages/console/src/app/navigation/navigation.ts`
- `packages/console/src/app/access/access-control.ts`

### 认证、GitHub 登录、会话恢复

- `packages/console/src/modules/auth/auth.api.ts`
- `packages/console/src/modules/auth/auth.query.ts`
- `packages/console/src/modules/auth/auth.store.ts`
- `packages/console/src/pages/auth/Login.tsx`

### 用户、角色、权限页面

- `packages/console/src/modules/user/`
- `packages/console/src/modules/rbac/`
- `packages/console/src/pages/user/`
- `packages/console/src/pages/role/`
- `packages/console/src/pages/access/`
- `packages/console/src/pages/dashboard/Dashboard.tsx`

### 布局、主题、移动端菜单

- `packages/console/src/layout/`
- `packages/console/src/stores/modules/`
- `packages/console/src/assets/styles/theme/`
- `docs/theme.md`

## 当前前端协作方式

### 与 Nexus 的接口协作

- `packages/console/src/shared/api/eden.ts` 统一创建 Treaty 客户端
- 默认带 `credentials: 'include'`
- 统一通过 `unwrapEdenResponse(...)` 拆错误
- 页面和 query 文件直接调用 `api`

常见调用方式：

```ts
await api.auth.methods.get()
await api.auth['get-session'].get()
await api.user.get({ query })
await api.user({ id }).get()
await api.rbac.users({ userId }).roles.get()
```

### GitHub 登录是例外

GitHub 登录继续走浏览器重定向：

1. 前端读取登录页 `redirect`
2. `getGithubSignInUrl(...)` 生成可访问地址
3. 浏览器跳到 `/api/auth/sign-in/github`
4. Nexus 回调并写 cookie
5. Router 再通过 `ensureAuthSession(...)` 恢复登录态

不要把这条流程改成普通 JSON 请求。

### 页面访问控制

当前 Console 有两层保护：

1. `requireAuth(...)`
   - 先确认有没有登录
2. `ensureConsolePathAccess(...)`
   - 再按当前用户权限判断页面是否可访问

所以：

- 菜单不是唯一权限入口
- 页面组件内部不要重复写整页级权限跳转
- 访问 `/users/$id/access`、`/users/$id/edit`、`/roles` 这类页面时，优先复用 `app/access/access-control.ts`

## 路由、导航、访问控制骨架

### 路由骨架

```tsx
const exampleRoute = createRoute({
  component: lazyRouteComponent(() => import('@console/pages/example/ExamplePage'), 'ExamplePage'),
  getParentRoute: () => appLayoutRoute,
  path: 'example',
  staticData: {
    icon: LayoutTemplate,
    title: 'menu.example',
  },
})
```

规则：

- 后台页面默认挂在 `appLayoutRoute` 下
- `staticData.title` 优先用 i18n key
- 不进 TabBar 的页面显式设 `tab: false`

### 导航骨架

```ts
{
  icon: LayoutTemplate,
  key: 'example',
  label: 'menu.example',
  path: '/example',
}
```

规则：

- `path` 用绝对路径
- `key` 保持稳定
- 菜单负责入口组织，不负责服务端权限判定

### 访问控制骨架

如果新增后台页面会受权限影响，先补：

- `packages/console/src/app/access/access-control.ts`

参考现有写法：

```ts
{
  matcher: createPathMatcher('/users/$id/edit'),
  pathPattern: '/users/$id/edit',
  requirement: {
    all: [Permissions.USER.READ_ALL, Permissions.USER.UPDATE_ALL],
  },
}
```

规则：

- 先判断当前路径是不是已经落在现有规则里
- 只有新增页面真的需要独立访问控制时，才补新的 path rule
- 不要把这一层逻辑散落到导航过滤和页面组件里

## 页面与联调检查清单

- 是否已经先遵守 `packages/console/.impeccable.md`
- 新页面是否在正确路由分组下
- 是否需要同步 `navigation.ts`
- 是否需要补 `app/access/access-control.ts`
- 用户可见文案是否同时补 `zh.ts` 和 `en.ts`
- 是否继续复用 `RootLayout`
- 是否复用 `Loading`、Antd `Alert`、`message`
- 是否直接使用 `api` 和模块内 query / mutation，而不是新建平行 API 层
- 是否误把权限判断写进页面、菜单或路由之外的随机位置
- 如果涉及 GitHub 登录，是否同时检查 API 基址、`trustedOrigins`、callback URL

推荐收尾命令：

```bash
bun run --filter @xdd-zone/console type-check
bun run build:console
```
