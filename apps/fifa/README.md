# @xdd-zone/fifa

`@xdd-zone/fifa` 是 XDD Zone Core 的前端控制台，代码放在 `apps/fifa`。

技术栈是 `React + Vite + TanStack Router + TanStack Query + TypeScript`。

## 现在能做什么

- 提供 React / Vite 入口。
- 使用 TanStack Router 生成路由树。
- 使用 TanStack Query 管理 Momo 请求状态。
- 有基础布局、侧边菜单、顶部栏、标签栏和设置抽屉。
- 使用 Catppuccin 主题。
- 有登录页、首页、404 页面和几个示例页。
- 首页会请求 Momo 的 `GET /health`。
- 点击 Ping 按钮时会请求 Momo 的 `POST /rpc/system/ping`。
- 登录页会请求 Momo 的 `POST /api/auth/sign-in/email`。
- 登录成功后会请求 Momo 的 `GET /rpc/fifa/auth/me`。
- 内容模块会请求 Momo 的文章、素材、分类和标签接口。

还没接入权限页面。

## 常用命令

在 monorepo 根目录执行：

```bash
pnpm dev:fifa
pnpm lint:fifa
pnpm type-check:fifa
pnpm build:fifa
```

只跑子包命令时进入 `apps/fifa`：

```bash
pnpm dev
pnpm preview
pnpm format:check
```

## 常改位置

```text
src/
├── app/
├── api/
├── components/
├── features/
├── layout/
├── stores/
└── utils/
```

- `app/router`
  路由类型、页面记录汇总和路由树。
- `app/navigation`
  左侧菜单生成。
- `features`
  页面模块。每个模块有自己的 `pages/` 和 `routes.tsx`。
- `layout`
  控制台整体布局。
- `api`
  调 Momo 的请求和 TanStack Query hooks。
- `stores`
  设置、标签栏等本地状态。

## 页面路径

- `/login`
- `/`
- `/content/posts`
- `/content/posts/$postId`
- `/content/assets`
- `/content/taxonomy`
- `/env-example`
- `/ui-showcase`
- `/markdown-example`
- `/image-crop`
- `/error-example`
- `/forbidden-example`
- `/not-found-example`
- `/404`

## 新增页面要改哪里

1. `apps/fifa/src/features/<module>/pages/<Page>.tsx`
2. `apps/fifa/src/features/<module>/routes.tsx`
3. 如果是新模块，再把模块记录加到 `apps/fifa/src/app/router/records.ts`

`apps/fifa/src/app/navigation/navigation.ts` 会从页面记录生成菜单。已有菜单组只需要在模块页面记录里写 `menu.group`。

## 新增 Momo 请求要改哪里

1. `apps/fifa/src/api/<module>/<name>.api.ts`
2. `apps/fifa/src/api/<module>/<module>.query.ts`
3. 使用接口的页面文件

页面只调用 `*.query.ts` 导出的 hook。不要在页面里直接 import `momoClient`。

`/rpc/*` 接口使用 Hono RPC。`/api/auth/*` 由 Better Auth 处理，按原始 HTTP 响应和 cookie 处理。

## 环境变量

示例文件在 `apps/fifa/.env.example`。

```text
VITE_APP_ENV=development
VITE_BOBO_BASE_URL=http://localhost:3000
VITE_DEV_BASE_PATH=
VITE_MOMO_BASE_URL=http://localhost:7788
```

`VITE_BOBO_BASE_URL` 用来拼文章预览地址，格式是 `${VITE_BOBO_BASE_URL}/preview/posts/${postId}?token=${token}`。通过 code-server 访问 Bobo 时，这里填 `https://code.example.com/absproxy/14399`。

通过 code-server 访问 Fifa 时，用 `pnpm dev:cs`，地址看 [docs/development/code-server.md](../../docs/development/code-server.md)。

## 开发前先看

只要任务涉及页面、布局、导航或展示型组件，先看：

1. `apps/fifa/design-context.md`
2. [docs/apps/fifa.md](../../docs/apps/fifa.md)
3. [docs/topics/theme.md](../../docs/topics/theme.md)
