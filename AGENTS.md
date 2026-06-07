# AGENTS.md

为 XDD Zone Core 代码库提供工作规则。AI 代理在这个仓库里执行任务时，按这份文件处理。

## 项目概况

这是一个 `pnpm + Turborepo + React + Hono` 的 monorepo，当前主要目录有：

- `@xdd-zone/console`
  前端控制台，放在 `apps/console`。
- `@xdd-zone/nexus`
  Hono API 服务，放在 `apps/nexus`。
- `@xdd-zone/eslint-config`
  共享 ESLint / Prettier 配置，放在 `packages/eslint-config`。

## 必须先做的技能调用

### 1. 涉及 `apps/nexus`，先调用 `xdd-honojs`

适用范围：

- 接口、路由、模块、插件、中间件
- `model`、`service`、`repository`、`types`、`constants`
- `bootstrap`、`config`、`infra`
- `apps/nexus` 里的测试、说明文档、代码审查

执行规则：

- 只要目标在 `apps/nexus`，第一步就是调用 `xdd-honojs`。

### 2. 涉及 README、`docs/`、注释、JSDoc、错误提示、提示词，先调用 `xdd-plain-docs`

执行规则：

- 只要任务里出现说明性文本编写或改写，第一步就是调用 `xdd-plain-docs`。
- 文案只描述当前实现。
- 文案要写清用途、位置、使用方式、输入输出和返回结果。
- 同一任务里发现术语不统一、重复表达、风格不一致，只整理当前任务碰到的范围。

### 3. 涉及 `apps/console` 的界面开发，先读设计上下文，再调用 `frontend-design`

执行规则：

1. 先看 `apps/console/design-context.md`
2. 再调用 `frontend-design`
3. 再继续页面、布局、导航和展示型组件实现

## 如果漏掉规则怎么办

一旦发现顺序错了，立刻停下，先补做正确步骤，再继续当前任务。

例如：

- 进了 `apps/nexus` 但没先调 `xdd-honojs`，先补调。
- 改了文档但没先调 `xdd-plain-docs`，先补调。
- 改了 Console UI 但没先看 `apps/console/design-context.md`，先补看。

## 文档读取顺序

涉及项目约定、模块结构、开发流程、接口组织或文档编写时，先按这个顺序读：

1. 仓库根目录 `AGENTS.md`
2. `docs/` 里和当前任务最相关的文档
3. 目标包自己的 README
4. 如果是 Console 界面任务，再读 `apps/console/design-context.md`

常用入口：

- `README.md`
- `docs/development.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/console.md`
- `docs/theme.md`

## 代码组织规则

### Nexus

规则：

- 当前是基础 Hono 示例服务。
- Hono app、示例接口和 Node 启动入口放在 `apps/nexus/src/index.ts`。
- 路由处理函数直接返回 Hono response。
- 新增接口优先放在 `apps/nexus/src/index.ts`，除非代码已经拆出模块。
- 需要分组时优先用 Hono 的 `app.route()` 或 `basePath()`。
- 如果拆模块，保留 `AppType` 的类型推导，不要破坏前端可复用的路由类型。

### Console

规则：

- 页面按模块放在 `apps/console/src/features/<module>`。
- 页面组件放在 `apps/console/src/features/<module>/pages`。
- 模块页面记录放在 `apps/console/src/features/<module>/routes.tsx`。
- 新模块要加到 `apps/console/src/app/router/records.ts`。
- `apps/console/src/app/router/routes.tsx` 从页面记录生成路由树。
- `apps/console/src/app/navigation/navigation.ts` 从页面记录生成菜单。
- 当前前端保留基础控制台框架和固定示例页。
- 当前前端没有接入 Nexus 业务接口。

### 共享配置

规则：

- 共享 ESLint / Prettier 配置放在 `packages/eslint-config`。
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
pnpm dev:console
pnpm dev:nexus

# 构建
pnpm build
pnpm build:console
pnpm build:nexus

# 检查
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm type-check

# 清理子包构建产物
pnpm clean
```

### `apps/nexus`

```bash
cd apps/nexus

pnpm dev
pnpm build
pnpm type-check
pnpm test
```

### `apps/console`

```bash
cd apps/console

pnpm dev
pnpm build
pnpm preview
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
- Nexus 任务：`xdd-honojs`
- Console 界面任务：先读 `apps/console/design-context.md`，再用 `frontend-design`
- Console 界面 + 文案任务：先读 `apps/console/design-context.md`，再用 `frontend-design`，最后用 `xdd-plain-docs`
