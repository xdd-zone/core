# Momo 后端指南

这份文档说明 `apps/momo` 后续怎么组织。

## 后续保留内容

`@xdd-zone/momo` 是 Hono API 服务，运行在 Node.js 上。

后续保留这些约定：

- `src/index.ts` 只启动 Node 服务。
- `src/app.ts` 创建 Hono app，注册全局中间件、错误处理和路由，导出 `AppType`。
- `src/routes/index.ts` 只挂载一级路由。
- `src/modules` 放业务模块。
- `src/middleware` 放通用 Hono middleware。
- `src/infra` 放数据库、缓存、文件存储这类外部资源接入代码。
- `src/shared` 放 Momo 内部共用代码。
- `src/test` 放接口测试。

接口请求和响应的 schema、类型、统一响应结构继续放在 `packages/contracts`。

## 关键目录

```text
apps/momo/src/
├── index.ts
├── app.ts
├── routes/
├── modules/
├── middleware/
├── infra/
├── shared/
└── test/
```

最常改的地方：

- `routes/index.ts`
  一级路由挂载文件。
- `modules`
  业务模块。每个模块放自己的 route、service、repository 和内部类型。
- `middleware`
  登录态检查、request id、请求日志、权限检查这类通用 middleware。
- `infra`
  数据库、缓存、文件存储和第三方 SDK 的连接代码。
- `shared`
  错误类型、环境变量读取、Hono 类型、响应 meta 和校验辅助函数。
- `test`
  用 `app.request()` 写接口测试。

## 后续目录

```text
apps/momo/src/
├── index.ts
├── app.ts
├── routes/
│   └── index.ts
├── modules/
│   ├── system/
│   │   ├── system.route.ts
│   │   └── system.service.ts
│   ├── auth/
│   │   ├── auth.route.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   └── auth.types.ts
│   └── user/
│       ├── user.route.ts
│       ├── user.service.ts
│       ├── user.repository.ts
│       └── user.types.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── request-id.middleware.ts
├── infra/
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema/
│   │   │   ├── index.ts
│   │   │   └── user.schema.ts
│   │   └── migrations/
│   ├── cache/
│   │   └── client.ts
│   └── storage/
│       └── client.ts
├── shared/
│   ├── app-error.ts
│   ├── env.ts
│   ├── hono-env.ts
│   ├── meta.ts
│   ├── response.ts
│   └── validator.ts
└── test/
    ├── system.test.ts
    ├── auth.test.ts
    └── user.test.ts
```

## 入口和 app

`src/index.ts` 只负责启动服务。

这里读取环境变量，调用 `@hono/node-server` 的 `serve()`，监听端口。

不要在这里写：

- 路由。
- 中间件。
- 业务判断。
- 数据库代码。

`src/app.ts` 只负责创建和组装 Hono app。

这里做这些事：

- 创建 `new Hono<HonoEnv>()`。
- 注册全局中间件。
- 注册 `onError()`。
- 注册 `notFound()`。
- 挂载 `routes/index.ts`。
- 导出 `app`、默认导出和 `AppType`。

`AppType` 要保留。Fifa 后续可以用它拿到 Momo 的路由类型。

## 路由

路由入口文件：

```text
apps/momo/src/routes/index.ts
```

这个文件只挂载一级路由。

示例：

```ts
const routes = new Hono<HonoEnv>()
  .route('/', systemRoute)
  .route('/rpc/auth', authRoute)
  .route('/rpc/users', userRoute)

export type RoutesType = typeof routes

export default routes
```

这里不写请求处理函数，不直接访问数据库，也不拼响应内容。

## 业务模块

业务模块放在：

```text
apps/momo/src/modules/<module>
```

每个模块使用同一组文件名：

```text
modules/<module>/
├── <module>.route.ts
├── <module>.service.ts
├── <module>.repository.ts
└── <module>.types.ts
```

`<module>.route.ts` 写 Hono 路由、请求校验、调用 service、返回 Hono response。

这里可以引入：

- `hono`
- `@hono/zod-validator`
- `@xdd-zone/contracts`
- 同目录的 service
- `shared` 里的通用函数和错误类型

路由处理函数直接返回 `c.json()`、`c.text()`、`c.redirect()` 这类 Hono response。

`<module>.service.ts` 写业务判断和数据组装。

这里可以调用 repository，也可以抛出 `AppError`。

不要在 service 里返回 `c.json()`，也不要依赖 Hono 的 `Context`。

`<module>.repository.ts` 只写数据库读写。

这里可以引入 `infra/db`。不要引入 Hono app、route 或 service。

repository 返回普通数据，错误处理交给 service 或 `app.ts` 的 `onError()`。

`<module>.types.ts` 只放 Momo 内部使用的模块类型。

前后端共用的请求 schema、请求类型、响应类型和响应结构放在 `packages/contracts`。

## system 模块

`system` 模块放服务自检接口。

后续文件：

```text
apps/momo/src/modules/system/
├── system.route.ts
└── system.service.ts
```

