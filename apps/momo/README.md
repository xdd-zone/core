# @xdd-zone/momo

`@xdd-zone/momo` 是 XDD Zone Core 的 Hono API 服务。

## 当前保留内容

- `src/index.ts`
  直接运行 Momo 时启动 Node 服务。
- `src/app.ts`
  创建运行时 app，导出 `app` 和默认导出，给测试和包导出使用。
- `src/bootstrap`
  创建 runtime，注册全局中间件、错误处理、404 和路由。
- `src/rpc.ts`
  只导出给 Hono RPC client 使用的 `AppType` 类型。
- `src/routes/index.ts`
  挂载一级路由。
- `src/modules`
  放接口模块。系统接口在 `src/modules/system`，认证接口在 `src/modules/auth`。
- `src/middleware`
  放 request context、安全响应头、请求日志、CORS、请求耗时、请求体大小和超时 middleware。
- `src/infra`
  放 Pino logger、PostgreSQL 连接、Drizzle schema 入口、migration 目录、缓存驱动和文件存储驱动。
- `src/shared`
  放 Momo 内部共用的错误类型、环境变量读取、Hono 类型和响应 meta 生成函数。
- `/`
  返回服务名称和状态，使用统一响应格式。
- `/health`
  返回健康检查状态，使用统一响应格式。
- `/rpc/system/ping`
  接收 `{ "name": "fifa" }`，返回 `pong, fifa`。
- `/api/auth/*`
  交给 `better-auth` 处理登录、登出、OAuth callback 和 session cookie。
- `/rpc/fifa/auth/me`
  读取当前 session，检查当前用户能不能进入 `fifa`。
- `/rpc/bobo/auth/me`
  读取当前 session。未登录时返回 `user: null`，已登录时补上 `bobo.visitor` 角色。

当前有内存缓存和 Redis 协议缓存，代码放在 `src/infra/cache`。Redis 协议缓存本地用 Valkey。当前有本地文件存储和腾讯云 COS 驱动，代码放在 `src/infra/storage`。当前还没有媒体上传接口和其他业务模块。日志封装放在 `src/infra/logger.ts`，认证表、访问表和 Better Auth rate limit 表已经放在 `src/infra/db/schema`，migration 放在 `src/infra/db/migrations`。

## 常用命令

```bash
cd apps/momo

pnpm dev
pnpm build
pnpm type-check
pnpm test
pnpm db:up
pnpm db:down
pnpm db:generate
pnpm db:migrate
pnpm db:check
pnpm db:studio
pnpm auth:generate
pnpm seed:owner
pnpm storage:test
```

`pnpm test` 会连接 `postgres://momo:momo@localhost:55432/momo_test`。第一次跑认证接口测试前，先运行 `pnpm db:up`。测试会自动创建 `momo_test`，并只清理这个测试库里的表。

## 环境变量

- `apps/momo/.env.example`
  记录 Momo 需要的变量名和示例值。
- `apps/momo/.env.development`
  本机开发使用。这个文件被 `.gitignore` 忽略，不提交到仓库。

日志级别用 `LOG_LEVEL` 控制，开发环境默认 `info`。请求里带了合法的 `X-Request-Id` 时，Momo 会使用这个值；没有传或格式不合法时，Momo 会生成新的 UUID。响应头会写回最终使用的 `X-Request-Id`，跨域请求可以发送和读取这个 header。跨域认证请求会返回 `Access-Control-Allow-Credentials: true`，浏览器可以带 session cookie 调用 Momo。2xx 和 3xx 响应耗时达到 1000ms 时会用 warn 记录。开发环境会写 `Server-Timing`，生产和测试环境不会写。开发环境的未处理异常会记录 stack，生产和测试环境不会记录 stack。需要看 SQL 时，把 `LOG_SQL` 设成 `true`，日志只会打印 SQL 和参数数量，不打印参数原值。

Momo 会给所有响应写常用安全响应头。`APP_ENV=production` 时会写 `Strict-Transport-Security`，开发和测试环境不会写。

`/rpc/*` 的非 GET 请求体最大 `1 MiB`，超过后返回 `413 COMMON.PAYLOAD_TOO_LARGE`。`/api/auth/*` 的非 GET 请求体最大 `64 KiB`。`/rpc/*` 请求超时是 `5s`，`/api/auth/*` 请求超时是 `10s`，超时后返回 `504 SYSTEM.UPSTREAM_TIMEOUT`。

Better Auth rate limit 在测试环境关闭，开发和生产环境开启。`/api/auth/sign-in/email` 在 `60s` 内最多 `5` 次，`/api/auth/sign-up/email` 在 `60s` 内最多 `3` 次，计数写入数据库表 `rate_limit`。

缓存用 `CACHE_PROVIDER` 控制。默认值是 `memory`，数据只存在当前 Node.js 进程里。设成 `redis` 时，需要配置 `CACHE_URL`，本地 Valkey 地址是 `redis://localhost:56379`。`CACHE_KEY_PREFIX` 默认是 `momo`，`CACHE_DEFAULT_TTL_SECONDS` 默认是 `300` 秒。缓存代码放在 `src/infra/cache`，`createRuntime()` 会创建 `runtime.cache`。

文件存储用 `STORAGE_PROVIDER` 控制。默认值是 `local`，文件写到 `LOCAL_STORAGE_DIR`，未设置时使用 `storage/media`。设成 `cos` 时，需要配置 `COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET` 和 `COS_REGION`。`save()` 只保存图片，允许 `image/avif`、`image/gif`、`image/jpeg`、`image/png` 和 `image/webp`，单个文件最大 `10 MiB`。本地 `openFile()` 返回文件内容，COS `openFile()` 返回 `302` 跳转。`stat()` 可以读取文件大小、MIME 和修改时间。验证当前存储配置时，运行 `pnpm storage:test`。

## 运行方式

开发模式：

```bash
cd apps/momo
pnpm dev
```

指定端口：

```bash
PORT=7788 pnpm dev
```

创建 owner 账号：

```bash
cd apps/momo
pnpm db:up
pnpm db:migrate
pnpm seed:owner
```

直接请求 app 时，可以在测试里用 `app.request()`：

```ts
import { app } from './src/app'

const response = await app.request('/health')
```
