# API 指南

这份文档说明当前 Momo API。

## 基础地址

- 服务地址：`http://localhost:7788`
- 健康检查：`http://localhost:7788/health`

当前没有 OpenAPI 页面。

## 代码位置

当前接口放在：

```text
apps/momo/src/modules/system/system.route.ts
apps/momo/src/modules/auth/auth.route.ts
apps/momo/src/modules/content/content.route.ts
apps/momo/src/modules/content/public-content.route.ts
apps/momo/src/modules/assets/assets.route.ts
apps/momo/src/modules/profile/profile.route.ts
apps/momo/src/modules/site/site.route.ts
apps/momo/src/modules/projects/projects.route.ts
apps/momo/src/modules/preview/preview.route.ts
apps/momo/src/modules/search/search.route.ts
apps/momo/src/modules/events/events.route.ts
```

相关入口：

- `apps/momo/src/app.ts`
  创建运行时 app，给测试和包导出使用。
- `apps/momo/src/bootstrap/create-app.ts`
  创建 Hono app，注册全局中间件、错误处理、404 和一级路由。
- `apps/momo/src/rpc.ts`
  导出给 Hono RPC client 使用的 `AppType`。
- `apps/momo/src/index.ts`
  直接运行 Momo 时启动 Node 服务。
- `apps/momo/src/routes/index.ts`
  挂载一级路由。
- `apps/momo/src/modules`
  放接口模块。
- `packages/contracts/src`
  放接口 schema、类型和统一响应结构。

后续新增接口按 [apps/momo.md](../apps/momo.md) 放到 `apps/momo/src/modules/<module>`。content 模块的文件职责和类型写法也看这份文档。

管理端接口和公开站点接口分开写。Fifa 使用 `/rpc/<module>/*` 这类管理接口，Bobo 使用 `/rpc/bobo/*` 这类公开接口。两类接口可以共用 service、repository 和查询代码，但 route、响应 DTO 和 presenter 要分开。

## 当前接口

