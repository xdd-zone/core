# XDD Zone Console

`@xdd-zone/console` 是 XDD Zone Core monorepo 中的后台管理前端，负责承载管理后台页面、交互、路由、主题与联调入口。

它与 `@xdd-zone/nexus` 的关系可以概括为：

```text
packages/nexus
  -> 提供 API / OpenAPI / 认证能力
packages/console
  -> 调用接口并提供后台界面
```

## 包定位

`@xdd-zone/console` 负责：

- 管理后台页面与布局
- 前端路由、导航与标签页组织
- 认证请求、会话缓存与登录态处理
- 状态管理、主题切换、国际化
- 与后端 API 的联调与展示
- 基于 `nexus` session 的登录、登出与会话恢复流程

不负责：

- 维护服务端接口定义
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
  - 后端 API、认证、权限与 OpenAPI
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

- 仪表盘：`/dashboard`
  - 登录后的默认落点，当前显示仪表盘占位内容
- 内容管理：`/articles`、`/categories`、`/tags`、`/comments`、`/article-settings`
  - 当前保留内容管理页面入口
- 系统管理：`/users`、`/roles`
  - 用于查看用户列表和角色列表
- 用户详情与权限操作：`/users/:id`、`/users/:id/edit`、`/users/:id/access`
  - 由用户列表和用户详情页的操作按钮进入
- 当前用户：`/profile`、`/my-access`
  - 用于维护当前登录用户资料，以及查看当前用户角色和权限
- 功能示例：`/ui-showcase`、`/markdown-example`、`/image-crop`
  - 用于验证主题、Markdown 和图片裁剪相关界面

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
- OpenAPI 页面: `http://localhost:7788/openapi`

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
- `src/modules/user`
  - 用户列表、用户详情、当前用户资料与更新请求
- `src/modules/rbac`
  - 角色列表、用户角色、用户权限与分配角色请求
- `src/pages/user`
  - 用户列表、详情、编辑、当前用户资料和指定用户权限页面
- `src/pages/role`
  - 角色列表页
- `src/pages/access`
  - 当前登录用户权限页
- `src/pages/example`
  - 示例页入口，包含组件主题展示、Markdown 演示与图片裁剪
- `src/assets/styles/theme`
  - Catppuccin 主题变量、暗色变体与语义色定义
- `src/components/ui/markdown`
  - Markdown 渲染器、目录、高亮与主题能力

## 开发约定

### 设计上下文与技能顺序

`packages/console` 的界面设计上下文统一放在：

- `packages/console/.impeccable.md`

只要任务涉及 React 组件、页面、布局、导航、展示型业务组件或其他界面调整，开始开发前按下面顺序执行：

1. 先读取 `packages/console/.impeccable.md`
2. 先调用 `frontend-design` 技能
3. 再继续页面、组件和样式实现

如果后续还需要继续调整布局、说明文案、排版或界面收尾，再继续调用对应设计技能。

不要跳过 `packages/console/.impeccable.md` 直接开始写界面，也不要临时另起一套和当前后台不一致的风格。

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
- 用户与权限相关请求统一放在 `src/modules/user` 和 `src/modules/rbac`

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
- 侧边栏和头像菜单能进入 `/users`、`/roles`、`/profile`、`/my-access`
- 用户详情、编辑和权限管理页面能正常加载并提交操作
- 菜单、主题、标签页状态没有回退
- 刷新页面后能通过 `/api/auth/get-session` 恢复登录态
- `/ui-showcase`、`/markdown-example` 与 `/image-crop` 能正常访问
- 切换 Catppuccin 主题后，菜单、抽屉、认证页与示例页样式一致

## 文档入口

- [仓库根 README](../../README.md)
- [Console 前端指南](../../docs/console.md)
- [架构说明](../../docs/architecture.md)
- [开发指南](../../docs/development.md)
- [API 指南](../../docs/api.md)
