# Momo 后端指南

这份文档说明 `apps/momo` 现在怎么组织。

## 代码组织约定

`@xdd-zone/momo` 是 Hono API 服务，运行在 Node.js 上。

代码按这些约定维护：

- `src/index.ts` 只启动 Node 服务。
- `src/app.ts` 创建运行时 app，给测试和包导出使用。
- `src/bootstrap` 放启动组装函数。
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
├── bootstrap/
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
- `bootstrap`
  创建 runtime，组装 Hono app，注册全局中间件、错误处理和路由。
- `modules`
  业务模块。当前有 `system`、`auth` 和 `content`。文件较少的模块可以先平铺；文件变多后，把 service、repository 和内部类型分别放到 `services`、`repositories` 和 `types` 目录。
- `middleware`
  request context、请求日志、CORS 这类通用 middleware。
- `infra`
  数据库、文件存储和第三方 SDK 的连接代码。
- `shared`
  错误类型、环境变量读取、Hono 类型、响应 meta 和校验辅助函数。
- `test`
  用 `app.request()` 写接口测试。

## 当前目录

```text
apps/momo/src/
├── index.ts
├── app.ts
├── bootstrap/
│   ├── index.ts
│   ├── create-app.ts
│   └── create-runtime.ts
├── routes/
│   └── index.ts
├── modules/
│   ├── system/
│   │   ├── system.route.ts
│   │   └── system.service.ts
│   ├── auth/
│   │   ├── access.repository.ts
│   │   ├── auth.config.ts
│   │   ├── auth.generate.ts
│   │   ├── auth.route.ts
│   │   ├── auth.types.ts
│   │   ├── index.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── index.ts
│   │   │   └── permission.guard.ts
│   │   └── services/
│   │       ├── access.service.ts
│   │       ├── auth.service.ts
│   │       └── index.ts
│   ├── content/
│   │   ├── content.route.ts
│   │   ├── content.presenter.ts
│   │   ├── index.ts
│   │   ├── mdx-components.ts
│   │   ├── public-content.presenter.ts
│   │   ├── public-content.route.ts
│   │   ├── repositories/
│   │   │   ├── content.repository.ts
│   │   │   └── taxonomy.repository.ts
│   │   ├── services/
│   │   │   ├── content.service.ts
│   │   │   ├── public-content.service.ts
│   │   │   └── taxonomy.service.ts
│   │   └── types/
│   │       ├── content.types.ts
│   │       └── taxonomy.types.ts
├── middleware/
│   ├── index.ts
│   ├── body-limit.middleware.ts
│   ├── cors.middleware.ts
│   ├── request-context.middleware.ts
│   ├── request-log.middleware.ts
│   ├── secure-headers.middleware.ts
│   ├── timeout.middleware.ts
│   └── timing.middleware.ts
├── infra/
│   ├── logger.ts
│   ├── cache.ts
│   ├── search.ts
│   ├── cache/
│   │   ├── index.ts
│   │   ├── cache.types.ts
│   │   ├── memory-cache.ts
│   │   └── redis-cache.ts
│   ├── search/
│   │   ├── index.ts
│   │   ├── search.types.ts
│   │   ├── disabled-search.ts
│   │   └── meilisearch-search.ts
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema/
│   │   │   ├── index.ts
│   │   │   ├── access.schema.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── content.schema.ts
│   │   └── migrations/
│   └── storage/
│       ├── index.ts
│       ├── storage.types.ts
│       ├── media-file.ts
│       ├── local-storage.ts
│       └── cos-storage.ts
├── scripts/
│   ├── seed-owner.ts
│   └── test-storage.ts
├── shared/
│   ├── app-error.ts
│   ├── env.ts
│   ├── hono-env.ts
│   ├── meta.ts
│   ├── response.ts
│   └── validator.ts
└── test/
    ├── bootstrap/
    ├── infra/
    ├── middleware/
    ├── modules/
    └── shared/
```

## 入口和 app

`src/index.ts` 只负责启动服务。

这里调用 `createRuntime()`，再调用 `createMomoApp(runtime)`，最后用 `@hono/node-server` 的 `serve()` 监听端口。

