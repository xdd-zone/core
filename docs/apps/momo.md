# Momo 后端指南

这份文档说明 `apps/momo` 后续怎么组织。

## 后续保留内容

`@xdd-zone/momo` 是 Hono API 服务，运行在 Node.js 上。

后续保留这些约定：

- `src/index.ts` 只启动 Node 服务。
- `src/app.ts` 创建 Hono app，注册全局中间件、错误处理和路由，导出运行时 app。
- `src/rpc.ts` 导出给 Hono RPC client 使用的 `AppType`。
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
  业务模块。模块先按当前需要放 route、service、repository 和内部类型，文件变多后再迁到目录里。
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
│   │   ├── services/
│   │   │   ├── index.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── session.service.ts
│   │   │   └── password-reset.service.ts
│   │   ├── repositories/
│   │   │   ├── index.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── session.repository.ts
│   │   │   └── password-reset.repository.ts
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
- 导出 `app` 和默认导出。

`AppType` 从 `src/rpc.ts` 导出。Fifa 后续可以用它拿到 Momo 的路由类型。

## 路由

路由入口文件：

```text
apps/momo/src/routes/index.ts
```

这个文件只挂载一级路由。

示例：

```ts
const rpcRoutes = new Hono<HonoEnv>()
  .route('/', systemRoute)
  .route('/rpc/auth', authRoute)
  .route('/rpc/users', userRoute)

export type MomoRpcType = typeof rpcRoutes

export default rpcRoutes
```

这里不写请求处理函数，不直接访问数据库，也不拼响应内容。

### 路由处理函数

Hono route handler 贴着路由写，不单独加 controller 文件。

推荐写法：

```ts
const userRoute = new Hono<HonoEnv>().get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await getUserById(id)

  if (!user) {
    return c.json({ error: 'user not found' }, 404)
  }

  return c.json({ user }, 200)
})
```

不要把 handler 抽成接收 `Context` 的 controller：

```ts
const getUser = async (c: Context) => {
  const id = c.req.param('id')
  return c.json({ id })
}

userRoute.get('/:id', getUser)
```

这种写法会让 Hono 不容易从 `/:id` 里推导参数类型。路由、校验和 handler 放在一起，类型最稳。

如果 handler 变长，先把业务判断放到 service，不新增 controller：

```ts
const userRoute = new Hono<HonoEnv>().get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await userService.getById(id)

  if (!user) {
    return c.json({ error: 'user not found' }, 404)
  }

  return c.json({ user }, 200)
})
```

## 业务模块

业务模块放在：

```text
apps/momo/src/modules/<module>
```

模块按当前需要放文件。小模块不要提前建空的 service、repository 或 types。

### 最小模块

只有接口，没有业务判断和数据库读写时，可以只有 route：

```text
modules/system/
└── system.route.ts
```

需要把业务判断从 route 里拿出来时，再加 service：

```text
modules/system/
├── system.route.ts
└── system.service.ts
```

需要数据库读写时，再加 repository：

```text
modules/<module>/
├── <module>.route.ts
├── <module>.service.ts
└── <module>.repository.ts
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

### 多个 service 和 repository

一个模块里可以有多个 service 或 repository。

适合拆多个 service 的情况：

- 一个模块里有多类业务动作，比如登录、会话、密码重置。
- 某段业务逻辑被多个 route 调用。
- 单个 service 文件已经混了几类不相关的方法。

适合拆多个 repository 的情况：

- 一个模块读写多张表。
- 一个模块同时读数据库和外部服务。
- 某类查询很多，继续放在一个 repository 里会太长。

多个文件时，把 service 和 repository 迁到目录里：

```text
modules/auth/
├── auth.route.ts
├── services/
│   ├── index.ts
│   ├── auth.service.ts
│   ├── session.service.ts
│   └── password-reset.service.ts
├── repositories/
│   ├── index.ts
│   ├── user.repository.ts
│   ├── session.repository.ts
│   └── password-reset.repository.ts
└── auth.types.ts
```

目录里有多个 service 时，加 `services/index.ts`，从这里导出目录下的服务：

```ts
export { authService } from './auth.service'
export { sessionService } from './session.service'
export { passwordResetService } from './password-reset.service'
```

route 从 `./services` 引入服务：

```ts
import { authService, sessionService } from './services'
```

不要在 route 里直接引入 `./services/auth.service` 或 `./services/session.service`。

目录里有多个 repository 时，也加 `repositories/index.ts`：

```ts
export { userRepository } from './user.repository'
export { sessionRepository } from './session.repository'
export { passwordResetRepository } from './password-reset.repository'
```

service 从 `./repositories` 引入 repository：

```ts
import { sessionRepository, userRepository } from './repositories'
```

`index.ts` 只写导出语句，不写业务判断，也不创建数据库连接。

### 从单文件迁到目录

模块刚开始只有一个 service 时，用：

```text
modules/auth/
├── auth.route.ts
└── auth.service.ts
```

后续出现第二个 service 时，迁成：

```text
modules/auth/
├── auth.route.ts
└── services/
    ├── index.ts
    ├── auth.service.ts
    └── session.service.ts
