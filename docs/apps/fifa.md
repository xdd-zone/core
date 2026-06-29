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
- 系统设置模块，当前提供 LLM 配置页。

当前登录页接入了 Momo 的邮箱密码登录接口。当前首页接入了 Momo 的健康检查和 ping 验证接口。当前内容模块接入了 Momo 的文章、素材、分类和标签接口。当前系统设置模块接入了 Momo 的 LLM 配置接口。

## 开始改 UI 前先看

只要任务涉及页面、布局、导航或展示型组件，先看：

1. `apps/fifa/design-context.md`
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
- `/settings/llm`
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

## Momo 请求

Fifa 使用 Hono RPC 调 Momo 的 `/rpc/*` 接口。`/api/auth/*` 由 Better Auth 处理，按原始 HTTP 响应和 cookie 处理。

相关文件：

```text
apps/fifa/src/api/client.ts
apps/fifa/src/api/rpc.ts
apps/fifa/src/api/auth/sign-in.api.ts
apps/fifa/src/api/auth/auth.query.ts
apps/fifa/src/api/system/health.api.ts
apps/fifa/src/api/system/ping.api.ts
apps/fifa/src/api/system/system.query.ts
apps/fifa/src/api/system/index.ts
apps/fifa/src/api/content/posts.api.ts
apps/fifa/src/api/content/content.query.ts
apps/fifa/src/api/content/index.ts
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
  调 Momo RPC。页面不要直接 import `momoClient`。
- `api/system/system.query.ts`
  放 system 模块的 query key 和 hooks。页面不要手写 system query key。
- `api/content/*.api.ts`
  调 Momo content RPC。页面不要直接 import `momoClient`。
- `api/content/content.query.ts`
  放 content 模块的 query key 和 hooks。页面不要手写 content query key。
- `api/llm/*.api.ts`
  调 Momo LLM 配置接口。页面不要直接 import `momoClient`。
- `api/llm/llm.query.ts`
  放 LLM 配置的 query key 和 hooks。页面不要手写 LLM query key。

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

当前登录页和首页会请求：

```text
POST /api/auth/sign-in/email
GET /rpc/fifa/auth/me
GET /health
POST /rpc/system/ping
GET /rpc/content/posts
POST /rpc/content/posts
GET /rpc/content/posts/:id
PATCH /rpc/content/posts/:id/draft
POST /rpc/content/posts/:id/preview-token
POST /rpc/content/posts/:id/publish
GET /rpc/content/mdx-components
POST /rpc/content/assets/images
GET /rpc/content/assets
GET /rpc/content/assets/:id
GET /rpc/content/assets/:id/file
PATCH /rpc/content/assets/:id
DELETE /rpc/content/assets/:id
GET /rpc/content/categories
POST /rpc/content/categories
GET /rpc/content/categories/:id
PATCH /rpc/content/categories/:id
DELETE /rpc/content/categories/:id
GET /rpc/content/tags
POST /rpc/content/tags
GET /rpc/content/tags/:id
PATCH /rpc/content/tags/:id
DELETE /rpc/content/tags/:id
GET /rpc/llm/use-cases
PATCH /rpc/llm/use-cases/:useCase
```

当前写法：

- `POST /api/auth/sign-in/email`
  用 `useSignInEmailMutation()`，只在登录页提交表单时发送。
- `GET /rpc/fifa/auth/me`
  登录成功后请求一次。当前只看接口是否返回成功，不保存用户信息。
- `GET /health`
  用 `useSystemHealthQuery()`，页面打开后自动请求，也可以点刷新按钮重新请求。
- `POST /rpc/system/ping`
  用 `usePingSystemMutation()`，只在点击 Ping 按钮时发送。
- content 文章、素材、分类和标签接口
  页面通过 `apps/fifa/src/api/content/content.query.ts` 里的 hooks 调用。
- LLM 配置接口
  页面通过 `apps/fifa/src/api/llm/llm.query.ts` 里的 hooks 调用。

新增 Fifa 请求时按这个顺序写：

1. 在 `apps/fifa/src/api/<module>/<name>.api.ts` 写接口函数。
2. 在 `apps/fifa/src/api/<module>/<module>.query.ts` 写 query key 和 hook。
3. 页面只 import hook，不直接 import `momoClient`。
4. `GET` 接口用 `useQuery`，`POST` 接口用 `useMutation`。

## 主题

主题说明看：

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
