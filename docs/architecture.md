# 项目架构

## 架构结论

当前核心原则：

- route 直接表达 HTTP 结构
- plugin 只承载框架级能力
- module 只承载业务逻辑
- schema 作为唯一契约源
- client 默认直接返回业务数据

## 目录结构

`packages/nexus/src/`：

```text
src/
├── app.ts
├── server.ts
├── index.ts
├── plugins/
├── routes/
├── modules/
├── core/
├── infra/
└── shared/
```

## 启动链路

### `app.ts`

负责创建 `Elysia` 实例并装配：

- 全局插件
- 路由聚合

不负责：

- 监听端口
- 优雅关闭
- 启动日志

### `server.ts`

负责：

- `app.listen(...)`
- 启动日志
- 进程关闭与优雅退出

### `index.ts`

只做启动入口。

## 插件层

`plugins/` 只保留框架级能力组合。

### `app.plugin.ts`

聚合全局插件：

- CORS
- OpenAPI
- 统一错误处理
- 请求日志

### `auth.plugin.ts`

提供：

- `getAuth(request)`
- `requireAuth(request)`

它解决“你是谁”。

### `protected.plugin.ts`

在进入路由前执行 `requireAuth(request)`。

它解决“你是否必须已登录”。

### `permission.plugin.ts`

在 `protectedPlugin` 基础上导出统一权限 API：

- `Permissions`
- `permit.permission(...)`
- `permit.own(...)`
- `permit.me(...)`

它解决“你能做什么”。

## 路由层

`routes/*.route.ts` 只负责：

1. prefix / tags
2. plugin 组合
3. request schema / response schema
4. 调用 service

典型写法：

```ts
export const userRoutes = new Elysia({
  prefix: '/user',
  tags: ['User'],
})
  .use(permissionPlugin)
  .get('/', async ({ query }) => await UserService.list(query), {
    query: UserListQuerySchema,
    beforeHandle: [permit.permission(Permissions.USER.READ_ALL)],
    detail: apiDetail({
      summary: '获取用户列表',
      response: UserListSchema,
      errors: [400, 401, 403],
    }),
  })
```

## 模块层

`modules/*` 是纯业务层。

通常由这些文件组成：

- `*.model.ts`
- `*.service.ts`
- `*.repository.ts`
- `*.types.ts`
- `index.ts`

模块层只承载 Elysia route 之外的业务能力。

## core / infra / shared

### `core/`

只保留真正跨业务的核心能力：

- 认证
- 配置
- 权限系统
- 错误插件

### `infra/`

基础设施实现：

- Prisma / DB helpers
- logger
- seed / schema

### `shared/`

轻量公共工具，例如 `apiDetail(...)`。

## 协议层

### 服务端

- 成功响应直接返回业务数据
- 删除类接口返回 `204`
- 错误响应统一由错误插件处理

### schema

`@xdd-zone/schema` 是唯一契约源，分为：

- `domains/*`
- `contracts/*`
- `shared/*`
- `adapters/*`

### client

- 默认返回业务数据
- `requestRaw()` 才返回状态码与 headers
- 默认 headers / timeout 全局生效
- 自定义 headers 与内部 `Cookie` / `Origin` / `Content-Type` 合并

## 当前实现摘要

- API 服务使用 `app.ts + server.ts + plugins/ + routes/ + modules/`
- 鉴权边界使用 `authPlugin / protectedPlugin / permissionPlugin`
- 成功响应直接返回业务数据
- 分页结构统一为 `items / total / page / pageSize / totalPages`
- client 与 schema 使用同一套成功契约与错误契约
