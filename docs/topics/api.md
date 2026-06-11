# API 指南

这份文档说明当前 Momo API。

## 基础地址

- 服务地址：`http://localhost:7788`
- 健康检查：`http://localhost:7788/health`

当前没有 OpenAPI 页面。

## 代码位置

当前接口放在：

```text
apps/momo/src/modules/system/system.route.ts
apps/momo/src/modules/auth/auth.route.ts
```

相关入口：

- `apps/momo/src/app.ts`
  创建运行时 app，给测试和包导出使用。
- `apps/momo/src/bootstrap/create-app.ts`
  创建 Hono app，注册全局中间件、错误处理、404 和一级路由。
- `apps/momo/src/rpc.ts`
  导出给 Hono RPC client 使用的 `AppType`。
- `apps/momo/src/index.ts`
  直接运行 Momo 时启动 Node 服务。
- `apps/momo/src/routes/index.ts`
  挂载一级路由。
- `apps/momo/src/modules`
  放接口模块。
- `packages/contracts/src`
  放接口 schema、类型和统一响应结构。

后续新增接口按 [apps/momo.md](../apps/momo.md) 放到 `apps/momo/src/modules/<module>`。

## 当前接口

| 方法 | 路径 | 返回 |
| ---- | ---- | ---- |
| `GET` | `/` | 服务名称和状态 |
| `GET` | `/health` | 健康检查状态 |
| `POST` | `/rpc/system/ping` | Momo ping 结果 |
| `GET` | `/rpc/fifa/auth/me` | 当前 fifa 用户 |
| `GET` | `/rpc/bobo/auth/me` | 当前 bobo 用户，未登录时 `user` 为 `null` |
| `GET`/`POST` | `/api/auth/*` | `better-auth` 登录、登出、OAuth callback 和 session cookie |

公开邮箱注册被禁用：

| 方法 | 路径 | 返回 |
| ---- | ---- | ---- |
| `POST` | `/api/auth/sign-up/email` | `403 AUTH.METHOD_NOT_ALLOWED` |

## 响应格式

Momo 自己写的接口返回统一结构。

`/api/auth/*` 交给 `better-auth` 处理，可能返回 `better-auth` 自己的 JSON、重定向响应或 `set-cookie`。不要按下面的统一结构解析 `/api/auth/*`。

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

### `GET /rpc/fifa/auth/me`

未登录时返回：

```json
{
  "ok": false,
  "error": {
    "code": "AUTH.UNAUTHENTICATED",
    "message": "当前请求未登录"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

已登录但没有 `fifa.owner`，或没有 password 登录记录时，返回 403。

通过检查时返回：

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "user-id",
      "displayName": "Owner",
      "avatarUrl": null
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

### `GET /rpc/bobo/auth/me`

未登录时返回：

```json
{
  "ok": true,
  "data": {
    "user": null
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-07T00:00:00.000Z"
  }
}
```

已登录时会检查用户状态，并补上 `bobo.visitor`。返回：

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "user-id",
      "displayName": "Visitor",
      "avatarUrl": null
    }
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
curl -i http://localhost:7788/rpc/fifa/auth/me
curl -i http://localhost:7788/rpc/bobo/auth/me
curl -i -X POST http://localhost:7788/api/auth/sign-up/email \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"password123","name":"Demo"}'
```

## 新增接口

按模块新增 route 文件：

```text
apps/momo/src/modules/<module>/<module>.route.ts
```

再到 `apps/momo/src/routes/index.ts` 挂载。

如果接口有请求体或返回体，先在 `packages/contracts/src/<module>` 增加 schema 和类型。