不要在这里写：

- 路由。
- 中间件。
- 业务判断。
- 数据库代码。

`src/app.ts` 给测试和包导出使用。

这里做这些事：

- 调用 `createRuntime()`。
- 调用 `createMomoApp(runtime)`。
- 导出 `app` 和默认导出。

不要把新的组装逻辑写回 `src/app.ts`。需要改 app 组装时，改 `src/bootstrap/create-app.ts`。

`AppType` 从 `src/rpc.ts` 导出。Fifa 后续可以用它拿到 Momo 的路由类型。

## 环境变量

环境变量读取代码放在：

```text
apps/momo/src/shared/env.ts
```

示例文件：

- `apps/momo/.env.example`
  提交到仓库，记录变量名和示例值。
- `apps/momo/.env.development`
  本机开发使用。这个文件被 `.gitignore` 忽略，不提交到仓库。
- `apps/momo/.env.test`
  测试使用。这个文件只放固定测试假值，提交到仓库。

当前 Momo 使用这些变量：

```text
APP_ENV
PORT
LOG_LEVEL
LOG_SQL
CORS_ORIGINS
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CACHE_PROVIDER
CACHE_URL
CACHE_KEY_PREFIX
CACHE_DEFAULT_TTL_SECONDS
SEARCH_PROVIDER
MEILI_HOST
MEILI_API_KEY
MEILI_INDEX_PREFIX
STORAGE_PROVIDER
LOCAL_STORAGE_DIR
COS_SECRET_ID
COS_SECRET_KEY
COS_BUCKET
COS_REGION
COS_PUBLIC_BASE_URL
COS_KEY_PREFIX
COS_SIGNED_URL_EXPIRES
```

`seed:owner` 还会读取：

```text
OWNER_EMAIL
OWNER_PASSWORD
OWNER_DISPLAY_NAME
```

执行 `seed:owner` 时，脚本会同时写入默认应用、登录方式、角色、owner 账号、内容分类、内容标签和第一篇已发布文章。分类、标签和文章按 slug 复用已有记录，重复执行不会重复插入。

`pnpm dev`、`pnpm auth:generate`、`pnpm seed:owner`、`pnpm storage:test` 和 `pnpm db:*` 会读取 `apps/momo/.env.development`。`pnpm test` 会读取 `apps/momo/.env.test`。

`LOG_LEVEL` 控制 Pino 日志级别。未配置时，开发和生产使用 `info`，测试使用 `silent`。

`LOG_SQL` 只在开发环境生效。设成 `true` 时会打印 SQL 和 `paramsCount`，不会打印参数原值。

`BETTER_AUTH_URL` 填 Momo 的对外地址，Momo 会按这个地址拼 `/api/auth`。本地开发通常填 `http://localhost:7788`。code-server Web IDE 里使用个人 dev 域名时，配置入口看 [code-server 内开发](../development/code-server.md)。`CORS_ORIGINS` 需要包含实际访问 Fifa 和 Bobo 的地址。

`CACHE_PROVIDER` 控制缓存驱动。默认值是 `memory`，数据只存在当前 Node.js 进程里。设成 `redis` 时，需要配置 `CACHE_URL`，本地 Valkey 地址是 `redis://localhost:56379`。`CACHE_KEY_PREFIX` 默认是 `momo`，`CACHE_DEFAULT_TTL_SECONDS` 默认是 `300` 秒。

`SEARCH_PROVIDER` 控制搜索驱动。默认值是 `none`，不会连接外部搜索服务。设成 `meilisearch` 时，需要配置 `MEILI_HOST` 和 `MEILI_API_KEY`，本地 Meilisearch 地址是 `http://localhost:57700`。`MEILI_INDEX_PREFIX` 默认是 `momo`，驱动会把逻辑索引名 `posts` 拼成真实索引名 `momo_posts`。当前还没有业务模块调用搜索驱动。

`STORAGE_PROVIDER` 控制文件存储驱动。默认值是 `local`，使用 `LOCAL_STORAGE_DIR`，未设置时写到 `storage/media`。设成 `cos` 时，`COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET` 和 `COS_REGION` 必须配置。`COS_KEY_PREFIX` 默认是 `media`，`COS_SIGNED_URL_EXPIRES` 默认是 `600` 秒。

