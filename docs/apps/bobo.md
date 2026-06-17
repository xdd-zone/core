# Bobo 个人站点指南

这份文档只写 `apps/bobo` 当前能直接用的目录、命令和维护规则。

## 项目位置

- 包名：`@xdd-zone/bobo`
- 目录：`apps/bobo`
- 框架：`Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript`
- 路由：App Router
- 开发端口：`4399`

## 先看哪些文件

改 Bobo 时按这个顺序看：

1. 根目录 `AGENTS.md`
2. `docs/apps/bobo.md`
3. `apps/bobo/README.md`
4. 当前要改的页面、组件或样式文件

## 目录

- `apps/bobo/app/layout.tsx`
  管全局布局、字体、metadata、主题初始化脚本和页面背景。
- `apps/bobo/app/page.tsx`
  首页。
- `apps/bobo/app/preview/posts/[postId]/page.tsx`
  文章预览页，读取 `MOMO_BASE_URL` 指向的 Momo 预览接口。
- `apps/bobo/app/lab`
  放样式演示、主题验证和临时页面。
- `apps/bobo/app/globals.css`
  全局样式入口，只负责导入 Tailwind、shadcn 样式、共享主题入口和本地样式文件。
- `apps/bobo/app/styles/base/reset.css`
  放基础样式。
- `apps/bobo/app/styles/patterns/bobo-pattern.css`
  放页面背景纹理。
- `apps/bobo/app/styles/utilities/animations.css`
  放动画工具类。
- `apps/bobo/components`
  放站点组件。
- `apps/bobo/hooks`
  放浏览器交互相关 hook。
- `apps/bobo/lib`
  放主题函数和工具函数。
- `apps/bobo/public`
  放静态资源。

## 命令

在 monorepo 根目录执行：

```bash
pnpm dev:bobo
pnpm lint:bobo
pnpm type-check:bobo
pnpm build:bobo
pnpm --filter @xdd-zone/bobo test
```

生产预览服务：

```bash
pnpm --filter @xdd-zone/bobo start
```

只检查 Bobo 的格式：

```bash
pnpm --filter @xdd-zone/bobo format:check
```

## 环境变量

Bobo 通过环境变量读取 Momo 地址：

```text
MOMO_BASE_URL=http://localhost:7788
BOBO_ALLOWED_DEV_ORIGINS=localhost,127.0.0.1
BOBO_BASE_PATH=
```

示例文件在：

```text
apps/bobo/.env.example
```

本地开发配置放在：

```text
apps/bobo/.env.development
```

`MOMO_BASE_URL` 只给 Next 服务端代码读取。只有浏览器代码直接请求 Momo 时，才使用 `NEXT_PUBLIC_` 前缀。

`BOBO_ALLOWED_DEV_ORIGINS` 用来放 Next 开发服务允许访问的 hostname，多个值用英文逗号隔开。

`BOBO_BASE_PATH` 用来改 Next 路由前缀。正常本地开发时留空。通过 code-server 访问时填 `/absproxy/4399`，让页面、站内链接和 `/_next/static` 资源都走同一个前缀。

code-server 的配置放在 `apps/bobo/.env.code-server`，启动命令和访问地址看 [code-server 开发](../development/code-server.md)。

## 页面规则

- 新页面放在 `apps/bobo/app/<route>/page.tsx`。
- 页面 metadata 优先写在对应 `page.tsx` 或 `layout.tsx`。
- 全局 metadata 放在 `apps/bobo/app/layout.tsx`。
- App Router 默认写服务端组件。
- 只有需要浏览器 API、交互状态或事件处理时，才加 `'use client'`。
- 临时演示内容放到 `apps/bobo/app/lab`，不要放在首页。

## 组件规则

- 没有明确复用前，先在当前页面里写。
- 复用点明确后，再放到 `apps/bobo/components`。
- 组件 className 拼接使用 `apps/bobo/lib/utils.ts` 里的 `cn()`。
- shadcn 组件配置在 `apps/bobo/components.json`。

## 样式规则

- 全局样式入口只改 `apps/bobo/app/globals.css`。
- 主题色走 `data-theme` 和 Tailwind 语义类名。
- Bobo 使用 `@xdd-zone/catppuccin-theme/styles/bobo.css`。
- 共享主题文件放在 `packages/catppuccin-theme`。
- 页面和组件里优先写 `bg-surface`、`text-fg`、`border-border` 这类语义类名。
- 不直接散写 `var(--color-*)` 和 `var(--theme-*)`。只有工具类表达不了的背景图、渐变或阴影可以少量使用。
- 当前圆角基线是 `--radius: 0.5rem`。
- 大容器用 `rounded-xl`。
- 一般卡片用 `rounded-lg`。
- 按钮、标签、状态块优先用 `rounded-sm` 或 `rounded-md`。
- 没有明确设计理由时，不新增 `rounded-2xl`、`rounded-3xl`、`rounded-full`。

## 主题维护

- 可选主题写在 `apps/bobo/lib/theme.ts` 的 `THEMES`。
- 默认主题写在 `DEFAULT_THEME`。
- 本地存储 key 写在 `THEME_STORAGE_KEY`。
- 页面加载前的主题初始化脚本在 `apps/bobo/app/layout.tsx`。
- 新增主题时，同时改 `@xdd-zone/catppuccin-theme` 的主题名、色板和样式入口。

## 依赖维护

- Bobo 依赖写在 `apps/bobo/package.json`。
- ESLint 配置从 `@xdd-zone/eslint-config` 继承，再在 `apps/bobo/eslint.config.mjs` 里补 Next.js 规则。
- Prettier 配置直接导出 `@xdd-zone/eslint-config/prettier`。
- TypeScript 配置从根目录 `tsconfig.browser.json` 继承，Next.js 专用配置继续留在 `apps/bobo/tsconfig.json`。
- Next 相关版本写在根目录 `pnpm-workspace.yaml` 的 `catalogs.next`。
- React 相关版本继续用 `catalog:react`。
- 不在 `apps/bobo` 下新增独立 `pnpm-lock.yaml` 或 `pnpm-workspace.yaml`。
- 改依赖后在根目录执行 `pnpm install`。

## 文档维护

改 Bobo 目录、命令或维护规则时，同步检查这些文件：

- `AGENTS.md`
- `README.md`
- `docs/index.md`
- `docs/development.md`
- `docs/testing.md`
- `docs/architecture.md`
- `docs/skills.md`
- `apps/bobo/README.md`

只改 Bobo 页面文案时，优先改对应页面文件，不需要改这些文档。

## 提交前检查

改 Bobo 代码后至少跑：

```bash
pnpm lint:bobo
pnpm type-check:bobo
```

改构建配置、依赖、样式入口或 App Router 文件后，再跑：

```bash
pnpm build:bobo
```
