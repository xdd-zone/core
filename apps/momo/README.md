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
  放 request context、请求日志和 CORS middleware。
- `src/infra`
  放 Pino logger、PostgreSQL 连接、Drizzle schema 入口和 migration 目录。
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

当前没有文件存储和其他业务模块。日志封装放在 `src/infra/logger.ts`，认证表和访问表已经放在 `src/infra/db/schema`，migration 放在 `src/infra/db/migrations`。

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
```

## 环境变量

- `apps/momo/.env.example`
  记录 Momo 需要的变量名和示例值。
- `apps/momo/.env.development`
  本机开发使用。这个文件被 `.gitignore` 忽略，不提交到仓库。

日志级别用 `LOG_LEVEL` 控制，开发环境默认 `info`。请求里带了合法的 `X-Request-Id` 时，Momo 会使用这个值；没有传或格式不合法时，Momo 会生成新的 UUID。响应头会写回最终使用的 `X-Request-Id`。2xx 和 3xx 响应耗时达到 1000ms 时会用 warn 记录。开发环境的未处理异常会记录 stack，生产和测试环境不会记录 stack。需要看 SQL 时，把 `LOG_SQL` 设成 `true`，日志只会打印 SQL 和参数数量，不打印参数原值。

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
