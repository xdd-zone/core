# Momo 认证与访问设计

这份文档记录 `apps/momo` 第一版用户、登录和访问判断的设计。

## 背景

`core` 当前有两个前端入口：

- `apps/fifa`
  主人使用的后台控制台。
- `apps/bobo`
  对外开放的个人站点。

`apps/momo` 是 Hono API 服务，运行在 Node.js 上。数据库使用 PostgreSQL，ORM 使用 Drizzle。

第一版认证采用折中方案：`better-auth` 负责登录和 session，Momo 自己负责子站和角色判断。

## 范围

第一版要完成这些事：

- `fifa` 只允许邮箱密码登录。
- `fifa` 只允许拥有 `fifa.owner` 角色的用户进入。
- `bobo` 只允许 GitHub 和 Google 登录。
- `bobo` 登录成功后自动得到 `bobo.visitor` 角色。
- 前端不保存 access token，也不自己处理 refresh token。
- owner 账号只通过 seed 命令创建。

第一版不做这些事：

- 公开注册。
- 前端 access token。
- 自己维护 refresh token 表。
- 会话列表和撤销。
- OAuth 绑定和解绑页面。
- 多个后台角色。
- 评论、留言的审核规则。

## 总体边界

`better-auth` 负责登录相关流程：

- 邮箱密码登录。
- GitHub 登录。
- Google 登录。
- OAuth 账号记录。
- session cookie。
- 登出。
- 当前 session 读取。

Momo 负责访问判断：

- 当前子站允许哪些登录方式。
- 当前用户有没有对应角色。
- 当前用户状态是否可用。
- `bobo` 访客角色是否需要自动补上。

前端请求认证相关接口时带上 cookie。前端不保存 refresh token。

## 用户模型

整个系统只保留一套用户主体。

同一个真实用户以后可以同时满足这些情况：

- 用邮箱密码进入 `fifa`。
- 用 GitHub 或 Google 进入 `bobo`。
- 同时拥有 `fifa.owner` 和 `bobo.visitor`。

用户主体、登录方式、子站和角色分开保存。不要拆成 `fifa_users` 和 `bobo_users` 两套用户表。

## 数据表

### better-auth 管理的表

这些表由 `better-auth` 和 Drizzle adapter 生成并维护：

- `user`
- `account`
- `session`
- `verification`

Momo 不重复设计密码凭证表、OAuth 绑定表、session 表和 refresh token 表。

### Momo 管理的表

Momo 额外维护这些表：

```text
applications
application_auth_methods
roles
user_role_bindings
```

`applications` 存子站：

- `fifa`
- `bobo`

`application_auth_methods` 存子站允许的登录方式：

- `fifa` + `password`
- `bobo` + `github`
- `bobo` + `google`

`roles` 存第一版角色：

- `fifa.owner`
- `bobo.visitor`

`user_role_bindings` 存用户和角色的绑定关系。这里的用户 id 使用 `better-auth` 的 `user.id`。

## 接口

### better-auth 接口

Momo 挂载 `better-auth` 的 Hono handler：

```text
/api/auth/*
```

这个路径处理邮箱密码登录、GitHub 登录、Google 登录、登出、OAuth callback 和 session cookie。

### Momo 访问接口

Momo 额外提供两个当前用户接口：

```text
GET /rpc/fifa/auth/me
GET /rpc/bobo/auth/me
```

`GET /rpc/fifa/auth/me` 的规则：

- 当前 session 必须存在。
- 当前用户必须可用。
- 当前用户必须有 `fifa.owner`。
- 当前用户必须有 password 登录方式。

`GET /rpc/bobo/auth/me` 的规则：

- 未登录时返回 `user: null`。
- 已登录时返回当前访客信息。
- 已登录但没有 `bobo.visitor` 时，Momo 自动补一条角色绑定。

## 代码结构

第一版只新增一个 `auth` 模块：

```text
apps/momo/src/modules/auth/
  auth.route.ts
  auth.service.ts
  access.service.ts
  access.repository.ts
  auth.types.ts
```

数据库 schema 放在：

```text
apps/momo/src/infra/db/schema/
  auth.schema.ts
  access.schema.ts
```

seed 脚本放在：

```text
apps/momo/src/scripts/
  seed-owner.ts
```

文件职责：

- `auth.route.ts`
  挂载 `/api/auth/*`、`/rpc/fifa/auth/me` 和 `/rpc/bobo/auth/me`。
