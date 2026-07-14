# Fifa 前端指南

这份文档说明 `apps/fifa` 当前怎么组织。

## 现在包含什么

`@xdd-zone/fifa` 现在包含基础控制台框架：

- React / Vite 入口。
- TanStack Router 路由。
- 基础布局、侧边菜单、顶部栏、标签栏和设置抽屉。
- Catppuccin 主题。
- 登录页、首页、404 页面和几个示例页。
- 内容模块，当前提供文章列表、创建、编辑、媒体库、分类和标签管理页。
- 站点模块，当前提供站点配置、公开资料和项目管理页。
- 系统设置模块，当前提供个人资料页和 LLM 配置页。
- 系统运行模块，当前提供 Momo readiness、outbox 任务和运行日志查询页。

这些页面已经接上 Momo 接口：

- 登录页走邮箱密码登录。
- 首页调健康检查和 ping 验证。
- 内容模块调文章、素材、分类和标签接口。
- 站点模块调站点配置、公开资料和项目接口。
- 系统设置模块调个人资料和 LLM 配置接口。
- 系统运行页调 readiness、outbox 和运行日志接口。

## 开始改 UI 前先看

只要任务涉及页面、布局、导航或展示型组件，先看：

1. `docs/apps/fifa-design.md`
2. `apps/fifa/README.md`
3. 这份文档

## 关键目录

```text
apps/fifa/src/
├── app/
├── components/
├── features/
├── layout/
├── api/
├── stores/
└── utils/
```

最常改的地方：

- `app/router`
  路由类型、页面记录汇总和路由树。
- `app/navigation`
  菜单生成。
- `features`
  页面模块。每个模块有自己的 `pages/` 和 `routes.tsx`。
- `layout`
  控制台整体布局。
- `api`
  调 Momo 的请求入口和 TanStack Query hooks。
- `components`
  通用组件和示例组件。
- `stores`
  设置、标签栏等本地状态。

## 当前页面路径

- `/login`
- `/`
- `/content/posts`
- `/content/posts/$postId`
- `/content/assets`
- `/content/taxonomy`
- `/site/config`
- `/site/profile`
- `/site/projects`
- `/settings/profile`
- `/settings/llm`
- `/system/operations`
- `/env-example`
- `/ui-showcase`
- `/markdown-example`
- `/image-crop`
- `/error-example`
- `/forbidden-example`
- `/not-found-example`
- `/404`

## 路由和菜单

路由文件：

```text
apps/fifa/src/app/router/records.ts
apps/fifa/src/app/router/routes.tsx
```

菜单文件：

```text
apps/fifa/src/app/navigation/navigation.ts
```

新增页面通常要检查：

1. `apps/fifa/src/features/<module>/pages/<Page>.tsx`
2. `apps/fifa/src/features/<module>/routes.tsx`
3. 新模块要加到 `apps/fifa/src/app/router/records.ts`

页面记录里的 `menu: false` 表示不进菜单。
页面记录里的 `tab: false` 表示不生成标签页。
页面记录里的 `layout.contentWidth: 'full'` 表示内容区使用全宽。

## 页面和 API 分工

Fifa 是后台管理端。页面和菜单按管理任务组织，比如写文稿、管素材、改站点配置、管项目。`apps/fifa/src/api` 按 Momo 模块组织，比如 `content`、`assets`、`profile`、`site`、`projects`、`events`、`llm`。

页面只调用 query 或 mutation hook，不直接 import `momoClient`，也不手写 query key。

## Momo 请求

Fifa 使用 Hono RPC 调 Momo 的 `/rpc/*` 接口。`/api/auth/*` 由 Better Auth 处理，按原始 HTTP 响应和 cookie 处理。

相关文件：

```text
apps/fifa/src/api/client.ts
apps/fifa/src/api/rpc.ts
apps/fifa/src/api/auth/sign-in.api.ts
apps/fifa/src/api/auth/auth.query.ts
apps/fifa/src/api/system/health.api.ts
apps/fifa/src/api/system/readiness.api.ts
apps/fifa/src/api/system/ping.api.ts
apps/fifa/src/api/system/system.query.ts
apps/fifa/src/api/system/index.ts
apps/fifa/src/api/content/posts.api.ts
apps/fifa/src/api/content/content.query.ts
apps/fifa/src/api/content/index.ts
apps/fifa/src/api/assets/assets.api.ts
apps/fifa/src/api/assets/assets.query.ts
apps/fifa/src/api/assets/index.ts
apps/fifa/src/api/profile/profile.api.ts
apps/fifa/src/api/profile/profile.query.ts
apps/fifa/src/api/profile/index.ts
apps/fifa/src/api/site/site.api.ts
apps/fifa/src/api/site/site.query.ts
apps/fifa/src/api/site/index.ts
apps/fifa/src/api/projects/projects.api.ts
apps/fifa/src/api/projects/projects.query.ts
apps/fifa/src/api/projects/index.ts
apps/fifa/src/api/events/events.api.ts
apps/fifa/src/api/events/events.query.ts
apps/fifa/src/api/events/index.ts
apps/fifa/src/api/llm/llm.api.ts
apps/fifa/src/api/llm/llm.query.ts
apps/fifa/src/api/llm/index.ts
```

