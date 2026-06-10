# @xdd-zone/momo

`@xdd-zone/momo` 是 XDD Zone Core 的 Hono API 服务。

## 当前保留内容

- `src/index.ts`
  直接运行 Momo 时启动 Node 服务。
- `src/app.ts`
  创建 Hono app，注册错误处理，挂载路由，导出 `app` 和默认导出。
- `src/rpc.ts`
  只导出给 Hono RPC client 使用的 `AppType` 类型。
- `src/routes`
  按接口域放路由。
- `src/shared`
  放 Momo 内部共用的错误类型、Hono 类型和响应 meta 生成函数。
- `/`
  返回服务名称和状态，使用统一响应格式。
- `/health`
  返回健康检查状态，使用统一响应格式。
- `/rpc/system/ping`
  接收 `{ "name": "fifa" }`，返回 `pong, fifa`。

当前没有数据库、认证、权限、文件存储和业务模块。

## 常用命令

```bash
cd apps/momo

pnpm dev
pnpm build
pnpm type-check
pnpm test
```

## 运行方式

开发模式：

```bash
cd apps/momo
pnpm dev
```

指定端口：

```bash
PORT=7788 pnpm dev
```

直接请求 app 时，可以在测试里用 `app.request()`：

```ts
import { app } from './src/app'

const response = await app.request('/health')
```