```

原来的 `auth.service.ts` 移到 `services/auth.service.ts`，再从 `services/index.ts` 导出。改完后只更新 import 路径，不顺手改业务逻辑。

repository 同理。

刚开始只有一个 repository 时，用：

```text
modules/auth/
├── auth.route.ts
└── auth.repository.ts
```

后续出现第二个 repository 时，迁成：

```text
modules/auth/
├── auth.route.ts
└── repositories/
    ├── index.ts
    ├── user.repository.ts
    └── session.repository.ts
```

### 引用规则

`route` 可以调用一个或多个 service。

`service` 可以调用一个或多个 repository。

`repository` 不调用 service，不引入 Hono。

`service` 不接收 Hono 的 `Context`，不返回 `c.json()`。

`route` 负责读取 `param`、`query`、`json`，也负责返回 Hono response。

`service` 返回普通数据或抛出 `AppError`。

`repository` 只返回数据库或外部资源的数据。

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

### 数据库

Momo 使用 PostgreSQL 和 Drizzle ORM。

相关文件：

- `apps/momo/compose.yaml`
  本地 PostgreSQL Docker 配置。
- `apps/momo/drizzle.config.ts`
  Drizzle Kit 配置。这里指定 schema 入口和 migration 输出目录。
- `apps/momo/src/infra/db/client.ts`
  创建 PostgreSQL 连接，并导出 `getDb()`。
- `apps/momo/src/infra/db/schema/index.ts`
  Drizzle schema 入口。后续新增表时，从这里导出。
- `apps/momo/src/infra/db/migrations`
  Drizzle 生成的 migration 文件目录。

本地数据库地址：

```text
DATABASE_URL=postgres://momo:momo@localhost:55432/momo
```

常用命令：

```bash
pnpm --filter @xdd-zone/momo db:up
pnpm --filter @xdd-zone/momo db:down
pnpm --filter @xdd-zone/momo db:generate
pnpm --filter @xdd-zone/momo db:migrate
pnpm --filter @xdd-zone/momo db:check
pnpm --filter @xdd-zone/momo db:studio
```

新增表时，先在 `apps/momo/src/infra/db/schema/<module>.schema.ts` 写 schema，再从 `apps/momo/src/infra/db/schema/index.ts` 导出。

改完 schema 后运行：

```bash
pnpm --filter @xdd-zone/momo db:generate
```

检查生成的 SQL 后，再运行：

```bash
pnpm --filter @xdd-zone/momo db:migrate
```

业务代码不要在 route 或 service 里直接创建数据库连接。需要读写数据库时，在模块的 repository 里调用 `getDb()`。

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
  读取和校验 Node 环境变量。当前 Momo 使用 `APP_ENV`、`PORT`、`CORS_ORIGINS` 和 `DATABASE_URL`。新增环境变量时先改这里。
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
        -> modules/*/*.service.ts 或 modules/*/services/*.service.ts
          -> modules/*/*.repository.ts 或 modules/*/repositories/*.repository.ts
            -> infra/*
```

通用代码引用规则：

- `app.ts` 可以引用 `routes`、`middleware`、`shared`。
- `routes/index.ts` 只引用 `modules/*/*.route.ts`。
- `*.route.ts` 可以引用同模块 service、`contracts`、`shared`。如果模块有 `services/index.ts`，route 从 `./services` 引入。
- `*.service.ts` 可以引用同模块 repository、`contracts`、`shared`。
- `*.repository.ts` 可以引用 `infra/db`。
- `services/index.ts` 只导出 `services/*.service.ts`。
- `repositories/index.ts` 只导出 `repositories/*.repository.ts`。
- `services/*.service.ts` 可以引用同模块 repository、`contracts`、`shared`。如果模块有 `repositories/index.ts`，service 从 `./repositories` 引入。
- `repositories/*.repository.ts` 可以引用 `infra/db`。
- `infra` 不引用 `modules`。
- `shared` 不引用 `modules`、`routes` 和 `app.ts`。

## 新增接口

新增接口按这个顺序改：

1. 在 `packages/contracts/src/<module>` 添加请求 schema 和响应类型。
2. 在 `apps/momo/src/modules/<module>/<module>.route.ts` 添加 Hono route。
3. 需要业务判断时，添加或修改 `<module>.service.ts`。如果模块已经有 `services/` 目录，就放到 `services/` 里，并从 `services/index.ts` 导出。
4. 需要数据库读写时，添加或修改 `<module>.repository.ts`。如果模块已经有 `repositories/` 目录，就放到 `repositories/` 里，并从 `repositories/index.ts` 导出。
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
