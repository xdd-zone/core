# @xdd-zone/momo

`@xdd-zone/momo` 是 XDD Zone Core 的 Hono API 服务，代码放在 `apps/momo`，运行在 Node.js 上。

## 现在能做什么

- 启动 Node HTTP 服务。
- 创建运行时 app，给测试和包导出使用。
- 提供统一响应格式、请求日志、CORS、安全响应头、请求体大小限制和超时处理。
- 提供系统接口和认证接口。
- 提供内容接口，包含文章草稿、发布、预览 token、公开文章、分类、标签和图片素材。
- 使用 Better Auth 处理登录、登出、OAuth callback 和 session cookie。
- 接入 PostgreSQL、Drizzle migration、内存缓存、Redis 协议缓存、本地文件存储、腾讯云 COS、禁用搜索驱动、Meilisearch 搜索驱动和 LLM 驱动。

当前还没有搜索 HTTP 接口和业务索引。

## 常用命令

在 monorepo 根目录执行：

```bash
pnpm dev:momo
pnpm lint:momo
pnpm type-check:momo
pnpm build:momo
```

只跑 Momo 子包命令时进入 `apps/momo`：

```bash
pnpm dev
pnpm test
pnpm local:up
pnpm local:down
pnpm db:generate
pnpm db:migrate
pnpm db:check
pnpm db:studio
pnpm auth:generate
pnpm seed:owner
pnpm storage:test
```

指定开发端口：

```bash
PORT=7788 pnpm dev
```

创建 owner 账号：

```bash
pnpm local:up
pnpm db:migrate
pnpm seed:owner
```

`pnpm seed:owner` 会写入 owner 账号、默认应用、登录方式、角色、初始内容分类、标签和第一篇已发布文章。重复执行会复用已有记录。

## 常改位置

- `src/index.ts`
  直接运行 Momo 时启动 Node 服务。
- `src/app.ts`
  创建运行时 app，导出 `app` 和默认导出。
- `src/bootstrap`
  创建 runtime，注册全局中间件、错误处理、404 和路由。
- `src/routes/index.ts`
  挂载一级路由。
- `src/modules`
  放业务模块。当前有 `system`、`auth`、`content` 和 `llm`。
- `src/infra`
  放 PostgreSQL、Drizzle、缓存、搜索和文件存储接入代码。
- `src/shared`
  放 Momo 内部共用的错误类型、环境变量读取、Hono 类型和响应 meta 生成函数。

## 已有接口

- `GET /`
  返回服务名称和状态。
- `GET /health`
  返回健康检查状态。
- `POST /rpc/system/ping`
  接收 `{ "name": "fifa" }`，返回 `pong, fifa`。
- `/api/auth/*`
  交给 Better Auth 处理登录、登出、OAuth callback 和 session cookie。
- `GET /rpc/fifa/auth/me`
  读取当前 session，检查当前用户能不能进入 Fifa。
- `GET /rpc/bobo/auth/me`
  读取当前 session。未登录时返回 `user: null`，已登录时补上 `bobo.visitor` 角色。
- `GET /rpc/content/posts`
  返回后台文章列表。
- `POST /rpc/content/posts`
  创建文章草稿。
- `POST /rpc/content/posts/meta-suggestion`
  生成文章 slug、摘要或标题建议，不保存文章。
- `GET /rpc/llm/providers`
  返回 LLM Provider 配置列表，不返回 API Key 明文。
- `POST /rpc/llm/providers`
  新建 OpenAI-compatible Provider。
- `PATCH /rpc/llm/providers/:providerId`
  更新 Provider 名称、地址、模型、超时时间、启用状态或 API Key。
- `DELETE /rpc/llm/providers/:providerId/api-key`
  清空未启用 Provider 的 API Key。
- `POST /rpc/llm/providers/:providerId/test`
  用 Provider 默认模型发起测试调用，并写入调用日志。
- `GET /rpc/llm/use-cases`
  返回 LLM use case 配置列表。
- `PATCH /rpc/llm/use-cases/:useCase`
  更新单个 LLM use case 配置。
- `GET /rpc/llm/call-logs`
  返回 LLM 调用日志列表。
- `GET /rpc/llm/call-logs/:logId`
  返回单条 LLM 调用日志。
