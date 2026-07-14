# 优化 Docker 首次部署与更新流程

## 目标

只保留一套简单的 Docker 部署方式。首次部署自动生成本地服务需要的安全凭证，创建一个可登录的 Fifa owner，并向部署人显示本次新生成的凭证。后续更新使用同一个入口，复用现有凭证、owner 和持久化数据。

## 背景

- 仓库已有唯一的 `docker/compose.yaml`，用于启动 PostgreSQL、Valkey、Meilisearch、Momo、Fifa 和 Bobo。
- `momo-migrate` 在完整环境启动时执行 Drizzle migration，成功后才启动 Momo。
- PostgreSQL、Meilisearch、Loki 和 Momo 本地素材使用具名 volume 保存。`docker:down` 不删除这些 volume。
- 当前需要手工从 `docker/.env.example` 创建 `docker/.env`，模板里还有固定示例密码和占位密钥。
- Momo 已有可重复执行的 `seed:owner`。它通过 Better Auth 创建密码账号，但当前每次都强制要求 `OWNER_PASSWORD`。
- Better Auth 的 email/password 注册要求 `name`、`email` 和 8 到 128 字符的 `password`。密码以哈希形式保存在 `account` 表。
- GitHub 和 Google OAuth client 凭证必须从对应 Provider 申请，本地部署脚本不能生成。
- 参考项目为 `Wei-Shaw/sub2api` 的 `main` 提交 `a2bc1337474b68b62391116835e5698ebb5526bd`。调查记录位于 `research/sub2api-docker-bootstrap.md`。

## 需求

### 部署入口

- 正式部署命令是 `./docker/deploy.sh`。首次部署和更新部署都执行这个命令。
- 生产主机只需要 Docker 和 Docker Compose，不要求额外安装 Node.js 或 pnpm。
- `pnpm docker:up` 保留为仓库内别名，但只调用 `./docker/deploy.sh`，不维护第二套启动逻辑。

### 服务凭证

- 首次部署自动生成 `POSTGRES_PASSWORD`、`BETTER_AUTH_SECRET`、`MEILI_API_KEY`、`BOBO_REVALIDATE_SECRET` 和 `LLM_SECRET_KEY`。
- 生成值不可预测，不使用提交到仓库的默认密码、固定密钥或 `replace-with-*` 占位值。
- 五个服务凭证保存到未提交的 `docker/.env`，文件权限必须是 `0600`。
- 首次部署成功后，终端只显示本次新生成的服务凭证。更新部署不重复显示已有值。
- 新建 `docker/.env` 时，`DATABASE_URL` 必须使用同一个新生成的 `POSTGRES_PASSWORD` 构造。已有环境的两个值都原样保留。

### 管理员

- 首次部署必须通过现有 `seed:owner` 创建一个可登录的 `fifa.owner`，不另写直接插入 Better Auth 表的逻辑。
- 默认邮箱是 `owner@xdd.zone`，默认显示名是 `Owner`。首次部署前可以通过 `OWNER_EMAIL` 和 `OWNER_DISPLAY_NAME` 覆盖这两个值。
- 新建 owner 时自动生成随机密码，不要求部署人手工设置 `OWNER_PASSWORD`。
- 管理员邮箱和密码只在 owner 成功创建时输出到当前终端。明文密码不写入 `.env` 或其他凭证文件。
- 已有 `fifa.owner` 时，初始化必须复用该用户，不要求密码，不修改密码哈希，不更新用户资料，也不重复输出旧密码。
- owner 创建、密码账号检查或角色绑定失败时，初始化失败，Momo 不能启动。

### OAuth

- GitHub 和 Google OAuth Provider 默认关闭。每个 Provider 只在 client ID 和 client secret 都已配置时启用。
- 没有 OAuth 凭证时，Momo 正常启动并保留 email/password 登录。
- 只填一半 Provider 凭证时，环境变量校验必须报错，不能带着不完整配置启动。
- 后续在 `docker/.env` 中成对填入 OAuth client ID 和 client secret 后，重新执行 `./docker/deploy.sh` 即可启用该 Provider。

### 更新与失败

- `docker/.env` 已存在时，部署脚本不覆盖、不重新生成、不自动轮换其中的凭证。
- 更新部署必须复用现有具名 volume、服务凭证和 owner，不重置密码，不覆盖业务数据。
- 每次部署都继续执行 migration 和 owner 存在性检查。migration 或 owner 初始化失败时，不启动新版 Momo。
- 部署脚本失败时返回非零状态，并输出 migration 或 owner 初始化的相关日志。
- `docker:down` 不删除业务 volume。常规更新步骤不使用 `down --volumes`。

## 验收条件

- [x] 新部署目录在不手工编写敏感值的情况下，执行 `./docker/deploy.sh` 后能完成启动。
- [x] 新生成的五个服务凭证满足各自的长度和编码要求，不来自 `.env.example` 的固定值。
- [x] `docker/.env` 权限是 `0600`，内容包含服务凭证，但不包含管理员明文密码。
- [x] 首次部署终端显示本次新生成的服务凭证、管理员邮箱和一次性密码。
- [x] 数据库中至少有一个状态正常、带 Better Auth `credential` 账号和 `fifa.owner` 角色的用户。
- [x] 管理员可以用终端显示的邮箱和密码登录，数据库只保存密码哈希。
- [x] 使用同一 `docker/.env` 和 volume 再次执行部署后，原 owner 仍能登录，原数据仍存在，凭证文件内容没有变化，终端不再显示管理员密码。
- [x] 成功部署并显示管理员密码后，owner 初始化容器被删除，日常容器日志不保留该明文。
- [x] GitHub/Google 凭证都留空时密码登录可用，对应 OAuth Provider 不注册；只填 client ID 或 client secret 时部署明确报错。
- [x] migration 或 owner 初始化失败时，Momo 不启动，命令返回非零状态并显示失败日志。
- [x] 修改按顺序通过项目 type-check、lint 和 format 检查，同时通过 Momo 测试、Shell 语法检查、Compose 解析和首次/更新部署验证。

## 不在本次范围

- Kubernetes、Helm、CI/CD 发布流程、反向代理、域名和 TLS 证书。
- 自动备份、跨主机数据迁移和多节点高可用部署。
- 自动轮换旧环境已保存的凭证。
- 管理员密码找回或自动重置命令。
- 为无 Docker 环境提供第二套安装脚本。
