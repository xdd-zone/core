# 测试指南

这份文档分两部分：

- 先列当前仓库能直接跑的检查命令
- 再列 Nexus 新测试的推荐写法

## 基础检查

```bash
pnpm format
pnpm lint
pnpm type-check
```

如果只想先看格式：

```bash
pnpm format:check
```

## Nexus 测试

```bash
pnpm --filter @xdd-zone/nexus test
```

当前会覆盖：

- service 单元测试
- 路由集成测试
- Eden smoke
- OpenAPI smoke
- 认证、权限、内容、媒体、公开站点和站点配置接口

按测试类型单独跑：

```bash
pnpm --filter @xdd-zone/nexus test:unit
pnpm --filter @xdd-zone/nexus test:integration
pnpm --filter @xdd-zone/nexus test:smoke
```

Nexus 测试工具放在：

- `apps/nexus/src/test/app.ts`
  创建测试 app、构造 `Request`、读取 JSON、断言错误响应和空 body。
- `apps/nexus/src/test/eden.ts`
  创建不走真实网络的 Eden client，并保留 cookie。
- `apps/nexus/src/test/db.ts`
  生成测试后缀、写入基础角色权限、按外键顺序清理测试数据。
- `apps/nexus/src/test/permissions.ts`
  创建临时角色，给用户分配权限。
- `apps/nexus/src/test/fixtures.ts`
  创建用户、分类、文章、评论和媒体测试数据。
- `apps/nexus/src/test/integration.ts`
  用 `createIntegrationTestContext()` 写路由集成测试，统一处理匿名请求、登录用户、权限、JSON 请求和测试数据清理。

## Nexus 测试写法规范

### 新文件先放哪

新增测试文件按这个命名：

```text
service.unit.test.ts
routes.integration.test.ts
*.smoke.test.ts
```

优先级按改动落点选：

- 改 `apps/nexus/src/modules/*/service.ts`
  先补同目录 `service.unit.test.ts`。
- 改 `apps/nexus/src/modules/*/routes.ts`
  先补同目录 `routes.integration.test.ts`。
- 改 `apps/nexus/src/public/*`、`apps/nexus/src/eden/*`、`apps/nexus/src/modules/*/openapi.ts`
  先补 `apps/nexus/src/eden/*.smoke.test.ts`。

不要把 service 逻辑塞进 smoke。不要把 OpenAPI 契约检查塞进普通路由集成测试。

### 路由集成测试默认入口

新路由测试默认从这里起：

```ts
const integration = createIntegrationTestContext(TEST_APP_OPTIONS)
```

文件位置：

- `apps/nexus/src/test/integration.ts`

这个 helper 会给你：

- `integration.anonymous`
  匿名请求 runner。
- `integration.actor(...)`
  自动注册并登录测试用户，按需补权限。
- `integration.json(...)`
  发请求后直接返回 `{ response, body }`。
- `integration.jsonHeaders()`
  构造 `content-type: application/json`。
- `integration.track.*`
  手动登记 fixture ID，给清理函数使用。
- `integration.cleanup()`
  清当前测试里登记过的数据。

### 什么时候用 `integration.json()` / `requestJson`

优先场景：

- 你要测 JSON body 接口
- 你拿到响应后马上要断言 JSON 字段
- 同一个文件里会反复发 `POST`、`PATCH`、`PUT`

推荐写法：

```ts
const { response, body } = await integration.json<MyResponse>(
  '/api/site-config',
  {
    method: 'PUT',
    headers: integration.jsonHeaders(),
    body: JSON.stringify({ title: 'New Title' }),
  },
  user,
)
```

如果同一个文件里相同 JSON 请求要写很多次，可以在测试文件头部包一层很薄的 `requestJson()`，只做这件事：

- 收 `path`
- 收 `method`
- 收 `body`
- 默认 runner 用 `integration.anonymous`

当前参考文件：

- `apps/nexus/src/modules/post/routes.integration.test.ts`
- `apps/nexus/src/modules/site-config/routes.integration.test.ts`
- `apps/nexus/src/modules/category/routes.integration.test.ts`

不要再新写一套 `createTestApp + new Request + response.json()` 的重复样板，只为了发普通 JSON 请求。

### 什么时候用 `anonymousRunner`

直接用：

```ts
const anonymousRunner = integration.anonymous
```

适合这些场景：

- 断公开接口匿名可访问
- 断后台接口匿名返回 `401`
- 断不需要提前登录的输入校验
- 断文件下载、删除这类不一定返回 JSON 的响应

当前参考文件：

- `apps/nexus/src/modules/public-site/routes.integration.test.ts`
- `apps/nexus/src/modules/post/routes.integration.test.ts`
- `apps/nexus/src/modules/comment/routes.integration.test.ts`

如果测试标题里写的是“匿名访问”，默认先用 `anonymousRunner`，不要先建登录用户。

### 什么时候直接 `app.handle()`

只在下面几类场景直接用：

- 你在测顶层 app 挂载结果，比如 `/openapi/json`
- 你在测重定向、cookie、header、空 body 这种原始 HTTP 行为
- 你在测插件级行为，不是具体业务模块
- 你不需要 `integration.actor()`、权限分配、测试数据跟踪

入口文件：

- `apps/nexus/src/test/app.ts`

常用组合：

```ts
const { app } = createTestApp()
const response = await app.handle(createTestRequest('/openapi/json'))
```

当前参考文件：

- `apps/nexus/src/modules/auth/routes.integration.test.ts`
- `apps/nexus/src/core/http/error.plugin.unit.test.ts`
- `apps/nexus/src/core/access/*.unit.test.ts`

