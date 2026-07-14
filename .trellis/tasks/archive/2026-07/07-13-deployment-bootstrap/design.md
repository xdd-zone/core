# Docker 凭证与 owner 初始化设计

## 概要

`docker/deploy.sh` 是唯一的正式部署入口。它先准备或校验 `docker/.env`，再调用现有 `docker/compose.yaml` 构建和启动服务。Compose 在 Momo 前串行执行 migration 和 owner 初始化。

该设计借用 Sub2API 的三个做法：启动 Compose 前生成服务凭证、用 `0600` 文件保存凭证、只在创建管理员时显示一次密码。不采用其覆盖 `.env` 的交互选项，也不保留首次部署和更新部署两套命令。

## 边界

| 文件 | 职责 |
| --- | --- |
| `docker/deploy.sh` | 判断新环境或已有环境，准备凭证，运行 Compose，显示本次生成的值 |
| `docker/.env.example` | 记录公开配置、空的本地凭证槽位和可选 OAuth 变量 |
| `docker/.env` | 保存当前部署的服务凭证和运行配置，不保存 owner 明文密码 |
| `docker/compose.yaml` | 定义服务、运行环境、migration、owner 初始化和启动顺序 |
| `apps/momo/src/scripts/seed-owner.ts` | 通过 Better Auth 创建或检查 owner，保持现有密码和用户资料 |
| `apps/momo/src/shared/env.ts` | 校验 OAuth 成对可选和其他 Momo 运行变量 |
| `apps/momo/src/modules/auth/auth.config.ts` | 只注册配置完整的 OAuth Provider |

`pnpm docker:up` 只调用 `docker/deploy.sh`。凭证生成和启动顺序不在 `package.json` 复制。

## 配置流

```text
新环境
  -> deploy.sh 从 .env.example 创建 docker/.env
  -> deploy.sh 生成五个服务凭证并设置 0600
  -> Compose 读取 docker/.env
  -> migration
  -> owner 初始化
  -> Momo -> Fifa / Bobo
  -> deploy.sh 显示新凭证并清理 owner 初始化容器

已有环境
  -> deploy.sh 保留 docker/.env 内容
  -> Compose 复用同名 volume 和凭证
  -> migration
  -> owner 存在性与密码账号检查
  -> Momo -> Fifa / Bobo
```

## 服务凭证

### 生成格式

| 变量 | 格式 | 原因 |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | 32 随机字节的小写 hex，64 字符 | 随机强度足够，可直接放入 PostgreSQL URL |
| `BETTER_AUTH_SECRET` | 32 随机字节的小写 hex，64 字符 | 超过 Better Auth 的 32 字符下限 |
| `MEILI_API_KEY` | 32 随机字节的小写 hex，64 字符 | 作为 Meilisearch master key |
| `BOBO_REVALIDATE_SECRET` | 32 随机字节的小写 hex，64 字符 | 用于 Momo 和 Bobo 的内部请求校验 |
| `LLM_SECRET_KEY` | 32 随机字节的 base64 | 符合 Momo 对 32 字节加密密钥的现有校验 |

Shell 脚本从操作系统的 `/dev/urandom` 读取随机字节，不依赖主机 Node.js。生成过程先设置 `umask 077`，写完后再显式执行 `chmod 600 docker/.env`。

### 新环境

`docker/.env` 不存在时：

1. 拒绝跟随同名符号链接。
2. 从 `.env.example` 创建文件。
3. 生成五个值，替换新文件中的对应空值，并用新 PostgreSQL 密码写入匹配的 `DATABASE_URL`。
4. 记住本次生成的值，等部署成功后显示。

Compose 继续读取 `.env` 中的 `DATABASE_URL`。这保留已有环境中的 URL 编码和连接参数，避免旧 PostgreSQL 密码含 `@`、`:` 或 `%` 时被未编码地重新拼接。新环境的 PostgreSQL 密码是 hex，脚本可以安全地用它生成 URL。

### 已有环境

`docker/.env` 已存在时：

- 不修改文件内容，包括旧环境使用的示例值。
- 文件不是符号链接时，把权限修正为 `0600`。
- 必需值缺失或为空时立即失败，指出变量名，不在更新时猜测或替换旧值。
- 检测到已知的弱示例值时显示警告，但不自动轮换，避免 PostgreSQL 等持久化服务因密码变化无法启动。

## Compose 启动顺序

Compose 新增一个一次性 `momo-bootstrap` 服务，并保留现有 `momo-migrate`。

