# XDD Zone Core

一个面向个人站点的内容管理系统。用 pnpm workspace + Turborepo 把前端控制台（Fifa）、Hono API（Momo）、公开站点（Bobo）和共享包放在一个 monorepo 里。

---

## 有哪些包

| 包名 | 位置 | 干嘛的 |
| ---- | ---- | ---- |
| `@xdd-zone/fifa` | `apps/fifa` | 前端控制台，写文章、管素材、配站点 |
| `@xdd-zone/momo` | `apps/momo` | Hono API 服务，后台和公开接口都在这 |
| `@xdd-zone/bobo` | `apps/bobo` | 公开个人站点，对外展示文章和项目 |
| `@xdd-zone/contracts` | `packages/contracts` | 三端共用的接口 schema、类型和错误码 |
| `@xdd-zone/catppuccin-theme` | `packages/catppuccin-theme` | Fifa 和 Bobo 共用的 Catppuccin 主题 |
| `@xdd-zone/eslint-config` | `packages/eslint-config` | 共享 ESLint / Prettier 配置 |

---

## 技术栈

- 运行环境：Node.js 24+ · pnpm 11 · Turborepo 2 · TypeScript 5
- Fifa：React 19 + Vite 8
- Momo：Hono 4
- Bobo：Next.js 16
- 工具链：ESLint 10 + Prettier 3

依赖版本统一写在根目录 `pnpm-workspace.yaml` 的 catalog，子包用 `catalog:` 和 `workspace:*` 引用。

---

## 跑起来

```bash
pnpm install
pnpm dev          # 一次起三个服务
```

| 服务 | 地址 |
| ---- | ---- |
| Fifa | `http://localhost:2333` |
| Momo | `http://localhost:7788` |
| Bobo | `http://localhost:4399` |
| Health | `http://localhost:7788/health` |

只想起一个：`pnpm dev:fifa`、`pnpm dev:momo`、`pnpm dev:bobo`。

起完 Momo 后确认接口活着：

```bash
curl http://localhost:7788/health
```

更多命令：

```bash
# 构建
pnpm build
pnpm build:fifa
pnpm build:momo
pnpm build:bobo

# Docker
pnpm docker:up        # 部署或更新，等同 ./docker/deploy.sh
pnpm docker:down      # 停容器，保留数据 volume
pnpm docker:deps:up   # 只起 PostgreSQL / Valkey / Meilisearch
pnpm docker:logs

# 检查
pnpm type-check
pnpm lint
pnpm format:check

# 清理构建产物
pnpm clean
```

---

## Docker 部署

Docker 文件放在 `docker/`。首次部署和后续更新都跑同一个脚本：

```bash
./docker/deploy.sh    # 等同 pnpm docker:up
```

首次执行会创建权限 `0600` 的 `docker/.env`，生成服务凭证，并建一个默认邮箱 `owner@xdd.zone` 的 Fifa owner。启动后终端会打出本次生成的凭证和 owner 一次性密码。再次执行复用现有 `.env`、owner 和 volume，不重置密码或数据。

服务默认绑 `127.0.0.1`，域名和 TLS 交给外部反向代理。只给本机 `pnpm dev` 起依赖时用 `pnpm docker:deps:up`，日志服务按需 `pnpm docker:observability:up`。细节看 [docs/development.md](./docs/development.md)。

---

## 改哪里

| 想改什么 | 先看这里 |
| ---- | ---- |
| 后端接口 | [docs/apps/momo.md](./docs/apps/momo.md) · `apps/momo/src/modules` |
| 前端控制台 | [docs/apps/fifa.md](./docs/apps/fifa.md) · `apps/fifa/src/features` |
| 个人站点 | [docs/apps/bobo.md](./docs/apps/bobo.md) · `apps/bobo/app` |
| 接口约定 | `packages/contracts` |
| 主题 | [docs/topics/theme.md](./docs/topics/theme.md) · `packages/catppuccin-theme` |

新增接口按模块放到 `apps/momo/src/modules/<module>`，再到 `apps/momo/src/routes/index.ts` 挂载。Fifa 页面按模块放到 `apps/fifa/src/features/<module>`。完整规则在对应 docs 里。

---

## 文档入口

先看 [docs/index.md](./docs/index.md)，它会告诉你按当前任务读哪几份。常用的：

| 文档 | 讲什么 |
| ---- | ---- |
| [docs/development.md](./docs/development.md) | 本地开发、端口、Docker 部署 |
| [docs/architecture.md](./docs/architecture.md) | 整体架构和模块边界 |
| [docs/topics/api.md](./docs/topics/api.md) | 完整接口清单和响应格式 |
| [docs/apps/momo.md](./docs/apps/momo.md) | Momo 后端目录和新增接口规则 |
| [docs/apps/fifa.md](./docs/apps/fifa.md) | Fifa 控制台开发规则 |
| [docs/apps/bobo.md](./docs/apps/bobo.md) | Bobo 个人站点开发规则 |

接口清单以 [docs/topics/api.md](./docs/topics/api.md) 为准，README 不再单独维护。AI 代理在这个仓库干活，先读 [AGENTS.md](./AGENTS.md)。

---

## 提交前检查

```bash
pnpm format:check
pnpm lint
pnpm type-check
```

---

## 许可

本仓库使用 MIT 许可。