接口包括：

- `GET /`
- `GET /health`
- `POST /rpc/system/ping`

`system` 模块不直接访问数据库。需要读取运行环境时，调用 `shared/env.ts`。

## 中间件

通用中间件放在：

```text
apps/momo/src/middleware
```

适合放这里的代码：

- 登录态检查。
- request id 生成和写入。
- 请求日志。
- 权限检查。

只被一个 route 使用一次的中间件，可以先放在对应的 `<module>.route.ts`。

## 外部资源

外部资源接入代码放在：

```text
apps/momo/src/infra
```

数据库相关代码放在：

```text
apps/momo/src/infra/db
```

这里放数据库 client、schema 和 migrations。

业务模块不能在 route 里直接创建数据库连接。需要读写数据库时，先写 repository，再由 service 调用 repository。

缓存相关代码放在：

```text
apps/momo/src/infra/cache
```

如果后续接 Redis 或其他缓存服务，连接代码放在这里。

文件存储相关代码放在：

```text
apps/momo/src/infra/storage
```

如果后续接对象存储，上传、下载和删除文件的 client 放在这里。

## 共用代码

Momo 内部共用代码放在：

```text
apps/momo/src/shared
```

常用文件：

- `app-error.ts`
  放 `AppError` 和错误状态类型。service 可以抛出 `AppError`，`app.ts` 的 `onError()` 负责把它转成统一失败响应。
- `env.ts`
  读取和校验 Node 环境变量。当前 Momo 使用 `APP_ENV` 和 `PORT`。新增环境变量时先改这里。
- `hono-env.ts`
  定义 Hono 的 `Bindings` 和 `Variables` 类型。所有 `new Hono()` 都使用 `new Hono<HonoEnv>()`。
- `meta.ts`
  生成接口响应里的 `meta`。当前包含 `requestId` 和 `timestamp`。
- `response.ts`
  放 Momo 内部响应辅助函数。如果 route 里反复调用 `buildSuccess()` 或 `buildFailure()`，可以在这里封一层短函数。
- `validator.ts`
  放请求校验辅助函数。如果多个 route 都需要同一种 zod validator 错误响应，可以在这里写共用函数。

## 路径别名

Momo 使用 `#momo/*` 做内部路径别名。

配置放在：

- `apps/momo/package.json`
  通过 `imports` 让 Node 运行时识别 `#momo/*`。
- `apps/momo/tsconfig.json`
  通过 `paths` 让 TypeScript 识别 `#momo/*`。

当前别名：

```json
{
  "#momo/routes": "./src/routes/index.ts",
  "#momo/*": "./src/*.ts"
}
```

跨目录引用使用 `#momo/*`：

```ts
import routes from '#momo/routes'
import { getMomoEnv } from '#momo/shared/env'
import systemRoute from '#momo/modules/system/system.route'
```

同目录引用继续使用相对路径：

```ts
import { createMeta } from './meta'
import { getHealthStatus } from './system.service'
```

不要在 Momo 里新增 `baseUrl`。`paths` 里的目标路径要写成 `./src/*` 这种显式相对路径。

## 引用方向

代码按这个方向引用：

```text
index.ts
  -> app.ts
    -> routes/index.ts
      -> modules/*/*.route.ts
        -> modules/*/*.service.ts
          -> modules/*/*.repository.ts
            -> infra/*
```

通用代码引用规则：

- `app.ts` 可以引用 `routes`、`middleware`、`shared`。
- `routes/index.ts` 只引用 `modules/*/*.route.ts`。
- `*.route.ts` 可以引用同模块 service、`contracts`、`shared`。
- `*.service.ts` 可以引用同模块 repository、`contracts`、`shared`。
- `*.repository.ts` 可以引用 `infra/db`。
- `infra` 不引用 `modules`。
- `shared` 不引用 `modules`、`routes` 和 `app.ts`。

## 新增接口

新增接口按这个顺序改：

1. 在 `packages/contracts/src/<module>` 添加请求 schema 和响应类型。
2. 在 `apps/momo/src/modules/<module>/<module>.route.ts` 添加 Hono route。
3. 需要业务判断时，在同目录添加或修改 `<module>.service.ts`。
4. 需要数据库读写时，在同目录添加或修改 `<module>.repository.ts`。
5. 在 `apps/momo/src/routes/index.ts` 挂载模块路由。
6. 在 `apps/momo/src/test/<module>.test.ts` 添加接口测试。

## 测试

测试文件放在：

```text
apps/momo/src/test
```

按业务模块命名：

```text
apps/momo/src/test/system.test.ts
apps/momo/src/test/auth.test.ts
apps/momo/src/test/user.test.ts
```

接口测试继续使用 `app.request()`。

示例：

```ts
const response = await app.request('/health')
expect(response.status).toBe(200)
```

这样测试不需要启动真实端口。

## 运行和检查

```bash
pnpm dev:momo
pnpm build:momo
pnpm type-check
cd apps/momo && pnpm test
```
