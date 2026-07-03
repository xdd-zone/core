# AGENTS.md

为 XDD Zone Core 代码库提供工作规则。AI 代理在这个仓库里执行任务时，按这份文件处理。

## 项目概况

这是一个 `pnpm + Turborepo + React + Hono + Next.js` 的 monorepo，当前主要目录有：

- `@xdd-zone/fifa`
  前端控制台，放在 `apps/fifa`。
- `@xdd-zone/momo`
  Hono API 服务，放在 `apps/momo`。
- `@xdd-zone/bobo`
  个人站点，放在 `apps/bobo`。
- `@xdd-zone/contracts`
  Fifa 和 Momo 共用的接口约定，放在 `packages/contracts`。
- `@xdd-zone/catppuccin-theme`
  Fifa 和 Bobo 共用的 Catppuccin 主题，放在 `packages/catppuccin-theme`。
- `@xdd-zone/eslint-config`
  共享 ESLint / Prettier 配置，放在 `packages/eslint-config`。

## 必须先做的技能调用

### 1. 涉及 `apps/momo`，先调用 `xdd-honojs`

适用范围：

- 接口、路由、模块、插件、中间件
- `model`、`service`、`repository`、`types`、`constants`
- `bootstrap`、`config`、`infra`
- `apps/momo` 里的测试、说明文档、代码审查

执行规则：

- 只要目标在 `apps/momo`，第一步就是调用 `xdd-honojs`。

### 2. 涉及 README、`docs/`、注释、JSDoc、错误提示、提示词，先调用 `xdd-plain-docs`

执行规则：

- 只要任务里出现说明性文本编写或改写，第一步就是调用 `xdd-plain-docs`。
- 文案只描述当前实现。
- 文案要写清用途、位置、使用方式、输入输出和返回结果。
- 同一任务里发现术语不统一、重复表达、风格不一致，只整理当前任务碰到的范围。

### 3. 涉及 `apps/fifa` 的界面开发，先读设计规范，再调用 `frontend-design`

执行规则：

1. 先看 `docs/apps/fifa-design.md`
2. 再调用 `frontend-design`
3. 再继续页面、布局、导航和展示型组件实现

### 4. 涉及 `apps/bobo` 的界面开发，先读 `docs/apps/bobo.md`，再调用 `frontend-design`

适用范围：

- 页面、布局、展示区块、落地页和视觉样式
- App Router 页面文件
- 主题变量和全局样式

执行规则：

1. 先看 `docs/apps/bobo.md`
2. 再看当前要改的页面、布局和样式文件
3. 再调用 `frontend-design`

## 如果漏掉规则怎么办

一旦发现顺序错了，立刻停下，先补做正确步骤，再继续当前任务。

例如：

- 进了 `apps/momo` 但没先调 `xdd-honojs`，先补调。
- 改了文档但没先调 `xdd-plain-docs`，先补调。
- 改了 Fifa UI 但没先看 `docs/apps/fifa-design.md`，先补看。
- 改了 Bobo UI 但没先看 `docs/apps/bobo.md`，先补看。

## 文档读取顺序

涉及项目约定、模块结构、开发流程、接口组织或文档编写时，先按这个顺序读：

1. 仓库根目录 `AGENTS.md`
2. `docs/` 里和当前任务最相关的文档
3. 目标包自己的 README
4. 如果是 Fifa 界面任务，再读 `docs/apps/fifa-design.md`
5. 如果是 Bobo 站点任务，再读 `docs/apps/bobo.md`

常用入口：

- `README.md`
- `docs/development.md`
- `docs/architecture.md`
- `docs/topics/api.md`
- `docs/apps/fifa.md`
- `docs/apps/bobo.md`
- `docs/topics/theme.md`

## 需求完成后的文档同步检查

代码或配置改完后，结束前必须检查是否需要同步项目文档。

只要本次改动碰到下面任意内容，就要检查相关文档：

- 新增、删除或修改接口路径、请求参数、响应结构或错误码。
- 新增、删除或修改环境变量、启动命令、构建命令、seed 脚本或数据库命令。
- 新增、删除或移动目录、模块、页面、组件入口、路由入口或包导出。
- 新增、删除或修改数据库 schema、migration、表名、字段名或 seed 数据。
- 新增、删除或修改第三方服务接入、OAuth Provider、文件存储、短信、邮件或外部 API。
- 修改前端页面路径、菜单、登录方式、权限规则、主题入口或公开配置。
- 修改会影响其他包调用方式的共享类型、schema、工具函数或包名。

检查顺序：

1. 先用 `rg` 搜当前改动涉及的接口名、目录名、命令名、环境变量名、Provider 名或表名。
2. 再看这些文档里是否还有旧说法：
   - `README.md`
   - `docs/index.md`
   - `docs/architecture.md`
   - `docs/development.md`
   - `docs/testing.md`
   - `docs/topics/api.md`
   - `docs/topics/theme.md`
   - `docs/apps/<app>.md`
   - `docs/integrations/**`
   - 目标包自己的 `README.md`
3. 如果文档写了旧路径、旧命令、旧接口、旧环境变量或旧状态，必须在同一个任务里改掉。
4. 如果本次改动不影响文档，最终回复里写明“未发现需要同步的项目文档”。

文档同步规则：

