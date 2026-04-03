# 开发指南

## 开发前提

- Bun 1.3.5
- Docker 可用
- `.env` 已配置 `DATABASE_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`
- `packages/nexus/config.yaml` 的 `trustedOrigins` 已包含当前 Console 来源

常用初始化命令：

```bash
bun install
bun run prisma:generate
bun run db:local:prepare
```

## 标准开发动作

新增或修改公共 API 时，默认按下面顺序推进：

1. 改模块 `model.ts`
2. 改 `service.ts / repository.ts`
3. 在模块 `index.ts` 注册或调整路由
4. 完成 Eden / OpenAPI / 权限回归

修改后台前端时，默认按下面顺序推进：

1. 确认 `nexus` 现有接口和登录态约定
2. 先接 `console` 的 Eden Treaty 公共请求层，或确认当前是否走浏览器重定向
3. 再改 `app/router`、`app/navigation`、`layout` 或页面
4. 完成 `lint / type-check / build`

## 代码放哪一层

### `packages/nexus/src/modules/*/index.ts`

放：

- 模块 Elysia 实例
- prefix / tags
- route schema 绑定
- `apiDetail(...)`
- `auth / permission / own / me`
- 调用当前模块 service

不要在这里放：

- Prisma 查询
- 散落的业务判断
- Better Auth 底层适配细节

### `packages/nexus/src/core/security/*`

放：

- `auth/`
  - Better Auth 接入
  - session 解析
  - 认证接口动作
  - 登出处理
- `plugins/`
  - 认证插件
  - 权限插件
- `guards/`
  - 登录校验
  - 权限校验
  - 所有权校验
- `permissions/`
  - 权限常量
  - 固定角色名称
  - 权限查询
  - 权限匹配辅助函数

使用建议：

- `modules/auth` 只放 `/auth` 路由入口和 HTTP schema
- 登录、注册、登出这类认证接口动作统一放 `core/security/auth/*`
- 需要 `permission / own / me` 的模块只使用 `accessPlugin`
- 只读取可选 session 的模块接 `authPlugin`
- 只要求登录且不做权限判断的接口，优先使用 `authPlugin + auth: 'required'`
- 使用 `accessPlugin` 时，也可以直接声明 `auth: 'required'`
- `plugins/*` 只做 Elysia 上下文注入和路由守卫编排，不直接写业务查询
- 固定角色名称统一在 `core/security/permissions/role.constants.ts` 维护
- `auth`、`user` 等模块共用的基础 schema 统一放 `shared/schema/*`

### `packages/nexus/src/modules/*/model.ts`

放：

- body / query / params schema
- 成功 response schema
- route 复用的 HTTP 类型

### `packages/nexus/src/modules/*/service.ts`

放：

- 业务编排
- 资源存在性校验
- 领域层判断

### `packages/nexus/src/modules/*/repository.ts`

放：

- Prisma 查询与写入
- 数据选择与持久化细节

### `packages/console/src/app/router/*`

放：

- TanStack Router 路由树
- `beforeLoad` 登录校验与重定向
- 根路径重定向
- 路由元信息

### `packages/console/src/app/navigation/*`

放：

- 侧边栏与移动端菜单配置
- 菜单分组与展示顺序

### `packages/console/src/modules/auth/*`

放：

- `/api/auth/get-session`
- `/api/auth/sign-in/email`
- `/api/auth/sign-out`
- GitHub 登录地址 helper
- auth query
- auth store 中的会话快照使用范围

补充说明：

- GitHub 登录地址由 `packages/console/src/modules/auth/auth.api.ts` 统一构造
- 这条流程仍然是浏览器跳转，不经过 Eden Treaty 请求封装
- 其他认证 query / mutation 直接调用 `packages/console/src/shared/api/eden.ts` 中的 Treaty 客户端
- 如果修改 GitHub 登录入口，要同时检查 API 基址配置、`trustedOrigins`、GitHub callback URL，并确认浏览器可以直接访问这条地址；本地开发再检查 `/api` 代理

### `packages/console/src/modules/user/*` 与 `packages/console/src/modules/rbac/*`

放：

- 基于 Eden Treaty 的 query / mutation
- 只在前端使用的 query key 和组合逻辑
- 从 `@xdd-zone/nexus/user-types`、`@xdd-zone/nexus/rbac-types` 引入的 HTTP 类型

补充说明：

- 不再为 `user`、`rbac` 额外维护一层 1:1 的 API wrapper
- 页面直接通过 query / mutation 调用 Treaty 客户端
- 权限判断需要的常量和匹配辅助函数统一从 `@xdd-zone/nexus/permissions` 引入

## 新增接口的推荐流程

### 第 1 步：定义接口 schema

推荐位置：

- `packages/nexus/src/modules/<name>/model.ts`

至少明确：

- body
- query
- params
- response

### 第 2 步：实现 service / repository

如果涉及数据库访问：

- Prisma 访问下沉到 repository
- service 只保留业务编排

### 第 3 步：在模块入口注册路由

推荐写法：

```ts
export const userModule = new Elysia({
  prefix: '/user',
  tags: ['User'],
})
  .use(accessPlugin)
  .get('/', async ({ query }) => await UserService.list(query), {
    permission: Permissions.USER.READ_ALL,
    query: UserListQuerySchema,
    response: UserListSchema,
    detail: apiDetail({
      summary: '获取用户列表',
      response: UserListSchema,
      errors: [400, 401, 403],
    }),
  })
```

必须登录但不做权限判断时：

```ts
.get('/me', ({ auth }) => SessionSchema.parse(auth), {
  auth: 'required',
  response: SessionSchema,
})
```

### 第 4 步：验证

至少执行：

```bash
bun run format
bun run lint
bun run type-check
```

如果涉及公共 API，再补：

- 访问 `/openapi` 或 `/openapi/json` 检查接口说明
- Eden smoke test
- 如果涉及 GitHub 登录，再检查 GitHub OAuth App callback URL、`trustedOrigins`、API 基址是否可以被浏览器直接访问；本地开发再检查 `/api` 代理

## 命名建议

模块目录统一使用：

- `index.ts`
- `model.ts`
- `service.ts`
- `repository.ts`
- `constants.ts`
- `types.ts`

说明：

- `model.ts` 表达 HTTP schema，不表示 Prisma model
- schema 命名继续使用 `UserSchema`、`RoleListSchema` 这类写法
- 模块实例统一使用 `userModule`、`authModule`、`rbacModule`

## 类型安全要求

- 禁止 `any`
- route 的 `body / query / params / response` 优先从模块 `model.ts` 推导
- 提供给前端使用的 HTTP 类型统一从 `packages/nexus/src/public/*-types.ts` 导出
- Console 不单独维护第二套接口类型
- repository 优先复用 Prisma 生成类型
- service 方法签名写清楚入参与返回值

## 收尾检查

完成代码后，再做一次检查：

- 搜索是否残留 `any` 或 `as any`
- 检查 `model / service / repository` 是否职责清楚
- 检查模块入口是否已经声明正确的鉴权
- 检查 `/openapi` 页面和 Eden 是否还能正常工作