文件分工：

- `api/client.ts`
  创建 `momoClient`，读取 `VITE_MOMO_BASE_URL`。
- `api/rpc.ts`
  读取 Momo 返回的 JSON。网络请求失败时返回 `ApiResponse` 失败结构。
- `api/auth/*.api.ts`
  调 Momo 的 Better Auth 接口。这里直接处理 HTTP 响应和 cookie。
- `api/system/*.api.ts`
  调 Momo readiness 和运行日志 RPC。
- `api/content/*.api.ts`
  调 Momo content RPC。
- `api/assets/*.api.ts`
  调 Momo 独立素材接口。
- `api/profile/*.api.ts`
  调 Momo 的个人资料接口和 Better Auth 账号绑定接口。
- `api/site/*.api.ts`
  调 Momo 站点配置接口。
- `api/projects/*.api.ts`
  调 Momo 项目接口。
- `api/events/*.api.ts`
  调 Momo outbox 列表、详情和重试接口。
- `api/llm/*.api.ts`
  调 Momo LLM 配置接口。
- `api/<module>/<module>.query.ts`
  放对应模块的 query key 和 hooks。

每个模块的规则一样：页面只调用 `<module>.query.ts` 里的 hooks，不直接 import `momoClient`，也不手写 query key。

Fifa 通过环境变量读取 Momo 地址：

```text
VITE_MOMO_BASE_URL=http://localhost:7788
```

Fifa 通过环境变量读取 Bobo 地址，用来拼文章预览 iframe 地址：

```text
VITE_BOBO_BASE_URL=http://localhost:4399
```

Fifa 当前还会读取运行环境：

```text
VITE_APP_ENV=development
```

示例文件在：

```text
apps/fifa/.env.example
```

接口清单和返回说明统一看 [topics/api.md](../topics/api.md)。Fifa 调管理端 `/rpc/*` 接口、`/api/auth/*` 和 `/health`，不调 `/rpc/bobo/*` 公开接口。

当前写法：

- `POST /api/auth/sign-in/email`
  用 `useSignInEmailMutation()`，只在登录页提交表单时发送。
- `GET /rpc/fifa/auth/me`
  用 `useFifaAuthMeMutation()` 在登录成功后验证账号。顶栏头像菜单用 `useFifaAuthMeQuery()` 读取当前账号信息。
- `GET /health`
  用 `useSystemHealthQuery()`，页面打开后自动请求，也可以点刷新按钮重新请求。
- `GET /rpc/system/readiness`
  用 `useSystemReadinessQuery()` 在系统运行页检查数据库、缓存、搜索、文件存储和日志服务。
- `GET /rpc/system/logs`
  用 `useSystemLogsInfiniteQuery()` 查询最近 15 分钟到 24 小时的 Momo 运行日志。页面用 cursor 加载更多，不拼 LogQL。
- `POST /rpc/system/ping`
  用 `usePingSystemMutation()`，只在点击 Ping 按钮时发送。
- content 文章、素材、分类和标签接口
  页面通过 `apps/fifa/src/api/content/content.query.ts` 里的 hooks 调用。
- LLM 配置接口
  页面通过 `apps/fifa/src/api/llm/llm.query.ts` 里的 hooks 调用。
- outbox 接口
  页面通过 `apps/fifa/src/api/events/events.query.ts` 里的 hooks 调用。

新增 Fifa 请求时按这个顺序写：

1. 在 `apps/fifa/src/api/<module>/<name>.api.ts` 写接口函数。函数内部通过 `momoClient.<path>.$get()` 或 `momoClient.<path>.$post()` 调 Momo，不手写接口 URL。
2. 在 `apps/fifa/src/api/<module>/<module>.query.ts` 写 query key 和 hook。`GET` 接口用 `useQuery`，`POST` 接口用 `useMutation`。
3. 页面只 import hook，不直接 import `momoClient`。

Fifa 的 RPC 类型从 `@xdd-zone/momo/rpc` 引入，只使用 `import type`。

## 主题

主题说明看：

- [apps/fifa-design.md](./fifa-design.md)
- [topics/theme.md](../topics/theme.md)

相关文件：

- `packages/catppuccin-theme/styles/fifa.css`
- `apps/fifa/src/utils/theme.ts`
- `apps/fifa/src/utils/catppuccin.antd.ts`

## 运行和检查

```bash
pnpm dev:fifa
pnpm lint:fifa
pnpm type-check:fifa
pnpm build:fifa
```