| 方法 | 路径 | 返回 |
| ---- | ---- | ---- |
| `GET` | `/` | 服务名称和状态 |
| `GET` | `/health` | 健康检查状态 |
| `POST` | `/rpc/system/ping` | Momo ping 结果 |
| `GET` | `/rpc/system/readiness` | PostgreSQL、缓存、搜索、文件存储和日志服务状态，需要 fifa owner |
| `GET` | `/rpc/system/logs` | Momo 结构化运行日志，需要 fifa owner，最长查询 24 小时，单次最多 200 条 |
| `GET` | `/rpc/fifa/auth/me` | 当前 fifa 用户 |
| `GET` | `/rpc/fifa/profile` | 当前 fifa owner 的个人资料和账号绑定状态 |
| `PATCH` | `/rpc/fifa/profile` | 修改当前 fifa owner 的显示名和头像地址 |
| `POST` | `/rpc/fifa/profile/avatar` | 上传当前 fifa owner 的头像文件，单个文件最大 `2 MiB`，并写入 `user_profiles.avatar_url` |
| `GET` | `/rpc/fifa/profile/avatar/:storagePathToken` | 读取头像上传接口返回的本地头像文件，允许跨域显示 |
| `GET` | `/rpc/bobo/auth/me` | 当前 bobo 用户，未登录时 `user` 为 `null` |
| `GET`/`POST` | `/api/auth/*` | `better-auth` 登录、登出、OAuth callback 和 session cookie |
| `GET` | `/rpc/llm/providers` | LLM Provider 配置列表，不返回 API Key 明文 |
| `POST` | `/rpc/llm/providers` | 新建 OpenAI-compatible Provider |
| `PATCH` | `/rpc/llm/providers/:providerId` | 更新 Provider 配置或 API Key |
| `DELETE` | `/rpc/llm/providers/:providerId/api-key` | 清空未启用 Provider 的 API Key |
| `POST` | `/rpc/llm/providers/:providerId/test` | 测试 Provider 并写入调用日志 |
| `GET` | `/rpc/llm/use-cases` | LLM use case 配置列表 |
| `GET` | `/rpc/llm/use-cases/:useCase/status` | 检查单个 LLM use case 是否可调用 |
| `POST` | `/rpc/llm/use-cases/:useCase/test` | 用单个 LLM use case 的真实配置发起测试调用 |
| `PATCH` | `/rpc/llm/use-cases/:useCase` | 更新单个 LLM use case 配置 |
| `GET` | `/rpc/llm/call-logs` | LLM 调用日志列表 |
| `GET` | `/rpc/llm/call-logs/:logId` | 单条 LLM 调用日志 |
| `DELETE` | `/rpc/llm/call-logs/expired` | 删除已过期的 LLM 调用日志 |
| `GET` | `/rpc/content/posts` | 后台文章列表 |
| `POST` | `/rpc/content/posts` | 创建文章草稿 |
| `POST` | `/rpc/content/posts/meta-suggestion` | 生成文章 slug、摘要或标题建议，不保存文章 |
| `GET` | `/rpc/content/posts/:id` | 后台文章详情 |
| `PATCH` | `/rpc/content/posts/:id/draft` | 保存文章草稿并写入新 revision |
| `POST` | `/rpc/content/posts/:id/preview-token` | 生成 30 分钟有效的预览 token |
| `POST` | `/rpc/content/posts/:id/publish` | 发布当前草稿 revision |
| `POST` | `/rpc/content/posts/:id/archive` | 归档文章，并从公开站点和搜索索引移除 |
| `GET` | `/rpc/content/mdx-components` | MDX 组件清单 |
| `GET` | `/rpc/assets` | 素材列表 |
| `POST` | `/rpc/assets/cleanup/preview` | 统计当前筛选条件下未引用素材的数量和文件大小 |
| `POST` | `/rpc/assets/cleanup` | 删除当前筛选条件下未引用的素材 |
| `GET` | `/rpc/assets/:id` | 素材详情和引用信息 |
| `GET` | `/rpc/assets/:id/file` | 读取素材文件 |
| `PATCH` | `/rpc/assets/:id` | 更新素材说明 |
| `DELETE` | `/rpc/assets/:id` | 删除素材 |
| `POST` | `/rpc/assets/images` | 上传图片素材 |
| `GET` | `/rpc/content/categories` | 后台分类列表 |
| `POST` | `/rpc/content/categories` | 创建分类 |
| `GET` | `/rpc/content/categories/:id` | 后台分类详情 |
| `PATCH` | `/rpc/content/categories/:id` | 更新分类 |
| `DELETE` | `/rpc/content/categories/:id` | 删除分类 |
| `GET` | `/rpc/content/tags` | 后台标签列表 |
| `POST` | `/rpc/content/tags` | 创建标签 |
| `GET` | `/rpc/content/tags/:id` | 后台标签详情 |
| `PATCH` | `/rpc/content/tags/:id` | 更新标签 |
| `DELETE` | `/rpc/content/tags/:id` | 删除标签 |
| `GET` | `/rpc/previews/:token` | 使用通用预览 token 读取文章或项目预览数据 |
| `GET` | `/rpc/bobo/content/posts?page=1&pageSize=10&categorySlug=notes&tagSlug=typescript` | 个人站文章列表，可按页码、分类和标签筛选，返回分页字段 |
| `GET` | `/rpc/bobo/content/posts/:slug` | 个人站文章详情，只返回已发布文章 |
| `GET` | `/rpc/bobo/content/categories` | 个人站分类列表，返回每个分类的已发布文章数量 |
| `GET` | `/rpc/bobo/content/tags` | 个人站标签列表 |
| `GET` | `/rpc/bobo/profile` | 公开个人资料 |
| `GET` | `/rpc/profile/public` | 后台读取公开个人资料，需要 fifa owner |
| `PATCH` | `/rpc/profile/public` | 修改公开个人资料，需要 fifa owner |
| `GET` | `/rpc/site/config` | 后台读取 Bobo 站点配置 |
| `PATCH` | `/rpc/site/config` | 后台修改 Bobo 站点配置 |
| `GET` | `/rpc/bobo/site/config` | 公开读取 Bobo 站点配置 |
| `GET` | `/rpc/projects` | 后台项目列表 |
| `POST` | `/rpc/projects` | 创建项目草稿 |
| `GET` | `/rpc/projects/:id` | 后台项目详情 |
| `PATCH` | `/rpc/projects/:id/draft` | 保存项目草稿 |
| `POST` | `/rpc/projects/:id/publish` | 发布项目 |
| `POST` | `/rpc/projects/:id/preview-token` | 生成项目预览 token |
| `POST` | `/rpc/projects/:id/archive` | 归档项目，并从公开站点和搜索索引移除 |
| `GET` | `/rpc/bobo/projects?page=1&pageSize=8` | 公开项目列表，返回分页字段 |
| `GET` | `/rpc/bobo/projects/:slug` | 公开项目详情 |
| `GET` | `/rpc/bobo/search?q=关键词` | 公开站点搜索，搜索未启用时返回空数组 |
| `POST` | `/rpc/events/outbox/retry` | 处理 pending 或 failed outbox 任务，需要 fifa owner |
| `GET` | `/rpc/events/outbox` | outbox 任务列表，需要 fifa owner |
| `GET` | `/rpc/events/outbox/:eventId` | 单条 outbox 任务和 payload，需要 fifa owner |
| `POST` | `/rpc/events/outbox/:eventId/retry` | 立即重试指定 outbox 任务，需要 fifa owner |

