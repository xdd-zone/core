# @xdd-zone/nexus

`@xdd-zone/nexus` 是 XDD Zone Core 的 Hono API 示例服务。

## 当前保留内容

- `src/index.ts`
  创建 Hono app，导出 `app`、默认导出和 `AppType`。
- `/`
  返回服务名称和状态。
- `/health`
  返回健康检查状态。
- `/api/example`
  返回一个 Hono 示例响应。

当前没有数据库、认证、权限、文件存储和业务模块。

## 常用命令

```bash
cd apps/nexus

pnpm dev
pnpm build
pnpm type-check
pnpm test
```

## 运行方式

开发模式：

```bash
cd apps/nexus
pnpm dev
```

指定端口：

```bash
PORT=7788 pnpm dev
```

直接请求 app 时，可以在测试里用 `app.request()`：

```ts
import { app } from './src/index'

const response = await app.request('/health')
```