- `DELETE /rpc/llm/call-logs/expired`
  删除已过期的 LLM 调用日志。
- `GET /rpc/content/posts/:id`
  返回后台文章详情。
- `PATCH /rpc/content/posts/:id/draft`
  保存文章草稿。
- `POST /rpc/content/posts/:id/preview-token`
  生成文章预览 token。
- `POST /rpc/content/posts/:id/publish`
  发布文章。
- `GET /rpc/content/assets`
  返回素材列表。
- `GET /rpc/content/assets/:id`
  返回素材详情。
- `POST /rpc/content/assets/images`
  上传图片素材。
- `GET /rpc/content/assets/:id/file`
  读取素材文件。
- `GET /rpc/content/categories`
  返回后台分类列表。
- `POST /rpc/content/categories`
  创建后台分类。
- `GET`、`PATCH` 或 `DELETE /rpc/content/categories/:id`
  读取、更新或删除后台分类。
- `GET /rpc/content/tags`
  返回后台标签列表。
- `POST /rpc/content/tags`
  创建后台标签。
- `GET`、`PATCH` 或 `DELETE /rpc/content/tags/:id`
  读取、更新或删除后台标签。
- `GET /rpc/bobo/content/posts`
  返回个人站公开文章列表。
- `GET /rpc/bobo/content/posts/:slug`
  返回个人站公开文章详情。
- `GET /rpc/bobo/content/categories`
  返回个人站分类列表。
- `GET /rpc/bobo/content/tags`
  返回个人站标签列表。

## 环境变量

- `apps/momo/.env.example`
  记录 Momo 需要的变量名和示例值。
- `apps/momo/.env.development`
  本机开发使用。这个文件被 `.gitignore` 忽略，不提交到仓库。
- `apps/momo/.env.test`
  测试使用。这个文件只放固定测试假值，提交到仓库。

常用配置：

- `PORT`
  控制本地服务端口。
- `LOG_LEVEL`
  控制日志级别，开发环境默认 `info`。
- `LOG_SQL`
  设成 `true` 时打印 SQL 和参数数量，不打印参数原值。
- `CACHE_PROVIDER`
  默认 `memory`。设成 `redis` 时，需要配置 `CACHE_URL`。
- `SEARCH_PROVIDER`
  默认 `none`。设成 `meilisearch` 时，需要配置 `MEILI_HOST` 和 `MEILI_API_KEY`。
- `LLM_SECRET_KEY`
  32 字节 base64 字符串，只用来加密数据库里的 LLM Provider API Key。
- `STORAGE_PROVIDER`
  默认 `local`。设成 `cos` 时，需要配置腾讯云 COS 变量。

完整环境变量说明看 [docs/apps/momo.md](../../docs/apps/momo.md)。

## 本地服务和测试

`pnpm test` 会读取 `apps/momo/.env.test`，连接 `postgres://momo:momo@localhost:55432/momo_test`。第一次跑认证接口测试前，先运行：

```bash
pnpm local:up
```

测试会自动创建 `momo_test`，并只清理这个测试库里的表。

直接请求 app 时，可以在测试里用 `app.request()`：

```ts
import { app } from './src/app'

const response = await app.request('/health')
```

## 缓存、搜索、LLM 和文件存储

- 缓存代码放在 `src/infra/cache`。本地 Redis 协议缓存使用 Valkey，地址是 `redis://localhost:56379`。
- 搜索代码放在 `src/infra/search`。当前还没有业务模块调用搜索驱动。
- LLM provider 调用代码放在 `src/infra/llm`。Provider、use case 和调用日志接口放在 `src/modules/llm`。内容模块通过 `POST /rpc/content/posts/meta-suggestion` 生成文章字段建议。
- 文件存储代码放在 `src/infra/storage`。内容模块通过 `POST /rpc/content/assets/images` 保存图片素材。验证当前存储配置时，运行 `pnpm storage:test`。

更多说明看：

- [docs/apps/momo.md](../../docs/apps/momo.md)
- [docs/integrations/search/meilisearch.md](../../docs/integrations/search/meilisearch.md)
- [docs/integrations/storage/tencent-cos.md](../../docs/integrations/storage/tencent-cos.md)

## 改动前看哪里

- [docs/apps/momo.md](../../docs/apps/momo.md)
- [docs/topics/api.md](../../docs/topics/api.md)
