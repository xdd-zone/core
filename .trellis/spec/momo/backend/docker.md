# Docker 运行规则

## 1. 范围

触发条件：新增或修改 Momo、Fifa、Bobo 的镜像、`docker/compose.yaml`、Docker 环境变量或 Momo Docker migration。

Docker 专用文件只放仓库根目录 `docker/`。不要在 `apps/*` 新增 Compose 文件或运行环境配置。

## 2. 命令

- 完整环境：`pnpm docker:up`。
- 本机开发依赖：`pnpm docker:deps:up`。
- 观测服务：`pnpm docker:observability:up`。
- Compose 校验：`docker compose --env-file docker/.env -f docker/compose.yaml config`。
- Docker migration：`pnpm --filter @xdd-zone/momo db:migrate:docker`。

## 3. 配置约定

- 提交 `docker/.env.example`，忽略 `docker/.env`。平台环境变量可覆盖同名值。
- `VITE_*` 只在 Fifa 镜像构建时传入，不能包含密钥。
- Momo、Bobo 的密钥和连接地址在 Compose `environment` 中运行时传入。
- 默认容器地址使用 service hostname：PostgreSQL 是 `postgres`，缓存是 `valkey`，搜索是 `meilisearch`，Bobo 访问 Momo 使用 `http://momo:7788`。

## 4. 校验与失败

| 条件 | 结果 |
| --- | --- |
| 缺少 `docker/.env` | Docker 命令失败；先从 `.env.example` 复制。 |
| PostgreSQL 未通过 healthcheck | `momo-migrate` 不启动。 |
| migration 失败 | `momo` 不启动。 |
| Fifa 公开地址改变 | 必须重新构建 Fifa 镜像。 |

## 5. 场景

- 正常：复制模板后运行 `pnpm docker:up`，migration 成功，三个应用启动。
- 本机开发：运行 `pnpm docker:deps:up`，再运行 `pnpm dev`。
- 错误：不在 Momo 容器启动命令中隐式执行 migration；失败原因会被隐藏，重试也不可控。

## 6. 必要检查

- `docker compose --env-file docker/.env -f docker/compose.yaml config`。
- `docker compose --env-file docker/.env -f docker/compose.yaml build momo fifa bobo`。
- `pnpm type-check`、`pnpm lint`、`pnpm format:check`。

## 7. 错误与正确做法

错误：在 `apps/momo/compose.yaml` 添加本地服务，或把真实密码提交到 `.env`。

正确：修改 `docker/compose.yaml` 和 `docker/.env.example`，真实值只保存在 `docker/.env` 或部署平台密钥配置中。