如果你已经进入普通模块路由集成测试，优先还是 `createIntegrationTestContext()`，不要回到 `createTestApp()` 重搭一遍。

### 新测试里怎么建登录用户和权限

登录用户优先这样建：

```ts
const user = await integration.actor([PostPermissions.READ_ALL, PostPermissions.WRITE_ALL], {
  prefix: 'post-user',
})
```

物理动作：

- `integration.actor()` 会注册用户并保留登录态
- 传权限数组时，会顺手创建临时角色并分配给这个用户
- 用户 ID、角色 ID 会自动登记到 cleanup 清单里

只有在你专门测 Eden cookie、登录流或自定义 fetcher 时，才直接用：

- `createCookieClient()`
- `createAnonymousClient()`

这两个 helper 在：

- `apps/nexus/src/test/eden.ts`

### 旧写法怎么替换

尽量不要再写这种组合：

- `createTestApp()`
- 手工维护 `createdUserIds`、`createdPostIds` 之类数组
- `afterAll` 里自己拼 `cleanupTestData(...)`

当前推荐替代法：

1. 路由集成测试改用 `createIntegrationTestContext()`
2. 用 `integration.actor()` 建用户
3. 用 `integration.track.*` 登记手动创建的 fixture
4. 用 `afterEach(async () => { await integration.cleanup() })`

只有像 `apps/nexus/src/eden/eden.smoke.test.ts` 这种整文件都在直接控制 Eden client 生命周期的 smoke，才继续自己维护清理数组。

### 最少要断什么

#### 删除接口

至少断这三件事：

- 响应状态是 `204`
- 响应体为空
- OpenAPI smoke 里存在这个删除路由的 `204` 契约

物理写法：

```ts
const response = await user(`/api/post/${created.id}`, { method: 'DELETE' })
await expectNoBody(response)
```

`expectNoBody()` 在：

- `apps/nexus/src/test/app.ts`

#### 公开接口

至少断这三件事：

- 匿名请求可以直接访问
- 返回的是 `200` 或当前真实业务错误码
- 不存在不该暴露的写操作

物理动作：

- 在 `routes.integration.test.ts` 里用 `anonymousRunner('/api/public-site/...')`
- 在 `apps/nexus/src/eden/openapi.smoke.test.ts` 里断公开 path 只有当前允许的 method

#### OpenAPI / Eden 契约

至少分成两层：

- Eden smoke 断调用端真正会用的关键 happy path
- OpenAPI smoke 断 `/openapi/json` 里关键 path、method、tag、状态码和少量 schema

新增或修改接口时，OpenAPI smoke 最少要补这些断言里的对应项：

- 路由 path 在不在
- method 在不在
- tag 对不对
- `200`、`204`、`400`、`401`、`403`、`404`、`409` 这些当前已导出的状态码有没有丢
- 请求体或 query 里最关键的字段有没有丢

`422` 现在大量存在于运行时校验响应，但当前很多接口没有把 `422` 写进 OpenAPI。这里不要凭感觉补文档契约，只断当前 `/openapi/json` 真实导出的状态码。

### 写测试时的最小收尾

只改 Nexus 测试时，至少跑：

```bash
pnpm --filter @xdd-zone/nexus test:smoke
```

如果这次同时改了普通路由测试，再补：

```bash
pnpm --filter @xdd-zone/nexus test:integration
```

如果只改了文档，根目录的 `pnpm format:check` 不会检查 `docs/`。这时手动核对：

1. 路径和文件名是否存在
2. 命令名是否和 `package.json` 一致
3. helper 名称、接口地址、状态码是否还是当前实现

## OpenAPI smoke 现在检查什么

文件位置：

- `apps/nexus/src/eden/openapi.smoke.test.ts`

当前推荐做法：

- 先维护模块清单，确认关键模块还挂在 `/openapi/json`
- 再维护关键路由清单，逐条断 method、tag、状态码和少量 schema

新增接口时怎么补：

1. 如果是已有模块里的关键路由，往关键路由清单里加一项
2. 如果是新模块，先把模块和至少一个关键 path 加进模块清单
3. 如果是删除接口，补 `204` 断言和“没有多余 method”断言

## Console 检查

```bash
pnpm lint:console
pnpm --filter @xdd-zone/console type-check
pnpm build:console
```

## 本地数据库

常用命令：

```bash
当前根目录没有数据库脚本。需要本地数据库时，先确认 `package.json` 里已经补了对应脚本。
```

本地默认数据库：

- host: `localhost`
- port: `55432`
- database: `xdd_core_local`
- user: `xdd`
- password: `xdd_local_dev`

## 按改动类型选命令

### 只改文档

当前根目录的 `pnpm format:check` 只检查各 workspace，不会检查 `README.md` 和 `docs/`。

只改 Markdown 时，先手动核对：

1. 路径和文件名是否存在
2. 命令名是否和 `package.json` 一致
3. 接口地址、环境变量和页面路径是否还是当前实现

如果这次改动同时碰了 `packages/` 里的文件，再补：

```bash
pnpm format:check
```

### 改前端

```bash
pnpm lint:console
pnpm --filter @xdd-zone/console type-check
pnpm build:console
```

### 改后端接口、认证、权限、OpenAPI、Eden

```bash
pnpm --filter @xdd-zone/nexus type-check
pnpm --filter @xdd-zone/nexus test
```

### 提交前最小检查

```bash
pnpm format
pnpm lint
pnpm type-check
```
