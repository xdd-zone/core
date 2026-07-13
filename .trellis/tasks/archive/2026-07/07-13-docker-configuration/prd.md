# 规范 Docker 配置

## 目标

把 Docker 文件从 `apps/momo` 整理到仓库级 `docker/`。本地和线上使用同一套 Compose 结构，三个应用都有生产镜像；运行参数由未提交的 `docker/.env` 或平台环境变量提供。

## 已确认事实

- 仓库使用 pnpm workspace 和 Turborepo，应用为 `apps/momo`、`apps/fifa`、`apps/bobo`。
- 当前只有 `apps/momo/compose.yaml` 与 `apps/momo/compose.observability.yaml`。前者启动 PostgreSQL、Valkey、Meilisearch，后者启动 Loki、Alloy。
- Loki 和 Alloy 配置位于 `apps/momo/infra/observability/`；Momo 的 `local:*` 和 `logs:*` 脚本直接引用旧 Compose 文件。
- Momo 有 `/health`。Alloy 当前按 Compose service 名 `momo` 采集 Docker 日志。
- Fifa 使用 Vite 构建静态文件；Bobo 使用 Next.js；Momo 使用 Node.js Hono 服务。
- 仓库没有 Dockerfile、`.dockerignore`、仓库级 Docker 目录或统一 Docker 命令。

## 已决定

- Momo、Fifa、Bobo 全部容器化，镜像只用于完整运行环境，不提供 Docker 热更新开发。
- 不兼容旧 Docker 路径、文件名或 npm 脚本。旧文件和引用全部删除或迁移。
- Compose 不管理反向代理、域名、TLS 证书。外部部署环境把请求转发到应用端口。
- 完整 Compose 默认启动 PostgreSQL、Valkey、Meilisearch、Loki 和 Alloy。运行时可用环境变量改连外部托管服务。
- 仓库提交 `docker/.env.example`，忽略 `docker/.env`。Docker Compose 启动时显式传入该文件；平台可用同名环境变量覆盖它。

## 需求

- 建立统一 Docker 目录，分别存放 Compose、应用镜像、可观测性配置和环境变量模板。
- 为三个应用提供可构建、可运行的多阶段镜像。构建上下文固定为仓库根目录，能解析 workspace 依赖。
- 保留 PostgreSQL、Valkey、Meilisearch、Loki、Alloy 和 Momo 本地文件存储的数据持久化。
- Compose 使用具名网络、具名 volume、healthcheck 和最小的默认端口绑定。观测服务可按 profile 启动。
- 添加根目录 Docker 命令，覆盖依赖服务、完整环境、观测服务、停止和日志查看。
- 将 Momo 数据库 migration 放进完整环境的启动顺序，只有 migration 成功后才启动 Momo。
- 同步项目文档和环境变量示例；不提交真实凭证。

## 验收条件

- [x] `docker/` 的目录规则、运行方式和环境变量入口有文档说明。
- [x] `docker compose --env-file docker/.env -f docker/compose.yaml config` 通过。
- [x] Momo、Fifa、Bobo 镜像可以从仓库根目录构建。
- [x] 完整环境能按依赖 healthcheck 执行 migration 后启动三个应用。
- [x] PostgreSQL、Valkey、Meilisearch、Loki 和 Momo 本地素材使用具名 volume 保存数据。
- [x] Alloy 继续采集 `momo` 容器日志并写入 Loki，且只在 `observability` profile 启动。
- [x] 旧 Compose、观测配置、Momo `local:*` / `logs:*` 脚本及旧文档引用已移除。
- [x] 变更后按顺序通过 `pnpm type-check`、`pnpm lint`、`pnpm format:check`；Docker 配置通过 Compose 语法校验。

## 验证记录

- Prod Compose 已启动，`momo-migrate` 退出码为 0。
- `GET /health` 返回 `env=production`；Momo、Fifa、Bobo 分别返回 200。
- Loki `/ready` 返回 `ready`；查询 `{service="momo"}` 能拿到 production 日志。
- Momo 测试 34 个文件、287 项全部通过。

## 非目标

- 不提供 Docker 热更新、源码挂载或开发容器。
- 不加入 Nginx、Caddy、域名路由、TLS 证书签发或续期。
- 不引入 Kubernetes、Helm、CI/CD 发布流程或新的云服务。
- 不迁移现有业务数据和 Docker volumes。