公开邮箱注册被禁用：

| 方法 | 路径 | 返回 |
| ---- | ---- | ---- |
| `POST` | `/api/auth/sign-up/email` | `403 AUTH.METHOD_NOT_ALLOWED` |

## 响应格式

Momo 自己写的接口返回统一结构。

`/api/auth/*` 交给 `better-auth` 处理，可能返回 `better-auth` 自己的 JSON、重定向响应或 `set-cookie`。不要按下面的统一结构解析 `/api/auth/*`。

响应头会写回当前请求使用的 `X-Request-Id`。浏览器跨域请求可以发送 `X-Request-Id`，也可以读取响应里的 `X-Request-Id`。跨域认证请求会返回 `Access-Control-Allow-Credentials: true`，浏览器可以带 session cookie 调用 Momo。

成功：

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

失败：

```json
{
  "ok": false,
  "error": {
    "code": "COMMON.INVALID_REQUEST",
    "message": "请求参数不正确"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

请求体过大时返回：

```json
{
  "ok": false,
  "error": {
    "code": "COMMON.PAYLOAD_TOO_LARGE",
    "message": "请求体过大"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

当前请求体大小限制：

- `/rpc/*` 的非 GET 请求最大 `1 MiB`。
- `/api/auth/*` 的非 GET 请求最大 `64 KiB`。

请求处理超时时，Momo 自己写的接口返回 `504 SYSTEM.UPSTREAM_TIMEOUT`。当前普通 `/rpc/*` 超时时间是 `5s`，`/rpc/content/posts/meta-suggestion` 是 `60s`，`/api/auth/*` 是 `10s`。

## 响应示例

### `GET /`

```json
{
  "ok": true,
  "data": {
    "name": "@xdd-zone/momo",
    "status": "ok"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

### `GET /health`

```json
{
  "ok": true,
  "data": {
    "env": "test",
    "service": "momo",
    "status": "ok"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

### `POST /rpc/system/ping`

请求：

```json
{
  "name": "fifa"
}
```

返回：

```json
{
  "ok": true,
  "data": {
    "env": "test",
    "service": "momo",
    "message": "pong, fifa"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

### `GET /rpc/fifa/auth/me`

未登录时返回：

```json
{
  "ok": false,
  "error": {
    "code": "AUTH.UNAUTHENTICATED",
    "message": "当前请求未登录"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

已登录但没有 `fifa.owner`，或没有 password 登录记录时，返回 403。

通过检查时返回：

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "user-id",
      "displayName": "Owner",
      "avatarUrl": null
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

### `GET /rpc/bobo/auth/me`

未登录时返回：

```json
{
  "ok": true,
  "data": {
    "user": null
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

已登录时会检查用户状态，并补上 `bobo.visitor`。返回：

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "user-id",
      "displayName": "Visitor",
      "avatarUrl": null
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

## 本地验证

先启动 Momo：

```bash
pnpm dev:momo
```

再请求：

```bash
curl http://localhost:7788/
curl http://localhost:7788/health
curl -X POST http://localhost:7788/rpc/system/ping \
  -H 'content-type: application/json' \
  -d '{"name":"fifa"}'
curl -i http://localhost:7788/rpc/fifa/auth/me
curl -i http://localhost:7788/rpc/bobo/auth/me
curl -i -X POST http://localhost:7788/api/auth/sign-up/email \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"password123","name":"Demo"}'
```

## 新增接口

按模块新增 route 文件：

```text
apps/momo/src/modules/<module>/<module>.route.ts
```

再到 `apps/momo/src/routes/index.ts` 挂载。

如果接口有请求体或返回体，先在 `packages/contracts/src/<module>` 增加 schema 和类型。Momo 给 Fifa 和 Bobo 用的接口都要有 contracts 类型；Momo 内部 service 类型和数据库 record 不放进 contracts。
