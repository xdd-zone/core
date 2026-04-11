# Eden 指南

这份文档说明当前仓库怎么用 Eden 连接前后端。

## Eden 在这里做什么

当前 Eden 主要有两件事：

1. 给 `packages/console` 提供带类型的 Treaty 客户端
2. 给 `packages/nexus` 提供 smoke test

## 相关文件

### 后端

- `packages/nexus/src/app.ts`
  创建 Elysia app。
- `packages/nexus/src/public/eden.ts`
  导出 `type App = typeof app`。
- `packages/nexus/src/eden/eden-smoke.test.ts`
  Eden smoke 测试。
- `packages/nexus/src/eden/openapi-smoke.test.ts`
  OpenAPI smoke 测试。

### 前端

- `packages/console/src/shared/api/eden.ts`
  Treaty 客户端、API 基址、cookie、错误拆包。
- `packages/console/src/modules/*`
  页面侧 query / mutation。

## 后端怎么导出 Eden 类型

当前只有一个入口：

```ts
import type { app } from '../app'

export type App = typeof app
```

也就是说，只要接口已经挂到 `app` 上，前端 Treaty 类型就会一起更新。

## 前端怎么用

当前前端统一在 `packages/console/src/shared/api/eden.ts` 创建客户端。

关键点：

- 自动处理 API 基址
- 默认带 `credentials: 'include'`
- 不直接抛 HTTP 错误，统一走项目自己的错误拆包

页面和模块里的常见写法：

```ts
await api.auth.methods.get()
await api.auth['get-session'].get()
await api.user.get({ query: { page: 1, pageSize: 20 } })
await api.user({ id }).patch(body)
await api.rbac.users({ userId }).roles.post(body)
```

## GitHub 登录为什么不走 Eden

因为 GitHub 登录要走浏览器重定向：

1. 前端生成登录地址
2. 浏览器跳到 `/api/auth/sign-in/github`
3. GitHub 授权
4. 后端写 cookie
5. 浏览器再跳回前端

这条流程不是普通 JSON 请求，所以不走 `api.auth['sign-in'].github.get()` 这种写法。

## 新增接口时怎么接 Eden

### 只改后端

按这个顺序：

1. 改 `packages/nexus/src/modules/<name>/model.ts`
2. 改 `service.ts / repository.ts`
3. 改 `index.ts`
4. 确认模块已经挂到 `packages/nexus/src/modules/index.ts`

正常情况下，不需要手动改 `packages/nexus/src/public/eden.ts`。

### 后端改完，前端也要用

继续做这些事：

1. 在对应的 `packages/console/src/modules/<name>/` 里补 query / mutation
2. 页面里使用 query / mutation
3. 如果页面真要复用明确 HTTP 类型，再补 `packages/nexus/src/public/*-types.ts`

## API 基址和 cookie

前端当前会按这个顺序读取 API 基址：

1. `VITE_API_ORIGIN`
2. `VITE_API_ROOT`
3. `VITE_API_BASE_URL`

如果都没配，浏览器侧会回退到当前页面 origin，再访问 `/api`。

要保证登录态正常，至少确认这三件事：

1. 前端请求带 `credentials: 'include'`
2. 后端 CORS 允许带 cookie
3. `packages/nexus/config.yaml` 的 `trustedOrigins` 包含当前来源

## Eden smoke test 看什么

当前 smoke test 会检查：

- 匿名访问
- 登录态读写
- 用户接口
- 权限接口
- OpenAPI 关键路径

常用命令：

```bash
bun run --filter @xdd-zone/nexus test
```

## 什么时候优先看这份文档

- 前后端联调报错
- 改接口后前端类型没跟上
- 登录态在前端拿不到
- 不确定该补 `*-types` 还是直接靠 Treaty 推导
