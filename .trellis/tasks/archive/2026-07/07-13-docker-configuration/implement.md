# Docker 配置实施清单

## 实现

- [x] 新增根 `.dockerignore`，排除 Git、依赖、构建产物、环境文件、运行数据和无关文档。
- [x] 新建 `docker/images/` 下的 Momo、Fifa、Bobo 多阶段 Dockerfile，以及 Fifa 静态文件服务器配置。
- [x] 新建 `docker/compose.yaml`，定义网络、具名 volumes、依赖服务、应用服务、migration 服务、healthcheck 和 `observability` profile。
- [x] 将 Loki 和 Alloy 文件移动到 `docker/observability/`，保留现有日志解析字段和服务筛选规则。
- [x] 新建 `docker/.env.example`，包含端口绑定、镜像标签、公开 URL、连接地址、示例密钥和可选外部服务变量。
- [x] 在 `.gitignore` 忽略 `docker/.env`，保留 `docker/.env.example`。
- [x] 修改根 `package.json`，增加统一 Docker 命令。
- [x] 修改 `apps/momo/package.json`，删除旧 `local:*`、`logs:*` 脚本；Compose migration 直接运行已安装的 Drizzle CLI。
- [x] 删除旧 Compose 和观测配置文件。
- [x] 同步 README、开发文档和 Momo 文档中的文件位置、启动命令与变量说明。

## 验证

按以下顺序执行：

1. [x] `cp docker/.env.example docker/.env`，只在本地创建临时配置。
2. [x] `docker compose --env-file docker/.env -f docker/compose.yaml config`。
3. [x] `docker compose --env-file docker/.env -f docker/compose.yaml build momo fifa bobo`。
4. [x] `docker compose --env-file docker/.env -f docker/compose.yaml up -d`，migration 退出 0，Momo/Fifa/Bobo 均启动并通过 health endpoint。
5. [x] `docker compose --env-file docker/.env -f docker/compose.yaml --profile observability up -d`，Loki ready，Alloy 日志查询返回 `service="momo"` 的 production 日志。
6. [x] `pnpm type-check`。
7. [x] `pnpm lint`。
8. [x] `pnpm format:check`。
9. [x] `git diff --check`。

## 风险与检查点

- Fifa 的 `VITE_*` 变量在镜像构建时写入静态文件。部署时改公开 API 地址必须重新构建 Fifa 镜像。
- Momo migration 依赖 PostgreSQL 就绪。首次启动失败时先查看 `momo-migrate` 日志，不要手动跳过 migration。
- 默认服务端口绑定在 `127.0.0.1`。外部代理若不运行在同一主机，需要把对应 `*_BIND_HOST` 改为可访问地址。
- 不执行 `down --volumes`，避免删除 PostgreSQL、Meilisearch、Loki 和本地素材数据。
- 旧 `momo-*` Docker volume 不自动导入新 `xdd-core-*` volume；按已决定的无兼容要求保留旧卷供手动处理。
