# API 指南

## 基础信息

- Base URL: `http://localhost:7788/api`
- OpenAPI: `http://localhost:7788/openapi`
- Health: `GET /api/health`

## 响应协议

### 成功响应

成功响应直接返回业务数据。

示例：

```json
{
  "id": "user_1",
  "name": "Alice",
  "email": "alice@example.com"
}
```

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

无 body 操作统一返回 `204 No Content`。

### 错误响应

错误响应统一由错误插件输出，结构为：

```json
{
  "code": 403,
  "message": "权限不足",
  "data": null,
  "errorCode": "FORBIDDEN",
  "details": {}
}
```

常见状态码：

- `400`：参数错误或业务校验失败
- `401`：未登录
- `403`：已登录但无权限
- `404`：资源不存在
- `409`：资源冲突
- `500`：服务端错误

## 模块概览

### Auth

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| POST | `/api/auth/sign-up/email` | 注册用户 |
| POST | `/api/auth/sign-in/email` | 登录 |
| POST | `/api/auth/sign-out` | 登出，返回 `204` |
| GET | `/api/auth/get-session` | 获取当前 session |
| GET | `/api/auth/me` | 获取当前登录用户 |

### User

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/user` | 获取用户列表 |
| POST | `/api/user` | 创建用户 |
| GET | `/api/user/:id` | 获取用户详情 |
| PATCH | `/api/user/:id` | 更新用户 |
| DELETE | `/api/user/:id` | 删除用户，返回 `204` |

### RBAC

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/rbac/roles` | 获取角色列表 |
| POST | `/api/rbac/roles` | 创建角色 |
| GET | `/api/rbac/roles/:id` | 获取角色详情 |
| PATCH | `/api/rbac/roles/:id` | 更新角色 |
| DELETE | `/api/rbac/roles/:id` | 删除角色，返回 `204` |
| PATCH | `/api/rbac/roles/:id/parent` | 设置父角色 |
| GET | `/api/rbac/roles/:id/children` | 获取子角色 |
| GET | `/api/rbac/permissions` | 获取权限列表 |
| GET | `/api/rbac/permissions/:id` | 获取权限详情 |
| POST | `/api/rbac/permissions` | 创建权限 |
| GET | `/api/rbac/roles/:id/permissions` | 获取角色权限 |
| POST | `/api/rbac/roles/:id/permissions` | 为角色分配权限 |
| PATCH | `/api/rbac/roles/:id/permissions` | 替换角色权限 |
| DELETE | `/api/rbac/roles/:id/permissions/:permissionId` | 移除角色权限，返回 `204` |
| GET | `/api/rbac/users/:userId/roles` | 获取用户角色 |
| POST | `/api/rbac/users/:userId/roles` | 为用户分配角色 |
| DELETE | `/api/rbac/users/:userId/roles/:roleId` | 移除用户角色，返回 `204` |
| PATCH | `/api/rbac/users/:userId/roles/:roleId` | 刷新用户角色缓存，返回 `204` |
| GET | `/api/rbac/users/:userId/permissions` | 获取用户权限 |
| GET | `/api/rbac/users/me/roles` | 获取当前用户角色 |
| GET | `/api/rbac/users/me/permissions` | 获取当前用户权限 |

## 权限语义

- 未登录访问受保护接口：`401`
- 已登录但无权限：`403`
- `permit.own(...)`：自己可访问，带 `:all` 权限的管理员也可访问
- `permit.me(...)`：访问 `/me` 类接口
- `permit.permission(...)`：要求显式权限

## 调试建议

- 优先以 OpenAPI 文档为准查看实际 schema
- 鉴权相关问题先检查 `/api/auth/get-session`
- 分页接口统一检查 `items/total/page/pageSize/totalPages`
