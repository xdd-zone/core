# API 指南

## 基础信息

- Base URL: `http://localhost:7788/api`
- OpenAPI UI: `http://localhost:7788/openapi`
- OpenAPI JSON: `http://localhost:7788/openapi/json`
- Health: `GET /api/health`

HTTP 接口定义主要放在：

- `packages/nexus/src/modules/*/model.ts`
- `packages/nexus/src/modules/*/index.ts`
- `packages/nexus/src/shared/schema/*`

OpenAPI 作为服务端接口说明导出物保留，供文档、调试与外部集成使用。

## 响应说明

### 成功响应

成功响应直接返回业务数据，不包 `{ code, message, data }`。

分页接口统一返回：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20,
  "totalPages": 0
}
```

无 body 操作统一返回：

- `204 No Content`

### 错误响应

错误响应统一由错误插件输出。

常见状态码：

- `400`
- `401`
- `403`
- `404`
- `409`
- `500`

## 鉴权语义

- `401`
  - 没有有效登录态
- `403`
  - 有登录态，但不满足权限要求

当前 route 常用声明：

- `auth: 'required'`
- `permission`
- `own`
- `me`

## 模块概览

### Health

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/health` | 健康检查 |

### Auth

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| POST | `/api/auth/sign-up/email` | 注册用户 |
| POST | `/api/auth/sign-in/email` | 登录 |
| POST | `/api/auth/sign-out` | 登出，返回 `204` |
| GET | `/api/auth/get-session` | 获取 session |
| GET | `/api/auth/me` | 获取登录用户 |

### User

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/user/me` | 获取当前用户资料 |
| PATCH | `/api/user/me` | 更新当前用户资料 |
| GET | `/api/user` | 获取用户列表 |
| GET | `/api/user/:id` | 获取用户详情 |
| PATCH | `/api/user/:id` | 更新用户 |
| PATCH | `/api/user/:id/status` | 更新用户状态 |

### RBAC

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/rbac/roles` | 获取角色列表 |
| GET | `/api/rbac/users/:userId/roles` | 获取用户角色 |
| POST | `/api/rbac/users/:userId/roles` | 为用户分配角色 |
| DELETE | `/api/rbac/users/:userId/roles/:roleId` | 移除用户角色，返回 `204` |
| GET | `/api/rbac/users/:userId/permissions` | 获取用户权限 |
| GET | `/api/rbac/users/me/roles` | 获取登录用户角色 |
| GET | `/api/rbac/users/me/permissions` | 获取登录用户权限 |

## 接口来源与使用方式

### 服务端

服务端在模块 `index.ts` 中注册路由，并把 `response` schema 挂到 Elysia 配置中，再通过 `apiDetail(...)` 进入 OpenAPI。

### 内部开发

内部联调优先使用 Eden：

- 直接基于 `createApp()` 的 route 类型
- 用于 smoke test 与类型漂移检查

### OpenAPI 导出

```text
模块 model / index.ts
  -> OpenAPI JSON
  -> 文档、调试与外部集成使用
```