- `auth.service.ts`
  初始化 `better-auth`，读取当前 session，整理当前用户返回值。
- `access.service.ts`
  判断用户能否访问 `fifa` 或 `bobo`。
- `access.repository.ts`
  读写 Momo 自己维护的访问表。
- `auth.types.ts`
  放认证模块内部共用类型。

不新增 controller。route 接收请求并返回 Hono response，service 串联流程，repository 读写数据库。

## 登录流程

### fifa

`fifa` 登录页只展示邮箱密码。

登录成功后，前端立即请求：

```text
GET /rpc/fifa/auth/me
```

Momo 检查 session、用户状态、password 登录方式和 `fifa.owner` 角色。

检查失败时返回 401 或 403。前端收到 401 跳登录页，收到 403 时调用登出接口清理 session，再展示无权限或回到登录页。

### bobo

`bobo` 登录入口只展示 GitHub 和 Google。

登录成功后，前端请求：

```text
GET /rpc/bobo/auth/me
```

未登录时返回：

```json
{
  "user": null
}
```

已登录时返回访客基础信息。如果缺少 `bobo.visitor`，Momo 自动补上。

### 账号合并

第一版不按邮箱自动合并账号。

只有同一个 `provider + providerAccountId` 才认作同一个登录身份。GitHub 和 Google 返回同一个邮箱时，也先当作两个不同登录身份。

后续如果需要账号绑定，在账号设置里让用户主动绑定另一个 Provider。

## seed

第一版 owner 不走注册，只走 seed。

新增命令：

```bash
pnpm --filter @xdd-zone/momo seed:owner
```

脚本读取：

```text
OWNER_EMAIL
OWNER_PASSWORD
OWNER_DISPLAY_NAME
```

脚本执行内容：

- 确保 `applications` 有 `fifa` 和 `bobo`。
- 确保 `application_auth_methods` 有 `fifa/password`、`bobo/github` 和 `bobo/google`。
- 确保 `roles` 有 `fifa.owner` 和 `bobo.visitor`。
- 创建或更新 owner 用户。
- 给 owner 设置邮箱密码登录。
- 给 owner 绑定 `fifa.owner`。
- 可以给 owner 绑定 `bobo.visitor`。

seed 要能重复执行。已存在的数据不重复插入，只补缺失记录。

## 环境变量

Momo 需要补这些环境变量：

```text
BETTER_AUTH_SECRET
BETTER_AUTH_URL
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

OAuth 密钥只放环境变量，不写进数据库。

## 错误码

错误码放在 `packages/contracts`，供 Momo 和前端共用。

第一版先增加：

```text
AUTH.UNAUTHENTICATED
AUTH.FORBIDDEN
AUTH.METHOD_NOT_ALLOWED
AUTH.USER_DISABLED
AUTH.OWNER_REQUIRED
AUTH.SESSION_INVALID
```

`GET /rpc/fifa/auth/me` 常见错误：

- 未登录：`401 AUTH.UNAUTHENTICATED`
- 登录方式不满足：`403 AUTH.METHOD_NOT_ALLOWED`
- 没有 `fifa.owner`：`403 AUTH.OWNER_REQUIRED`
- 用户不可用：`403 AUTH.USER_DISABLED`

`GET /rpc/bobo/auth/me` 不把未登录当错误，直接返回 `user: null`。

## 测试

第一版先覆盖 Momo：

- seed 可重复执行。
- 未登录访问 `/rpc/fifa/auth/me` 返回 401。
- 只有 `bobo.visitor` 的用户访问 `/rpc/fifa/auth/me` 返回 403。
- owner 访问 `/rpc/fifa/auth/me` 返回成功。
- 未登录访问 `/rpc/bobo/auth/me` 返回 `user: null`。
- 已登录访问 `/rpc/bobo/auth/me` 会补 `bobo.visitor`。

## 实现顺序

按这个顺序落地：

1. 接入 `better-auth` 和 Drizzle schema。
2. 建 Momo 自己的访问表。
3. 写 `seed:owner`。
4. 跑通 `fifa` 邮箱密码登录。
5. 跑通 `/rpc/fifa/auth/me`。
6. 跑通 `bobo` GitHub 和 Google 登录。
7. 跑通 `/rpc/bobo/auth/me`。
8. 再接 `fifa` 和 `bobo` 前端页面。
