# Docker 运行规则

## 1. 范围

触发条件：新增或修改 Momo、Fifa、Bobo 的镜像、`docker/compose.yaml`、Docker 环境变量或 Momo Docker migration。

Docker 专用文件只放仓库根目录 `docker/`。不要在 `apps/*` 新增 Compose 文件或运行环境配置。

Momo 和 Bobo 的构建与运行镜像、Fifa 的构建镜像统一使用 `node:24-alpine`。

## 2. 命令

- 完整环境首次部署和更新：`./docker/deploy.sh`。`pnpm docker:up` 只调用这个脚本。
- 本机开发依赖：`pnpm docker:deps:up`。
- 观测服务：`pnpm docker:observability:up`。
- Compose 校验：`docker compose --env-file docker/.env -f docker/compose.yaml config`。
- Docker migration：Compose 在 `/workspace/apps/momo` 直接运行 `./node_modules/.bin/drizzle-kit migrate`。

## 3. 配置约定

- 提交 `docker/.env.example`，忽略 `docker/.env`。`docker/deploy.sh` 首次运行时创建 `.env` 并设为 `0600`，更新时不改文件内容。平台环境变量可覆盖同名值。
- `VITE_*` 只在 Fifa 镜像构建时传入，不能包含密钥。
- Momo、Bobo 的密钥和连接地址在 Compose `environment` 中运行时传入。
- `.dockerignore` 必须匹配所有层级的 `.env` 和 `.env.*`；生产镜像中不得出现应用环境文件。
- 默认容器地址使用 service hostname：PostgreSQL 是 `postgres`，缓存是 `valkey`，搜索是 `meilisearch`，Bobo 访问 Momo 使用 `http://momo:7788`。

## 4. 校验与失败

| 条件 | 结果 |
| --- | --- |
| 缺少 `docker/.env` | `docker/deploy.sh` 自动生成服务凭证并创建文件。 |
| 已有 `.env` 缺少必需值 | 部署失败并指出变量名，不自动替换或轮换。 |
| PostgreSQL 未通过 healthcheck | `momo-migrate` 不启动。 |
| migration 失败 | `momo` 不启动。 |
| owner 初始化失败 | `momo` 不启动，部署脚本输出 `momo-bootstrap` 日志。 |
| OAuth client ID 和 secret 只填一个 | Momo 环境变量校验失败。 |
| Fifa 公开地址改变 | 必须重新构建 Fifa 镜像。 |

## 5. 场景

- 正常：运行 `./docker/deploy.sh`，migration 和 owner 初始化成功后，三个应用启动。
- 本机开发：运行 `pnpm docker:deps:up`，再运行 `pnpm dev`。
- 错误：不在 Momo 容器启动命令中隐式执行 migration；失败原因会被隐藏，重试也不可控。

## 6. 必要检查

- `docker compose --env-file docker/.env -f docker/compose.yaml config`。
- `docker compose --env-file docker/.env -f docker/compose.yaml build momo fifa bobo`。
- `pnpm type-check`、`pnpm lint`、`pnpm format:check`。

## 7. 错误与正确做法

错误：在 `apps/momo/compose.yaml` 添加本地服务，或把真实密码提交到 `.env`。

正确：修改 `docker/compose.yaml` 和 `docker/.env.example`，真实值只保存在 `docker/.env` 或部署平台密钥配置中。

## 8. 场景：完整环境首次部署与更新

### 1. 范围与触发条件

- 修改 `docker/deploy.sh`、`docker/.env.example`、Momo Docker 环境变量、migration 或 owner 初始化顺序时，必须遵守本节。

### 2. 命令签名

```bash
./docker/deploy.sh
pnpm docker:up
```

两个命令执行同一段部署逻辑。生产主机只需要 Docker 和 Docker Compose v2。

Compose 启动顺序固定为：

```text
postgres healthy
  -> momo-migrate exited 0
  -> momo-bootstrap exited 0
  -> momo healthy
  -> fifa / bobo
```

### 3. 配置约束

首次部署生成并保存这些必需变量：

| 变量 | 格式 |
| --- | --- |
| `POSTGRES_PASSWORD` | 32 随机字节的小写 hex |
| `BETTER_AUTH_SECRET` | 32 随机字节的小写 hex |
| `MEILI_API_KEY` | 32 随机字节的小写 hex |
| `BOBO_REVALIDATE_SECRET` | 32 随机字节的小写 hex |
| `LLM_SECRET_KEY` | 32 随机字节的 base64 |

`DATABASE_URL` 使用同一个新生成的 `POSTGRES_PASSWORD`。已有 `.env` 中的密码和 URL 都原样保留。

`OWNER_EMAIL` 和 `OWNER_DISPLAY_NAME` 默认是 `owner@xdd.zone` 和 `Owner`。Docker 不传 `OWNER_PASSWORD`；新建 owner 时由 `seed:owner` 生成一次性密码。已有 `fifa.owner` 时只检查用户状态和 Better Auth `credential` 账号，不改密码、资料或初始内容。

GitHub 和 Google OAuth 的 client ID 与 client secret 必须成对填写。两个值都留空时关闭对应 Provider，email/password 登录继续启用。历史 `replace-with-*` 值按未配置处理。

### 4. 校验与错误表

| 条件 | 结果 |
| --- | --- |
| Docker 或 Compose 不可用 | 写入 `.env` 前失败。 |
| `docker/.env` 是符号链接 | 部署失败，不跟随链接。 |
| 已有 `.env` 的必需值为空 | 部署失败，不改文件。 |
| migration 返回非零 | `momo-bootstrap` 和 Momo 不启动。 |
| owner 状态不是 `active` 或缺少 `credential` | `momo-bootstrap` 返回非零，Momo 不启动。 |
| OAuth 只填 client ID 或 secret | 环境变量校验失败，Momo 不启动。 |
| 部署成功 | 删除 `momo-bootstrap` 容器，避免保留一次性密码日志。 |

### 5. 正常、基础和错误场景

- 正常：新目录运行 `./docker/deploy.sh`，自动创建 `.env`、owner 和三个应用。
- 基础：已有 `.env` 和 volume 再次运行同一命令，migration 和 owner 检查重复执行，凭证、密码和业务数据不变。
- 错误：手工执行 `down --volumes` 更新服务，或为更新部署重新生成 PostgreSQL 密码。这会删除数据或让已有数据库无法认证。

### 6. 必须执行的测试

- `sh -n docker/deploy.sh`：脚本语法通过。
- `docker compose --env-file docker/.env -f docker/compose.yaml config`：必需变量齐全，Compose 可以解析。
- 首次部署：断言 `.env` 是 `0600`、五项凭证格式正确、owner 可以登录、`momo-bootstrap` 已删除。
- 更新部署：断言 `.env` 哈希不变、原 owner 密码仍可登录、已有数据库数据仍存在、终端不再输出凭证。
- 失败部署：分别设置半套 OAuth 和异常 owner，断言命令返回非零且 Momo 未启动。
- 项目检查：依次运行 `pnpm type-check`、`pnpm lint`、`pnpm format:check`。

### 7. 错误与正确做法

错误：在 `package.json` 和 shell 脚本中分别维护两套 `docker compose up` 参数。

正确：只在 `docker/deploy.sh` 处理完整部署，`pnpm docker:up` 直接调用该脚本。
