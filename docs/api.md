# API 指南

这份文档说明当前 Nexus API。

## 基础地址

- 服务地址：`http://localhost:7788`
- 健康检查：`http://localhost:7788/health`

当前没有 OpenAPI 页面。

## 代码位置

当前所有接口都在：

```text
apps/nexus/src/index.ts
```

这里同时负责：

- 创建 Hono app。
- 定义示例接口。
- 导出 `AppType`。
- 在直接运行文件时启动 Node 服务。

## 当前接口

| 方法 | 路径 | 返回 |
| ---- | ---- | ---- |
| `GET` | `/` | 服务名称和状态 |
| `GET` | `/health` | 健康检查状态 |
| `GET` | `/api/example` | Hono 示例响应 |

## 响应示例

### `GET /`

```json
{
  "name": "@xdd-zone/nexus",
  "status": "ok"
}
```

### `GET /health`

```json
{
  "status": "ok"
}
```

### `GET /api/example`

```json
{
  "message": "Hono 示例接口"
}
```

## 本地验证

先启动 Nexus：

```bash
pnpm dev:nexus
```

再请求：

```bash
curl http://localhost:7788/
curl http://localhost:7788/health
curl http://localhost:7788/api/example
```

## 新增接口

先在 `apps/nexus/src/index.ts` 继续追加路由。

示例：

```ts
const app = new Hono()
  .get('/', (c) => c.json({ name: '@xdd-zone/nexus', status: 'ok' }))
  .get('/health', (c) => c.json({ status: 'ok' }))
```

接口变多后，再用 Hono 的 `app.route()` 或 `basePath()` 分组。