文件存储驱动只保存图片。`save()` 允许 `image/avif`、`image/gif`、`image/jpeg`、`image/png` 和 `image/webp`，单个文件最大 `10 MiB`。`openFile()` 在本地存储时返回 `200` 和文件内容，在 COS 存储时返回 `302` 跳转地址。`stat()` 可以读取文件大小、MIME 和修改时间。

请求里带了合法的 `X-Request-Id` 时，Momo 会使用这个值；没有传或格式不合法时，Momo 会生成新的 UUID。响应头会写回最终使用的 `X-Request-Id`。

## 启动组装

启动组装代码放在：

```text
apps/momo/src/bootstrap
```

当前文件：

- `create-runtime.ts`
  读取 `shared/env.ts`，创建 logger、cache、search 和 storage，返回 `MomoRuntime`。
- `create-app.ts`
  创建 `new Hono<HonoEnv>()`，注册全局中间件、错误处理、404 和一级路由。
- `index.ts`
  统一导出 `createRuntime()`、`createMomoApp()` 和 `MomoRuntime`。

`MomoRuntime` 当前有 `env`、`logger`、`cache`、`search` 和 `storage`。后续如果加数据库或其他外部资源，也从 `create-runtime.ts` 创建，再通过 `runtime` 传给 route、service 或 repository。

不要把 env、db、cache 写进 `c.var`。`c.var` 只放当前请求的数据。

`create-app.ts` 里的注册顺序按当前代码维护：

```text
registerRequestContext(app)
registerSecureHeaders(app, runtime.env)
registerRequestLog(app, httpLogger)
registerCors(app, runtime.env)
registerBodyLimit(app)
registerTiming(app, runtime.env)
registerTimeout(app)
app.onError(...)
app.notFound(...)
app.route('/', createRoutes(runtime))
```

改全局 middleware 顺序时，先确认它是否依赖 `c.var.requestId` 或 `c.var.startedAt`。当前 `requestLog` 放在 `cors`、`bodyLimit`、`timing` 和 `timeout` 前面，所以这些 middleware 直接返回响应时也会记录日志。

`app.onError()` 统一处理：

- `AppError`
- Hono 的 `HTTPException`。其中 `504` 会返回 `SYSTEM.UPSTREAM_TIMEOUT`
- 未识别错误

错误响应里的 meta 使用 `c.var.requestId`。

`app.notFound()` 只在顶层 app 注册。不要在子路由里重复注册 404。

## 路由

路由入口文件：

```text
apps/momo/src/routes/index.ts
```

这个文件只挂载一级路由。

示例：

```ts
export function createRoutes(runtime: MomoRuntime) {
  return new Hono<HonoEnv>()
    .route('/', createAuthRoute(runtime))
    .route('/', createSystemRoute(runtime))
}

export type MomoRpcType = ReturnType<typeof createRoutes>

export default createRoutes
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

repository 返回普通数据，错误处理交给 service 或 `create-app.ts` 的 `onError()`。

`<module>.types.ts` 只放 Momo 内部使用的模块类型。

前后端共用的请求 schema、请求类型、响应类型和响应结构放在 `packages/contracts`。

### 模块写法

后端模块按这个顺序写：

```text
contracts -> route -> types -> service -> repository -> schema
```

每一层只管自己的事：

- `packages/contracts/src/<module>` 写请求 schema、响应 schema、请求类型和响应类型。
- `<module>.route.ts` 写 Hono 路由、权限中间件、`zValidator`、调用 service 和 `createSuccessResponse(...)`。
- `<module>.types.ts` 写模块内部类型，比如数据库记录类型、repository 输入类型和局部结果类型。
- `<module>.service.ts` 写业务判断，调用 repository，返回普通对象或抛出 `AppError`。
- `<module>.repository.ts` 写数据库读写，返回数据库记录或明确的结果类型。
- `apps/momo/src/infra/db/schema/<module>.schema.ts` 写表结构、枚举、索引和数据库约束。

类型按这个方向走：

```text
contract request
  -> route
  -> service input
  -> repository input
  -> Drizzle schema / database
  -> repository record
  -> service resource
  -> presenter
  -> contract response
  -> route response data
