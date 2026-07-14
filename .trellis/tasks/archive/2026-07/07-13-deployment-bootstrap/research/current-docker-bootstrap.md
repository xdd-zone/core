# XDD Core 现有部署与 owner 初始化

## Docker 现状

- [`docker/compose.yaml`](../../../../docker/compose.yaml) 是唯一的 Compose 文件。
- [`docker/.env.example`](../../../../docker/.env.example) 仍使用固定示例值，包括 PostgreSQL、Meilisearch、Better Auth、Bobo revalidate 和 LLM 加密密钥。
- `docker/.env` 已被 Git 和 Docker 构建上下文忽略。
- `momo-migrate` 每次执行 Drizzle migration；只有 migration 成功后 Momo 才启动。
- PostgreSQL、Meilisearch 和 Momo 素材使用固定名称的具名 volume。`docker:down` 不删除 volume。
- 根 `package.json` 的 `docker:up` 直接执行 `docker compose ... up -d --build`，不会生成 `.env` 或创建 owner。

## 必须保存的凭证

| 变量 | 用途 | 当前校验 |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | PostgreSQL 初始化密码 | Compose 使用，应与 `DATABASE_URL` 一致 |
| `BETTER_AUTH_SECRET` | Better Auth 加密/签名密钥 | Momo 要求至少 32 字符 |
| `MEILI_API_KEY` | Meilisearch master key | 启用 Meilisearch 时必填 |
| `BOBO_REVALIDATE_SECRET` | Momo 调用 Bobo revalidate | 与 `BOBO_BASE_URL` 同时配置 |
| `LLM_SECRET_KEY` | 加密数据库中的 LLM Provider API Key | 必须是 32 字节 base64 |

GitHub 和 Google OAuth client 凭证来自外部 Provider，本地无法自动生成。

当前 `getMomoEnv()` 强制要求四个 OAuth 变量非空，`createMomoAuth()` 也无条件注册 GitHub 和 Google Provider。因此当前 Docker 模板只能放入 `replace-with-*` 占位值。如果希望新环境不填外部凭证也能启动，Momo 需要把每个 Provider 的 client ID 和 client secret 改为成对可选，只在两个值都存在时注册该 Provider。

## owner seed 现状

来源：[`apps/momo/src/scripts/seed-owner.ts`](../../../../apps/momo/src/scripts/seed-owner.ts)

`pnpm seed:owner` 会读取：

- `OWNER_EMAIL`
- `OWNER_PASSWORD`
- `OWNER_DISPLAY_NAME`

脚本现在会：

- 写入应用、登录方式和角色。
- 用 Better Auth `auth.api.signUpEmail()` 创建不存在的 owner。
- 给 owner 绑定 `fifa.owner` 和 `bobo.visitor`。
- 写入默认 LLM use case、内容分类、标签和第一篇文章。
- 重复执行时复用同一 email 的用户，更新显示名和状态，不修改密码。
- owner 已存在但没有 Better Auth `credential` 记录时报错。
- 任何步骤失败都返回非零状态。

当前的限制：

- 无论 owner 是否已存在，脚本都强制要求 `OWNER_PASSWORD`。
- 脚本使用 `apps/momo/.env.development`，Docker Compose 还没有传入 owner 变量，也没有执行该脚本的服务。
- Momo runtime 镜像只包含编译结果和生产依赖。现有 `momo-migrate` 使用 Dockerfile 的 `build` target，因此 Docker 初始化脚本也可以在同一 target 中执行 TypeScript 源码。

## Better Auth 约束

当前应用使用 `better-auth@1.6.16`。官方 [Email & Password](https://www.better-auth.com/docs/authentication/email-password) 文档确认：

- server API 可以调用 `auth.api.signUpEmail({ body })`。
- `name`、`email` 和 `password` 都是必填值。
- 默认密码长度为 8 到 128 字符。
- 密码哈希保存在 `account` 表，`providerId` 是 `credential`。

## 对本任务的影响

- 最少改动是复用 owner seed，不再新建第二套管理员创建代码。
- Docker 初始化必须位于 migration 之后、Momo 启动之前；owner seed 失败时 Momo 不能启动。
- 更新时可以再次执行 owner seed，但必须保持同一 `OWNER_EMAIL`，且不能借机重置密码。
- 生成 PostgreSQL 密码后必须同步构造 `DATABASE_URL`，否则应用会继续使用模板中的旧密码。
- 第三方 OAuth client 凭证只能由部署人提供，不应伪装成可生成的安全凭证。
