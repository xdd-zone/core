# API 指南

这份文档说明当前 Momo API。

## 基础地址

- 服务地址：`http://localhost:7788`
- 健康检查：`http://localhost:7788/health`

当前没有 OpenAPI 页面。

## 代码位置

当前接口放在：

```text
apps/momo/src/routes
```

相关入口：

- `apps/momo/src/app.ts`
  创建 Hono app，注册错误处理，挂载路由，导出运行时 app。
- `apps/momo/src/rpc.ts`
  导出给 Hono RPC client 使用的 `AppType`。
- `apps/momo/src/index.ts`
  直接运行 Momo 时启动 Node 服务。
- `apps/momo/src/routes/index.ts`
  挂载所有子路由。
- `packages/contracts/src`
  放接口 schema、类型和统一响应结构。

后续新增接口按 [apps/momo.md](../apps/momo.md) 放到 `apps/momo/src/modules/<module>`。

## 当前接口

| 方法 | 路径 | 返回 |
| ---- | ---- | ---- |
| `GET` | `/` | 服务名称和状态 |
| `GET` | `/health` | 健康检查状态 |
| `POST` | `/rpc/system/ping` | Momo ping 结果 |

## 响应格式

所有接口都返回统一结构。

成功：

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

失败：

```json
{
  "ok": false,
  "error": {
    "code": "COMMON.INVALID_REQUEST",
    "message": "请求参数不正确"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

## 响应示例

### `GET /`

```json
{
  "ok": true,
  "data": {
    "name": "@xdd-zone/momo",
    "status": "ok"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

### `GET /health`

```json
{
  "ok": true,
  "data": {
    "env": "test",
    "service": "momo",
    "status": "ok"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

### `POST /rpc/system/ping`

请求：

```json
{
  "name": "fifa"
}
```

返回：

```json
{
  "ok": true,
  "data": {
    "env": "test",
    "service": "momo",
    "message": "pong, fifa"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

## 本地验证

先启动 Momo：

```bash
pnpm dev:momo
```

再请求：

```bash
curl http://localhost:7788/
curl http://localhost:7788/health
curl -X POST http://localhost:7788/rpc/system/ping \
  -H 'content-type: application/json' \
  -d '{"name":"fifa"}'
```

## 新增接口

按模块新增 route 文件：

```text
apps/momo/src/modules/<module>/<module>.route.ts
```

再到 `apps/momo/src/routes/index.ts` 挂载。

如果接口有请求体或返回体，先在 `packages/contracts/src/<module>` 增加 schema 和类型。
