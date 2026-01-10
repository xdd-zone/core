# API 文档

## API 响应格式

所有 API 响应遵循统一格式：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": { ... }
}
```

- `code`: 0 表示成功，非 0 表示错误（对应 HTTP 状态码）
- `message`: 人类可读的中文消息
- `data`: 响应数据，成功时包含数据，失败时为 `null`

## 核心 API 端点

### 认证模块 (`/api/auth/*`)

| 方法 | 路径                      | 描述                       |
| ---- | ------------------------- | -------------------------- |
| POST | `/api/auth/sign-up/email` | 用户注册（邮箱密码）       |
| POST | `/api/auth/sign-in/email` | 用户登录（邮箱密码）       |
| POST | `/api/auth/sign-out`      | 用户登出                   |
| GET  | `/api/auth/get-session`   | 获取当前会话               |
| GET  | `/api/auth/me`            | 获取当前用户信息（需认证） |

### 用户模块 (`/api/user/*`)

| 方法   | 路径            | 描述         |
| ------ | --------------- | ------------ |
| GET    | `/api/user`     | 获取用户列表 |
| GET    | `/api/user/:id` | 获取用户详情 |
| PATCH  | `/api/user/:id` | 更新用户信息 |
| DELETE | `/api/user/:id` | 删除用户     |

### RBAC 模块 (`/api/rbac/*`)

| 方法   | 路径                              | 描述           |
| ------ | --------------------------------- | -------------- |
| GET    | `/api/rbac/roles`                 | 获取角色列表   |
| POST   | `/api/rbac/roles`                 | 创建角色       |
| GET    | `/api/rbac/roles/:id`             | 获取角色详情   |
| PATCH  | `/api/rbac/roles/:id`             | 更新角色       |
| DELETE | `/api/rbac/roles/:id`             | 删除角色       |
| POST   | `/api/rbac/roles/:id/permissions` | 为角色分配权限 |
| GET    | `/api/rbac/permissions`           | 获取权限列表   |
| POST   | `/api/rbac/permissions`           | 创建权限       |
| POST   | `/api/rbac/users/:userId/roles`   | 为用户分配角色 |

## 访问 API 文档

启动服务后，访问 OpenAPI 文档：

```
http://localhost:7788/openapi
```