- 只改和本次需求直接相关的文档。
- 不为了补文档重写整篇文档。
- 不把设计草稿改成当前实现说明。设计草稿如果已经过期，只更新正式项目文档。
- 文档改动前必须先调用 `xdd-plain-docs`。
- 文档改完后至少运行 `git diff --check`。
- 只改 Markdown 时，优先运行：

```bash
pnpm exec prettier --check <改过的 md 文件>
```

## 代码组织规则

### Momo

规则：

- 当前是 Hono API 服务。
- Node 启动入口放在 `apps/momo/src/index.ts`。
- Hono app 组装放在 `apps/momo/src/bootstrap/create-app.ts`。
- `apps/momo/src/app.ts` 只创建运行时 app，给测试和包导出使用。
- 一级路由挂载放在 `apps/momo/src/routes/index.ts`。
- 业务模块放在 `apps/momo/src/modules/<module>`。
- 路由处理函数直接返回 Hono response。
- 新增接口按 `docs/apps/momo.md` 放到对应模块。
- 非生成的 Drizzle schema 字段都要补 TS 简易注释。生成文件不手动补注释。
- 需要分组时优先用 Hono 的 `app.route()` 或 `basePath()`。
- 保留 `AppType` 的类型推导，不要破坏前端可复用的路由类型。

### Fifa

规则：

- 页面按模块放在 `apps/fifa/src/features/<module>`。
- 页面组件放在 `apps/fifa/src/features/<module>/pages`。
- 模块页面记录放在 `apps/fifa/src/features/<module>/routes.tsx`。
- 新模块要加到 `apps/fifa/src/app/router/records.ts`。
- `apps/fifa/src/app/router/routes.tsx` 从页面记录生成路由树。
- `apps/fifa/src/app/navigation/navigation.ts` 从页面记录生成菜单。
- 当前前端保留基础控制台框架和固定示例页。
- 当前前端没有接入 Momo 业务接口。

### Bobo

规则：

- 当前是 `Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript` 的个人站点。
- 包名是 `@xdd-zone/bobo`，目录是 `apps/bobo`。
- 页面入口放在 `apps/bobo/app`，使用 App Router。
- `apps/bobo/app/layout.tsx` 管全局布局、字体、metadata 和主题初始化。
- `apps/bobo/app/(site)/page.tsx` 是首页，URL 仍然是 `/`。
- `apps/bobo/app/(lab)/lab` 放样式演示、主题验证和临时页面，URL 仍然是 `/lab`。
- 全局样式入口是 `apps/bobo/app/globals.css`。
- Catppuccin 主题变量从 `@xdd-zone/catppuccin-theme/styles/bobo.css` 引入。
- 组件优先放在 `apps/bobo/components`，通用函数放在 `apps/bobo/lib`。
- 主题色使用 `data-theme` 和 Tailwind 语义类名。
- 页面和组件里优先使用语义类名，不直接散写颜色变量。
- 没有明确复用前，不为了形式拆组件。
- App Router 默认写服务端组件。只有确实需要浏览器 API、交互状态或事件处理时，才加 `'use client'`。
- 具体维护规则看 `docs/apps/bobo.md`。

### 共享配置

规则：

- 共享 ESLint / Prettier 配置放在 `packages/eslint-config`。
- 共享 Catppuccin 主题放在 `packages/catppuccin-theme`。
- 依赖版本优先放在 `pnpm-workspace.yaml` 的 `catalog` 或 `catalogs`。
- 子包依赖优先写 `catalog:`、`catalog:react`、`catalog:vite`、`catalog:shiki` 或 `workspace:*`。
- 不把包名改成 `web`、`admin`、`api`。

## 构建与检查命令

### 根目录

```bash
# 安装
pnpm install

# 开发
pnpm dev
pnpm dev:fifa
pnpm dev:momo
pnpm dev:bobo

# 构建
pnpm build
pnpm build:fifa
pnpm build:momo
pnpm build:bobo

# 检查
pnpm lint
pnpm lint:bobo
pnpm lint:fix
pnpm format
pnpm format:check
pnpm type-check
pnpm type-check:bobo

# 清理子包构建产物
pnpm clean
```

### `apps/momo`

```bash
cd apps/momo

pnpm dev
pnpm build
pnpm type-check
pnpm test
```

### `apps/fifa`

```bash
cd apps/fifa

pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm type-check
```

### `apps/bobo`

```bash
cd apps/bobo

pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm type-check
```

## 文案规则

- 统一用自然、直接、清楚的中文。
- 只写当前实现。
- 优先写清“用于什么、放在哪里、什么时候使用、怎么调用、返回什么”。
- 避免黑话和抽象口号。
- 如果一句话能说清，就不要写成一大段。

## 常用技能顺序

- 文档任务：`xdd-plain-docs`
- Momo 任务：`xdd-honojs`
- Fifa 界面任务：先读 `docs/apps/fifa-design.md`，再用 `frontend-design`
- Fifa 界面 + 文案任务：先读 `docs/apps/fifa-design.md`，再用 `frontend-design`，最后用 `xdd-plain-docs`
- Bobo 界面任务：先读 `docs/apps/bobo.md`，再用 `frontend-design`
- Bobo 界面 + 文案任务：先读 `docs/apps/bobo.md`，再用 `frontend-design`，最后用 `xdd-plain-docs`