```

有响应 DTO 的模块要单独放 `<module>.presenter.ts`。presenter 只做一件事：把 repository record 或 service resource 转成 `packages/contracts` 里的响应类型。

类型写法按这些规则处理：

- 数据库 record 类型从 Drizzle schema 推导，比如 `InferSelectModel<typeof contentPosts>`。
- repository 返回 record 或明确的结果联合类型，不返回 API response DTO。
- service 入参使用 contract 请求类型或模块内部 input 类型，不写匿名长对象。
- service 返回资源对象，比如 `PostDetail`、`PostSummary[]`，不负责包 `{ post }`、`{ posts }`。
- route 负责把 service 返回值包成接口 data，比如 `{ post }`、`{ posts }`，再传给 `createSuccessResponse(...)`。
- presenter 入参类型用 `Pick<ContentPostRecord, ...>` 这类类型从 repository record 派生。
- presenter 返回对象先赋给局部变量，用 `satisfies` 检查 contract 类型，再调用 contract schema 的 `parse()`。
- `status` 这类枚举值从 contract 常量传到 Drizzle `pgEnum`，再由 Drizzle record 类型往上返回。
- PATCH 接口里，`undefined` 表示不改字段，`null` 表示清空可空字段。repository 更新可空字段时用 `input.field === undefined ? current.field : input.field`。

不要写这些代码：

- 不要用 `as PostSummary`、`as PostDetail` 这类整体强转把对象当成响应类型。
- 不要用 `as 'draft' | 'published' | 'archived'` 修数据库字段类型。
- 不要把数据库字段先写成宽松的 `string`，再在 repository 或 service 里手动当枚举用。
- 不要在 route 里直接拼复杂响应 DTO。
- 不要在 service 里返回 `c.json()`，也不要接收 Hono `Context`。
- 不要让 repository 引入 route、service、presenter 或 contract 响应 DTO。
- 不要在 repository 里吞掉数据库错误后返回假数据。能转成业务错误的情况返回明确结果或抛出模块错误，其他错误交给全局错误处理。

### auth 模块

认证模块放在：

```text
apps/momo/src/modules/auth
```

当前文件：

- `auth.route.ts`
  挂载 `/api/auth/*`、`/rpc/fifa/auth/me` 和 `/rpc/bobo/auth/me`。
- `auth.config.ts`
  初始化 `better-auth`，配置邮箱密码、GitHub、Google、session cookie 和 Drizzle adapter。
- `auth.generate.ts`
  给 `pnpm --filter @xdd-zone/momo auth:generate` 使用。这里创建 Better Auth 实例，让 CLI 能生成 `auth.schema.ts`。
- `services/auth.service.ts`
  调用 `better-auth` handler，读取当前 session，并从 `user` 表整理当前用户返回值。
- `services/access.service.ts`
  判断当前用户能不能进入 `fifa`，以及给已登录的 `bobo` 用户补 `bobo.visitor`。
- `guards/auth.guard.ts`
  提供 `createRequireAuth()` 和 `createRequireFifaOwner()`，给业务路由检查登录状态和 `fifa.owner`。
- `guards/permission.guard.ts`
  提供 `createRequirePermission()`。当前 `content.*` 权限先要求 `fifa.owner`。
- `access.repository.ts`
  读取 `account`、`applications`、`application_auth_methods`、`roles` 和 `user_role_bindings`。
- `auth.types.ts`
  放认证模块内部使用的应用、登录方式、角色、权限码和用户返回类型。
- `index.ts`
  导出 `createAuthRoute()` 和业务模块可用的 auth guard。
- `services/index.ts`
  只导出认证模块里的 service 函数。

当前接口：

- `GET` 或 `POST /api/auth/*`
  交给 `better-auth` 处理登录、登出、OAuth callback 和 session cookie。
- `POST /api/auth/sign-up/email`
  返回 `403 AUTH.METHOD_NOT_ALLOWED`。owner 账号只通过 `pnpm --filter @xdd-zone/momo seed:owner` 创建。
- `GET /rpc/fifa/auth/me`
  要求当前请求已登录、用户状态是 `active`、用户有 password 登录记录，并且绑定了 `fifa.owner`。
- `GET /rpc/bobo/auth/me`
  未登录时返回 `user: null`。已登录时要求用户状态是 `active`，并补上 `bobo.visitor`。

当前认证表放在：

```text
apps/momo/src/infra/db/schema/auth.schema.ts
apps/momo/src/infra/db/schema/access.schema.ts
```

`auth.schema.ts` 由 `better-auth generate` 生成，当前包含 `user`、`session`、`account`、`verification` 和 `rateLimit`。`rateLimit` 对应数据库表 `rate_limit`，用于 Better Auth 的 database rate limit。
`access.schema.ts` 是 Momo 自己维护的访问表，当前包含 `applications`、`application_auth_methods`、`roles` 和 `user_role_bindings`。

Better Auth rate limit 当前配置：

- 测试环境关闭。
- 开发和生产环境开启。
- 使用 database storage。
- `/api/auth/sign-in/email` 在 `60s` 内最多请求 `5` 次。
- `/api/auth/sign-up/email` 在 `60s` 内最多请求 `3` 次。
- 其他 `/api/auth/*` 走 Better Auth 默认限制。

owner 初始化脚本放在：

```text
apps/momo/src/scripts/seed-owner.ts
```

这个脚本会确保 `fifa`、`bobo`、三种登录方式、`fifa.owner` 和 `bobo.visitor` 存在，然后创建或更新 owner 用户，并给 owner 绑定 `fifa.owner` 和 `bobo.visitor`。

### content 模块

内容模块放在：

```text
apps/momo/src/modules/content
```

当前文件：

- `content.route.ts`
  挂载后台文章接口、预览 token 接口、素材接口、分类接口和标签接口。这里只处理权限、请求校验、调用 service 和响应包装。
- `public-content.route.ts`
  挂载个人站公开文章、分类和标签接口。不检查登录态，只返回公开数据。
- `types/content.types.ts`
  放内容模块内部类型。数据库记录类型从 Drizzle schema 推导，repository 的输入和结果类型也放这里。
- `types/taxonomy.types.ts`
  放分类和标签 repository 的输入类型。
- `services/content.service.ts`
  处理创建文章、保存草稿、发布、生成预览 token、预览文章和上传图片。这里负责业务判断，返回 `PostDetail`、`PostSummary[]`、`ImageAsset` 这类资源对象。
- `services/public-content.service.ts`
  读取个人站公开文章、公开分类和公开标签。
- `services/taxonomy.service.ts`
  处理后台分类和标签的创建、读取、更新和删除。
- `repositories/content.repository.ts`
  读写 `content_posts`、`content_post_revisions`、`content_preview_tokens` 和 `content_assets`。这里只返回数据库 record 或明确的结果联合类型。
- `repositories/taxonomy.repository.ts`
  读写 `content_categories`、`content_tags`、`content_post_categories` 和 `content_post_tags`。
- `content.presenter.ts`
  把内容模块的数据库记录转成 `@xdd-zone/contracts` 的响应类型。日期转 ISO 字符串、响应 schema `parse()` 都在这里做。
- `public-content.presenter.ts`
  把公开文章、公开分类和公开标签转成个人站响应类型。
- `mdx-components.ts`
  放第一版允许插入的 MDX 组件清单，并检查源码里的组件名。

文章正文统一保存为 MDX 源码。普通 Markdown 语法可以直接写在源码里，不再单独保存正文格式字段。

接口 schema 和响应类型放在：

```text
packages/contracts/src/content/content.contract.ts
```

这里导出 `POST_STATUS_VALUES`、请求 schema、响应 schema 和对应 TypeScript 类型。Momo route 用这里的请求 schema 校验入参，presenter 用这里的响应 schema 校验出参。

后台接口使用 `createRequirePermission()`。当前 `content.*` 权限都要求当前用户是 `fifa.owner`。素材管理新增 `content.asset.read`、`content.asset.edit` 和 `content.asset.delete`。

个人站公开接口不检查登录态，只返回已发布文章。预览接口只检查 token，不检查 Fifa 登录态。`GET /rpc/content/assets/:id/file` 也不检查后台登录态，给文章正文和本地预览读取素材文件用。

当前接口：

- `GET /rpc/content/posts`
- `POST /rpc/content/posts`
- `GET /rpc/content/posts/:id`
- `PATCH /rpc/content/posts/:id/draft`
- `POST /rpc/content/posts/:id/preview-token`
- `POST /rpc/content/posts/:id/publish`
- `GET /rpc/content/assets`
- `GET /rpc/content/assets/:id`
- `GET /rpc/content/assets/:id/file`
- `PATCH /rpc/content/assets/:id`
- `DELETE /rpc/content/assets/:id`
- `GET /rpc/content/mdx-components`
- `POST /rpc/content/assets/images`
- `GET /rpc/content/previews/:token`
- `GET /rpc/bobo/content/posts`
- `GET /rpc/bobo/content/posts/:slug`
- `GET /rpc/bobo/content/categories`
- `GET /rpc/bobo/content/tags`

内容表放在：

```text
apps/momo/src/infra/db/schema/content.schema.ts
```

`content.schema.ts` 从 `@xdd-zone/contracts` 读取 `POST_STATUS_VALUES`，再用 Drizzle `pgEnum` 创建 `content_post_status`。不要把 `status` 写成普通 `text()`。

当前包含：

- `content_posts`
  文章主记录，保存 slug、标题、状态、当前草稿版本和当前发布版本。
- `content_post_revisions`
  保存 MDX 源码快照。
- `content_preview_tokens`
  保存预览 token 的 SHA-256 hash、文章 id、版本 id 和过期时间。
- `content_assets`
  保存图片素材的存储路径、文件名、MIME、大小、说明和时间戳。

content 模块的数据按这个顺序走：

```text
content.contract.ts
  -> content.route.ts
  -> content.service.ts
  -> content.repository.ts
  -> content.schema.ts
  -> content.repository.ts
  -> content.service.ts
  -> content.presenter.ts
  -> content.route.ts
```

个人站公开内容从 `public-content.route.ts` 进入，调用 `public-content.service.ts` 和 `public-content.presenter.ts`。公开响应类型用 `PublicPostSummary`、`PublicPostDetail`、`PublicCategoryListItem` 和 `PublicTag`，不要把后台 revision 字段返回给个人站。`GET /rpc/bobo/content/categories` 返回全部分类，并带上按已发布文章统计的 `postCount`。

关键规则：

- route 用 `CreatePostRequestSchema`、`SavePostDraftRequestSchema` 校验请求体。
- service 只接收 contract 请求类型、用户 id、文章 id、token 这类明确参数。
- service 需要文章版本时，如果指针存在但版本记录查不到，按数据错误抛 `SYSTEM.INTERNAL_ERROR`。
- repository 的 `ContentPostRecord`、`ContentRevisionRecord` 从 Drizzle schema 推导，不手写 `status` 的窄类型。
- repository 保存草稿时，`excerpt: null` 和 `coverAssetId: null` 必须能清空字段。
- presenter 统一处理 `Date#toISOString()`。content service 不直接把日期拼进 API 响应。
- route 只包响应 data。列表接口包 `{ posts }`，详情接口包 `{ post }`，上传接口包 `{ asset }`。

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

`system` 模块不直接访问数据库。需要读取运行环境时，由 route 从 `runtime.env` 传给 service，不在 service 里直接调用 `getMomoEnv()`。

## 中间件

通用中间件放在：

```text
apps/momo/src/middleware
```

适合放这里的代码：

- request id 生成和写入。
- 请求开始时间写入。
- 请求日志。
- CORS。
- 安全响应头。
- 请求体大小限制。
- 请求超时。
- 开发环境的 `Server-Timing` 响应头。

只被一个 route 使用一次的中间件，可以先放在对应的 `<module>.route.ts`。

当前文件：

- `request-context.middleware.ts`
  导出 `requestContextMiddleware` 和 `registerRequestContext()`。这里读取 `X-Request-Id`，写入 `c.var.requestId` 和 `c.var.startedAt`，并把最终使用的 requestId 写到响应头。
- `request-log.middleware.ts`
  导出 `createRequestLogMiddleware()` 和 `registerRequestLog()`。这里在 `await next()` 之后通过 `runtime.logger` 记录请求方法、路径、响应状态、耗时和 requestId。2xx 和 3xx 响应耗时达到 1000ms 时用 warn 记录。测试环境使用 silent logger，不打印日志。
- `cors.middleware.ts`
  导出 `registerCors()`。这里读取 `runtime.env.CORS_ORIGINS`。跨域请求允许 `content-type` 和 `x-request-id` 请求头，并暴露 `x-request-id` 响应头。跨域认证请求会返回 `Access-Control-Allow-Credentials: true`。
- `secure-headers.middleware.ts`
  导出 `registerSecureHeaders()`。这里注册 `hono/secure-headers`。生产环境会写 `Strict-Transport-Security`，开发和测试环境不写。
- `body-limit.middleware.ts`
  导出 `registerBodyLimit()`。这里限制 `/rpc/*` 的非 GET 请求最大 `1 MiB`，限制 `/api/auth/*` 的非 GET 请求最大 `64 KiB`。超过限制时返回 `413 COMMON.PAYLOAD_TOO_LARGE`。
- `timeout.middleware.ts`
  导出 `registerTimeout()`。这里限制 `/rpc/*` 最长 `5s`，限制 `/api/auth/*` 最长 `10s`。超时时返回 `504 SYSTEM.UPSTREAM_TIMEOUT`。
- `timing.middleware.ts`
  导出 `registerTiming()`。这里只在开发环境写 `Server-Timing` 响应头。
- `index.ts`
  只做统一导出，不写注册逻辑。

新增全局 middleware 时按这个方式写：

1. 在 `apps/momo/src/middleware/<name>.middleware.ts` 写 middleware。
2. 如果需要全局注册，在同一个文件里导出 `register<Name>()`。
3. 从 `apps/momo/src/middleware/index.ts` 导出。
4. 在 `apps/momo/src/bootstrap/create-app.ts` 里调用注册函数。

不要把注册函数写在 `middleware/index.ts`。这个文件只放导出语句。

middleware 需要给后面的 handler 放请求状态时，写到 `c.set()`，并在 `shared/hono-env.ts` 里补 `Variables` 类型。当前已有：

```ts
Variables: {
  requestId: string
  startedAt: number
  user?: {
    id: string
    role: string
  }
}
```

只有当前请求里的临时状态放 `c.var`。进程级数据继续放 `runtime`。

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

日志封装放在：

```text
apps/momo/src/infra/logger.ts
```

这里创建 Pino logger。`createRuntime()` 调用它，把 logger 放进 `runtime`，请求日志和未处理异常日志都从 `runtime.logger` 写出。开发环境默认使用 `info`，未处理异常会记录 stack。生产和测试环境不记录 stack。需要 SQL 日志时把 `LOG_SQL` 设成 `true`，日志只打印 SQL 和参数数量，不打印参数原值。Better Auth 的日志也走这里，错误只记录名称、消息和 code，不打印 stack 和请求参数。

业务模块不能在 route 里直接创建数据库连接。需要读写数据库时，先写 repository，再由 service 调用 repository。

### 数据库

Momo 使用 PostgreSQL 和 Drizzle ORM。

相关文件：

- `apps/momo/compose.yaml`
  本地 PostgreSQL、Valkey 和 Meilisearch Docker 配置。
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

本地 Valkey 地址：

```text
CACHE_PROVIDER=redis
CACHE_URL=redis://localhost:56379
```

本地 Meilisearch 地址：

```text
SEARCH_PROVIDER=meilisearch
MEILI_HOST=http://localhost:57700
MEILI_API_KEY=momo-meilisearch-development-master-key
```

常用命令：

```bash
pnpm --filter @xdd-zone/momo local:up
pnpm --filter @xdd-zone/momo local:down
pnpm --filter @xdd-zone/momo db:generate
pnpm --filter @xdd-zone/momo db:migrate
pnpm --filter @xdd-zone/momo db:check
pnpm --filter @xdd-zone/momo db:studio
```

新增表时，先在 `apps/momo/src/infra/db/schema/<module>.schema.ts` 写 schema，再从 `apps/momo/src/infra/db/schema/index.ts` 导出。

非生成的 Drizzle schema 字段都要补 TS 简易注释。注释只写字段存什么、什么时候使用。`auth.schema.ts` 这类生成文件不手动补注释。

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

当前有内存缓存和 Redis 协议缓存。Redis 协议缓存使用 `redis` 包连接 Valkey。调用方只传业务键，驱动会加上 `CACHE_KEY_PREFIX`。

搜索相关代码放在：

```text
apps/momo/src/infra/search
```

当前有禁用搜索驱动和 Meilisearch 搜索驱动。`SEARCH_PROVIDER=none` 时使用禁用搜索驱动，数据方法会抛出“搜索服务未启用”。`SEARCH_PROVIDER=meilisearch` 时使用 Meilisearch 搜索驱动。调用方只传逻辑索引名，驱动会加上 `MEILI_INDEX_PREFIX`。当前还没有搜索接口，也没有业务索引。

文件存储相关代码放在：

```text
apps/momo/src/infra/storage
```

本地存储和 COS 存储都在这里。存储路径会拒绝空路径、绝对路径、反斜杠和 `..` 路径段。图片上传接口在 `apps/momo/src/modules/content/content.route.ts`。

## 共用代码

Momo 内部共用代码放在：

```text
apps/momo/src/shared
```

常用文件：

- `app-error.ts`
  放 `AppError` 和错误状态类型。service 可以抛出 `AppError`，`create-app.ts` 的 `onError()` 负责把它转成统一失败响应。
- `env.ts`
  读取和校验 Node 环境变量。新增 Momo 运行时变量时先改这里，再补 `apps/momo/.env.example`。
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
  "#momo/bootstrap": "./src/bootstrap/index.ts",
  "#momo/middleware": "./src/middleware/index.ts",
  "#momo/routes": "./src/routes/index.ts",
  "#momo/*": "./src/*.ts"
}
```

跨目录引用使用 `#momo/*`：

```ts
import { createMomoApp } from '#momo/bootstrap'
import { getMomoEnv } from '#momo/shared/env'
import { createSystemRoute } from '#momo/modules/system/system.route'
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
  -> bootstrap/create-runtime.ts
  -> bootstrap/create-app.ts
    -> middleware/*
    -> routes/index.ts
      -> modules/*/*.route.ts
        -> modules/*/*.service.ts 或 modules/*/services/*.service.ts
          -> modules/*/*.repository.ts 或 modules/*/repositories/*.repository.ts
            -> infra/*

app.ts
  -> bootstrap/create-runtime.ts
  -> bootstrap/create-app.ts
```

通用代码引用规则：

- `index.ts` 只引用 `bootstrap` 和 `@hono/node-server`。
- `app.ts` 只引用 `bootstrap`，用于导出测试和包使用的 app。
- `bootstrap/create-app.ts` 可以引用 `routes`、`middleware`、`shared`。
- `bootstrap/create-runtime.ts` 可以引用 `shared/env.ts` 和 `infra` 里的进程级资源。
- `middleware/index.ts` 只导出 middleware 文件。
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
apps/momo/src/test/modules/system/system.route.test.ts
apps/momo/src/test/modules/auth/auth.route.test.ts
apps/momo/src/test/modules/auth/auth.guard.test.ts
apps/momo/src/test/modules/content/content.route.test.ts
```

接口测试继续使用 `app.request()`。

示例：

```ts
const response = await app.request('/health')
expect(response.status).toBe(200)
```

这样测试不需要启动真实端口。

认证接口测试使用独立数据库：

```text
postgres://momo:momo@localhost:55432/momo_test
```

先运行 `pnpm --filter @xdd-zone/momo local:up`。测试会自动创建 `momo_test`，执行当前 migration，并清理这个测试库里的表。

## 运行和检查

```bash
pnpm dev:momo
pnpm build:momo
pnpm type-check
cd apps/momo && pnpm test
```
