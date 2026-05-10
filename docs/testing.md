# 测试指南

这份文档只列当前仓库常用的检查命令。

## 基础检查

```bash
bun run format
bun run lint
bun run type-check
```

如果只想先看格式：

```bash
bun run format:check
```

## Nexus 测试

```bash
bun run --filter @xdd-zone/nexus test
```

当前会覆盖：

- service 单元测试
- 路由集成测试
- Eden smoke
- OpenAPI smoke
- 认证、权限、内容、媒体、公开站点和站点配置接口

按测试类型单独跑：

```bash
bun run --filter @xdd-zone/nexus test:unit
bun run --filter @xdd-zone/nexus test:integration
bun run --filter @xdd-zone/nexus test:smoke
```

Nexus 测试工具放在：

- `packages/nexus/src/test/app.ts`
  创建测试 app、构造 `Request`、读取 JSON、断言错误响应和空 body。
- `packages/nexus/src/test/eden.ts`
  创建不走真实网络的 Eden client，并保留 cookie。
- `packages/nexus/src/test/db.ts`
  生成测试后缀、写入基础角色权限、按外键顺序清理测试数据。
- `packages/nexus/src/test/permissions.ts`
  创建临时角色，给用户分配权限。
- `packages/nexus/src/test/fixtures.ts`
  创建用户、分类、文章、评论和媒体测试数据。

新增 Nexus 测试文件按这个命名：

```text
service.unit.test.ts
routes.integration.test.ts
*.smoke.test.ts
```

补接口测试时按这个范围选：

- 改 `service.ts`：补 `service.unit.test.ts`，用 spy 断言 repository 调用和业务错误。
- 改 `routes.ts`：补 `routes.integration.test.ts`，用 `createTestApp()` 和 `app.handle(Request)` 测 HTTP 状态码、权限、schema 和返回值。
- 改删除或登出接口：必须断言 `204` 且响应体为空。
- 改公开接口：补匿名访问用例。
- 改 OpenAPI 或 Eden 类型：补 `packages/nexus/src/eden/*.smoke.test.ts`。
- 改路由 `response`：补 OpenAPI smoke，断言关键接口完整状态码。
- 改错误插件：同时测框架原生错误、业务 `HttpError` 和 Prisma 已知错误。
- 改登录或注册接口：路由层 `response` 必须写 `{ 200, 400 }`，不能只写 `apiDetail(...errors)`。

OpenAPI smoke 用来检查 `/openapi/json` 真实输出。关键接口不能只断言路径存在，要断言返回状态码，比如 `200`、`400`、`401`、`403`、`404`、`409`。

## Console 检查

```bash
bun run lint:console
bun run --filter @xdd-zone/console type-check
bun run build:console
```

## 本地数据库

常用命令：

```bash
bun run db up
bun run db down
bun run db status
bun run db logs
bun run db prepare
```

本地默认数据库：

- host: `localhost`
- port: `55432`
- database: `xdd_core_local`
- user: `xdd`
- password: `xdd_local_dev`

## 按改动类型选命令

### 只改文档

当前根目录的 `bun run format:check` 只检查 `packages/`，不会检查 `README.md` 和 `docs/`。

只改 Markdown 时，先手动核对：

1. 路径和文件名是否存在
2. 命令名是否和 `package.json` 一致
3. 接口地址、环境变量和页面路径是否还是当前实现

如果这次改动同时碰了 `packages/` 里的文件，再补：

```bash
bun run format:check
```

### 改前端

```bash
bun run lint:console
bun run --filter @xdd-zone/console type-check
bun run build:console
```

### 改后端接口、认证、权限、OpenAPI、Eden

```bash
bun run --filter @xdd-zone/nexus type-check
bun run --filter @xdd-zone/nexus test
```

### 提交前最小检查

```bash
bun run format
bun run lint
bun run type-check
```