```text
postgres healthy
  -> momo-migrate exited 0
  -> momo-bootstrap exited 0
  -> momo healthy
  -> fifa / bobo
```

`momo-bootstrap` 使用 Momo Dockerfile 的 `build` target，在 `/workspace/apps/momo` 执行现有 TypeScript owner seed。该 target 已包含 workspace 源码、`tsx`、Better Auth 和 Drizzle 依赖，不需要把 seed 代码放进 Momo runtime 镜像。

`momo` 增加 `momo-bootstrap: service_completed_successfully` 依赖。直接绕过部署脚本执行 Compose 时，空的必需凭证会在 Compose 解析阶段报错，不会用固定默认值启动。

`deploy.sh` 等待 Compose 中默认服务健康或一次性服务成功退出。失败时显示 `momo-migrate` 和 `momo-bootstrap` 日志并返回非零状态。

## owner 初始化

`seed-owner.ts` 保留一个 owner 创建入口，但调整执行顺序：

1. 写入必需的 application、auth method 和 role 定义。
2. 查找已绑定 `fifa.owner` 的用户。
3. 已有 owner 时，检查用户状态和 Better Auth `credential` 账号，复用该用户并结束；不读取或生成密码，不修改用户资料和初始内容。
4. 没有 owner 时，读取 `OWNER_EMAIL` 和 `OWNER_DISPLAY_NAME`，分别使用 `owner@xdd.zone` 和 `Owner` 作为默认值。
5. 指定 email 的用户已存在时，必须已有 `credential` 账号；脚本只绑定 owner 角色，不修改其密码。
6. 指定 email 不存在时，优先使用显式提供的 `OWNER_PASSWORD`，否则用 Node.js `randomBytes(24).toString('base64url')` 生成 32 字符密码。保留显式密码仅用于本机开发 seed，Docker 不传该变量。
7. 通过 `auth.api.signUpEmail()` 创建用户，再绑定角色并写入现有首次 seed 数据。

只有第 6 步自动生成密码时，脚本才输出统一标记的 owner email 和 password。部署脚本显示 `momo-bootstrap` 输出后立即删除该一次性容器。更新部署找到现有 owner 时不产生密码行。

## OAuth 可选配置

`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 改为可选字符串。环境变量层负责成对校验：

| client ID | client secret | 结果 |
| --- | --- | --- |
| 空 | 空 | Provider 关闭 |
| 有 | 有 | Provider 启用 |
| 有 | 空 | 配置报错 |
| 空 | 有 | 配置报错 |

历史 `.env` 中的 `replace-with-*` OAuth 值按未配置处理，不需要修改旧文件。`createMomoAuth()` 根据校验后的值组装 `socialProviders`。email/password 始终启用。

## 更新兼容

| 已有内容 | 更新行为 |
| --- | --- |
| `docker/.env` | 内容不修改；校验必需值，权限修正为 `0600` |
| PostgreSQL 等 volume | 使用与现在相同的默认名称，不删除、不重建 |
| 已有 owner | 按 `fifa.owner` 角色识别，不依赖默认 email，不修改密码或资料 |
| 旧 `DATABASE_URL` | 原样保留并继续使用，不重新拼接或编码 |
| OAuth 占位值 | 按空值处理，不注册假 Provider |
| 现有业务数据 | migration 后保留；owner 检查不重新写入首次内容 |

Compose 现有的 network 和 volume 名称保持不变。首次部署验证在临时仓库副本中使用临时 Compose 文件改为独立资源名，不为了测试改变生产资源规则。

## 失败与回滚

- Docker 或 Compose 不可用：在写入配置前报错。
- 新 `.env` 生成失败：不运行 Compose，不报告部署成功。
- 已有 `.env` 不完整：指出缺少的变量，不改动原文件。
- Compose 解析失败：不启动服务。
- migration 失败：`momo-bootstrap` 和新版 Momo 不启动。
- owner 初始化失败：新版 Momo 不启动，保留失败容器供查日志。

代码回滚时不删除 `docker/.env` 或 volume。数据库 migration 不自动逆转；如果新 migration 不兼容旧代码，需要先根据对应 migration 评估回滚，不能通过删除 volume 处理。

## 文档范围

同步以下当前实现文档：

- `README.md`
- `docs/development.md`
- `docs/apps/momo.md`
- `apps/momo/README.md`
- OAuth 集成文档中和可选变量相关的段落

`docs/superpowers/` 下的历史设计和实施记录不修改。Trellis 的 Momo Docker 规范在实现和检查完成后按 `trellis-update-spec` 的判断同步。
