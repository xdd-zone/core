# Sub2API Docker 初始化调查

## 参考版本

- 仓库：`Wei-Shaw/sub2api`
- 分支：`main`
- 提交：`a2bc1337474b68b62391116835e5698ebb5526bd`
- 查看日期：2026-07-13

调查先通过 AnySearch 提取用户指定的 README，再通过 GitHub tree 和 raw 接口核对固定提交中的脚本与后端代码。AnySearch v2.0 的 `list_domains` 调用被当前服务端拒绝，返回 `tool not found`；URL 提取能正常读取 README。

## README 中的 Docker 流程

来源：

- [README Docker Compose 部署](https://github.com/Wei-Shaw/sub2api/blob/a2bc1337474b68b62391116835e5698ebb5526bd/README.md#method-2-docker-compose-recommended)
- [`deploy/docker-deploy.sh`](https://github.com/Wei-Shaw/sub2api/blob/a2bc1337474b68b62391116835e5698ebb5526bd/deploy/docker-deploy.sh)
- [`deploy/docker-compose.local.yml`](https://github.com/Wei-Shaw/sub2api/blob/a2bc1337474b68b62391116835e5698ebb5526bd/deploy/docker-compose.local.yml)

首次部署分两步：

1. 在部署目录执行 `docker-deploy.sh`。
2. 执行 `docker compose up -d`。

`docker-deploy.sh` 会：

- 下载一份 Compose 文件和 `.env.example`。
- 用 `openssl rand -hex 32` 分别生成 `POSTGRES_PASSWORD`、`JWT_SECRET` 和 `TOTP_ENCRYPTION_KEY`。
- 从 `.env.example` 创建 `.env`，替换三个生成值，再把 `.env` 权限设为 `0600`。
- 创建应用、PostgreSQL 和 Redis 的数据目录。
- 完成时把三个生成凭证打印到终端。

Compose 把 `AUTO_SETUP=true` 传给应用，并传入 `ADMIN_EMAIL`、`ADMIN_PASSWORD`、`JWT_SECRET` 和 `TOTP_ENCRYPTION_KEY`。`ADMIN_PASSWORD` 可以留空。

## 管理员创建

来源：

- [`backend/cmd/server/main.go`](https://github.com/Wei-Shaw/sub2api/blob/a2bc1337474b68b62391116835e5698ebb5526bd/backend/cmd/server/main.go#L77)
- [`backend/internal/setup/setup.go`](https://github.com/Wei-Shaw/sub2api/blob/a2bc1337474b68b62391116835e5698ebb5526bd/backend/internal/setup/setup.go#L119)

应用启动时先调用 `NeedsSetup()`：

- 数据目录中已有 `config.yaml` 或安装锁文件时，直接进入正常启动，不再执行初始化。
- 两个文件都不存在且 `AUTO_SETUP=true` 时，测试 PostgreSQL 和 Redis，执行 migration，尝试创建管理员，写入配置和安装锁。

管理员创建前会查询用户总数和管理员数：

| 数据库状态 | 处理 |
| --- | --- |
| 已有管理员 | 跳过创建 |
| 没有管理员，但已有其他用户 | 跳过创建，避免覆盖密码 |
| 用户表为空 | 创建管理员 |

`ADMIN_PASSWORD` 留空时，应用生成 16 字节随机值，只在创建前打印一次明文，数据库只保存密码哈希。管理员创建失败会让自动初始化失败，应用不会进入正常启动。

## 更新部署

README 的更新命令只执行：

```bash
docker compose pull
docker compose up -d
```

更新不再执行 `docker-deploy.sh`。`.env` 和数据目录留在原位，所以数据库密码、JWT 密钥、TOTP 密钥和管理员记录不变。持久化的 `config.yaml` 和安装锁让新容器跳过首次初始化。

`docker-deploy.sh` 不是更新入口。当 Compose 和 `.env` 都存在时，它会询问是否覆盖；选择覆盖会重新生成凭证。

## 可以采用的做法

- 在启动 Compose 前生成 Compose 和数据库必须使用的凭证。
- 把生成值保存到权限为 `0600` 的未提交文件。
- 只在真正创建管理员时打印一次密码。
- 初始化失败时返回非零状态，不继续启动应用。
- 更新时只复用既有凭证和数据，不再运行凭证准备步骤。

## 不应直接照搬的地方

- `docker-deploy.sh` 要求用户在首次部署和更新部署之间记住两套命令，不符合本任务的单一入口要求。
- 脚本只在 Compose 和 `.env` 同时存在时询问是否覆盖；文件只存在一个时仍会继续写入，不适合作为严格的更新保护。
- 只要用户表不为空，即使没有管理员也会跳过创建。本任务要求管理员必须存在，所以需要明确报错或修复，不能静默跳过。
- README 同时提供本地目录和具名 volume 两份 Compose。本任务已要求只保留一种 Docker 方式。
