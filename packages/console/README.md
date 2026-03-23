# XDD Zone Console

`@xdd-zone/console` 是 XDD Zone Core monorepo 中的后台管理前端，负责承载管理后台页面、交互、路由、主题与联调入口。

它与 `@xdd-zone/nexus` 的关系可以概括为：

```text
packages/nexus
  -> 提供 API / OpenAPI / 认证能力
packages/console
  -> 消费接口定义并提供后台界面
```

## 包定位

`@xdd-zone/console` 负责：

- 管理后台页面与布局
- 前端路由、导航与标签页组织
- 认证请求、会话缓存与登录态消费
- 状态管理、主题切换、国际化
- 与后端 API 的联调与展示
- 基于 `nexus` session 的登录、登出与会话恢复流程

不负责：

- 维护服务端接口定义的唯一来源
- 维护独立于 monorepo 的工程配置体系
- 解释或复制服务端已有的认证、权限与接口规则

## 技术栈

- Bun 1.3.5
- React 19
- TypeScript 5.9
- Vite 7
- TanStack Router 1.x
- TanStack Query 5.x
- Zustand
- Ant Design 6
- Tailwind CSS 4
- i18next

## 仓库关系

当前仓库的主要包包括：

- `@xdd-zone/nexus`
  - 后端 API、认证、权限与 OpenAPI 导出
- `@xdd-zone/console`
  - 后台管理前端
- `@xdd-zone/eslint-config`
  - 共享 ESLint / Prettier 配置

`console` 已接入当前 monorepo：

- 使用 Bun workspace 管理依赖
- 复用 `@xdd-zone/eslint-config`
- TypeScript 继承根目录 `tsconfig.base.json`
- 可通过根目录脚本与后端一起联调

前端架构采用：

- 集中式 `routeTree`
- 路由 `beforeLoad` 处理登录态校验与重定向
- `staticData` 统一维护页面标题、TabBar、面包屑元信息
- TanStack Query 管理 `/api/auth/get-session`、登录与登出
- 独立导航配置
- 细粒度权限以后端 `401 / 403` 语义为准

当前页面入口：

- `/dashboard`
  - 登录后的默认落点，当前保留为空状态入口
- `/articles`
  - 文章模块入口，当前保留为空状态入口
- `/ui-showcase`
  - 集中展示 Ant Design 组件、Catppuccin 主题与设计令牌
- `/markdown-example`
  - 集中展示 Markdown、GFM 与 Shiki 高亮效果
- `/image-crop`
  - 图片裁剪示例页

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 启动开发环境

在根目录同时启动前后端：

```bash
bun run dev
```

如果只想启动前端：

```bash
bun run dev:console
```

默认地址：

- Console: `http://localhost:2333`
- Nexus: `http://localhost:7788`
- OpenAPI UI: `http://localhost:7788/openapi`

## 常用命令

根目录常用命令：

```bash
# dev
bun run dev
bun run dev:console
bun run dev:nexus

# build
bun run build
bun run build:console

# quality
bun run lint
bun run lint:fix
bun run format
bun run format:check
bun run type-check
```

在包目录内也可以执行：

```bash
cd packages/console
bun run dev
bun run build
bun run preview
bun run lint
bun run lint:fix
bun run format
bun run format:check
bun run type-check
```

## 包结构

`packages/console/` 结构大致如下：

```text
packages/console/
├── public/
├── src/
├── AGENTS.md
├── eslint.config.js
├── prettier.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── package.json
```

核心源码目录：

```text
src/
├── assets/
├── app/
├── components/
├── config/
├── hooks/
├── i18n/
├── layout/
├── modules/
├── pages/
├── stores/
├── types/
└── utils/
```

其中当前重点目录为：

- `src/app/router`
  - TanStack Router 路由树、重定向与路由元信息
- `src/app/query-client.ts`
  - QueryClient 初始化
- `src/app/navigation`
  - 独立导航配置
- `src/modules/auth`
  - session API、auth query 与 auth store

当前与本轮实现直接相关的目录还有：

- `src/pages/example`
  - 示例页入口，承接组件主题展示、Markdown 演示与图片裁剪
- `src/assets/styles/theme`
  - Catppuccin 主题变量、暗色变体与语义色定义
- `src/components/ui/markdown`
  - Markdown 渲染器、目录、高亮与主题能力

## 开发约定

### 共享工程配置

本包不单独维护一套工程规范，默认遵循仓库统一配置：

- ESLint / Prettier 来自 `@xdd-zone/eslint-config`
- TypeScript 基础配置来自根目录 `tsconfig.base.json`
- 根目录 `eslint.config.js` 统一处理全局忽略项

### 前后端协作方式

前端开发时，默认以前后端同仓协作为前提：

- 接口结构优先参考 `packages/nexus` 的接口定义 / OpenAPI
- 认证与权限行为以后端实现为准
- 页面联调优先通过根目录 `bun run dev` 完成
- 本地开发默认通过 `/api` 代理到 `nexus`
- Better Auth 需要信任前端来源，例如 `http://localhost:2333`

### 主题与构建约定

当前主题与构建策略遵循以下原则：

- `data-theme` 始终写入实际 Catppuccin 主题 ID
  - `latte`
  - `frappe`
  - `macchiato`
  - `mocha`
- Ant Design 主题统一通过 `getAntdThemeConfig(...)` 注入，避免页面各自拼装 token
- Tailwind 与 CSS 组件样式优先使用 `--color-*`、`--ctp-*` 语义变量
- Markdown 高亮只对白名单语言做动态加载，未支持语言回退到 `text`
- Vite 手动分包优先拆分 React、Ant Design、TanStack、i18n、Zustand 等基础依赖

### 验证建议

改动完成后，至少执行：

```bash
bun run lint
bun run type-check
bun run build
```

只改前端时也可以执行：

```bash
bun run lint:console
bun run --filter @xdd-zone/console type-check
bun run build:console
```

如果改动涉及联调，还应确认：

- 页面能正常访问后端接口
- 登录与路由 `beforeLoad` 行为正确
- 菜单、主题、标签页状态没有回退
- 刷新页面后能通过 `/api/auth/get-session` 恢复登录态
- `/ui-showcase` 与 `/markdown-example` 能正常访问
- 切换 Catppuccin 主题后，菜单、抽屉、认证页与示例页样式一致

## 文档入口

- [仓库根 README](../../README.md)
- [Console 前端指南](../../docs/console.md)
- [架构说明](../../docs/architecture.md)
- [开发指南](../../docs/development.md)
- [API 指南](../../docs/api.md)
