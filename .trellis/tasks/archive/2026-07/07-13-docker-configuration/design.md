# Docker 配置设计

## 目录

所有 Docker 专用文件放在仓库根目录 `docker/`，避免应用目录同时承担业务代码和部署编排。

```text
docker/
├── compose.yaml
├── .env.example
├── images/
│   ├── momo.Dockerfile
│   ├── fifa.Dockerfile
│   └── bobo.Dockerfile
├── nginx/
│   └── fifa.conf
└── observability/
    ├── alloy-config.alloy
    └── loki-config.yaml
```

根目录 `.dockerignore` 控制三个镜像共用的构建上下文。应用 Dockerfile 集中在 `docker/images/`，但每个 Docker build 的 context 都是仓库根目录，Dockerfile 通过 `-f docker/images/<app>.Dockerfile` 指定。

`docker/.env.example` 只放 Compose 变量、默认开发密码和示例密钥。`docker/.env` 被 Git 忽略。命令统一使用 `--env-file docker/.env`；shell 或部署平台中已经存在的同名变量优先级更高。

## 服务边界

`docker/compose.yaml` 管理以下服务：

| 服务 | 职责 | 默认启动 |
| --- | --- | --- |
| `postgres` | Momo PostgreSQL 数据库 | 是 |
| `valkey` | Momo Redis 协议缓存 | 是 |
| `meilisearch` | Momo 搜索索引 | 是 |
| `momo-migrate` | 执行 Drizzle migration 后退出 | 是 |
| `momo` | Hono API | 是 |
| `fifa` | 构建后的管理端静态站点 | 是 |
| `bobo` | Next.js 公开站点 | 是 |
| `loki` | 结构化运行日志存储 | `observability` profile |
| `alloy` | 采集 Momo 容器日志 | `observability` profile |

Compose 不包含公网入口。应用端口的宿主机绑定地址和端口都由 `docker/.env` 控制，默认绑定 `127.0.0.1`，供宿主机上的外部反向代理访问。PostgreSQL、Valkey 和 Meilisearch 也保留本地回环地址端口，方便继续用 `pnpm dev` 和数据库工具连接。

所有服务加入 `xdd-core` 网络。Momo 同时需要访问 OAuth、COS 和 LLM 等外部服务，因此网络不设为 internal。容器之间使用 service 名通信：Momo 使用 `postgres`、`valkey`、`meilisearch` 和可选的 `loki`；Bobo 运行时使用 `momo`；浏览器使用外部代理提供的公开地址。

## 镜像与启动顺序

- 三个 Dockerfile 使用多阶段构建，先用 pnpm 安装 workspace 依赖和构建目标应用，再复制最小运行产物到运行阶段。
- Momo 运行阶段使用非 root Node 用户，复制 `dist`、生产依赖、Drizzle migration 文件和启动所需配置。`momo-migrate` 使用同一构建定义的 migration target，包含执行 Drizzle migration 的工具。
- `momo` 依赖 PostgreSQL、Valkey、Meilisearch 的 healthcheck 与 `momo-migrate` 成功退出。`fifa` 和 `bobo` 依赖 Momo healthcheck。
- Fifa 的最终镜像使用 Nginx 仅提供已构建的 SPA 文件和前端路由 fallback。它不承担跨服务反向代理。
- Bobo 和 Momo 以 Node 运行时启动。Bobo 不使用开发服务器。
- Momo 本地素材目录挂载为具名 volume；数据库、搜索、Loki 和 Alloy 也各有具名 volume。Valkey 仅作缓存，不保留 volume。

## 配置流

```text
docker/.env 或部署平台变量
  -> Compose 变量插值与各服务 environment
  -> Momo / Fifa 构建参数 / Bobo 运行参数
  -> 服务间使用 Docker service hostname
```

`VITE_*` 是 Fifa 构建参数，构建时传入且不能保存密钥。Momo 和 Bobo 的敏感运行参数只通过 Compose environment 传入。Momo 的 `DATABASE_URL`、`CACHE_URL`、`MEILI_HOST` 和 `LOKI_URL` 在默认完整环境中指向 service hostname；改用托管服务时替换这些变量。

## 命令与迁移

根 `package.json` 增加 Docker 命令，调用同一份 Compose 文件：

- `docker:up` / `docker:down`：启动或停止完整环境。
- `docker:deps:up` / `docker:deps:down`：只启动或停止 PostgreSQL、Valkey、Meilisearch，供 `pnpm dev` 使用。
- `docker:observability:up` / `docker:observability:down`：用 `observability` profile 管理 Loki 和 Alloy。
- `docker:logs`：查看完整环境日志。

`momo-migrate` 每次完整环境启动都会执行迁移。失败时 `momo` 不启动；修复 migration 后重新执行 `docker:up`。不在应用容器启动脚本里隐式执行迁移，方便识别失败服务和重新运行。

## 迁移与回滚

删除 `apps/momo/compose.yaml`、`apps/momo/compose.observability.yaml` 与 `apps/momo/infra/observability/`，并从 Momo package scripts 中删除旧入口。卷名带 `xdd-core-` 前缀，避免与旧 `momo-*` volume 混用；旧卷不自动删除或迁移。

回滚代码时，恢复旧文件和 Momo 脚本即可。新 Compose 创建的数据卷不会被 `docker:down` 删除；需要清空环境时才显式使用 `docker compose ... down --volumes`。

## 文档同步

更新 `README.md`、`docs/development.md`、`docs/apps/momo.md`，说明 Docker 目录、命令、`.env` 文件、端口和旧配置移除情况。只改 Docker 相关段落。
