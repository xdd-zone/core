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
- 前端路由与菜单组织
- 状态管理、主题切换、国际化
- 与后端 API 的联调与展示

不负责：

- 维护服务端接口定义的唯一来源
- 维护独立于 monorepo 的工程配置体系

## 技术栈

- Bun 1.3.5
- React 19
- TypeScript 5.9
- Vite 7
- React Router 7
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
├── components/
├── config/
├── hooks/
├── i18n/
├── layout/
├── pages/
├── router/
├── stores/
├── types/
└── utils/
```

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

### 验证建议

改动完成后，至少执行：

```bash
bun run lint
bun run type-check
bun run build
```

如果改动涉及联调，还应确认：

- 页面能正常访问后端接口
- 登录与路由守卫行为正确
- 菜单、主题、持久化状态没有回退

## 文档入口

- [仓库根 README](/Users/wuwanzhu/Code/xdd/core/README.md)
- [架构说明](/Users/wuwanzhu/Code/xdd/core/docs/architecture.md)
- [开发指南](/Users/wuwanzhu/Code/xdd/core/docs/development.md)
- [API 指南](/Users/wuwanzhu/Code/xdd/core/docs/api.md)
