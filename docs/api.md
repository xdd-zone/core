# API 指南

这份文档说明当前 API 放在哪里、怎么查看、怎么改。

## 基础地址

- API 根地址：`http://localhost:7788/api`
- OpenAPI 页面：`http://localhost:7788/openapi`
- OpenAPI JSON：`http://localhost:7788/openapi/json`
- 健康检查：`GET /api/health`

## 接口定义放哪里

后端接口主要分布在这些位置：

- `packages/nexus/src/modules/*/index.ts`
  路由、鉴权声明、OpenAPI 说明。
- `packages/nexus/src/modules/*/model.ts`
  body / query / params / response schema。
- `packages/nexus/src/shared/openapi/api-detail.ts`
  `apiDetail(...)`。

## 响应规则

### 成功响应

成功时直接返回业务数据，不包 `{ code, message, data }`。

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

无 body 的删除或退出类接口返回 `204`。
GitHub 登录和回调返回 `302`。

### 错误响应

错误响应统一由后端错误插件处理。

常见状态码：

- `400` 参数不对
- `401` 没登录
- `403` 已登录但没权限
- `404` 资源不存在
- `409` 冲突
- `500` 服务端错误

## 当前接口分组

### Health

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/health` | 健康检查 |

### Auth

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/auth/methods` | 获取当前开放的登录方式 |
| POST | `/api/auth/sign-up/email` | 邮箱注册 |
| POST | `/api/auth/sign-in/email` | 邮箱登录 |
| GET | `/api/auth/sign-in/github` | 发起 GitHub 登录，返回 `302` |
| GET | `/api/auth/callback/github` | 处理 GitHub 回调，返回 `302` |
| POST | `/api/auth/sign-out` | 登出，返回 `204` |
| GET | `/api/auth/get-session` | 获取当前会话 |
| GET | `/api/auth/me` | 获取当前登录用户 |

### User

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/user/me` | 获取当前用户资料 |
| PATCH | `/api/user/me` | 更新当前用户资料 |
| GET | `/api/user` | 获取用户列表 |
| GET | `/api/user/:id` | 获取用户详情 |
| PATCH | `/api/user/:id` | 更新用户资料 |
| PATCH | `/api/user/:id/status` | 更新用户状态 |

### RBAC

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/rbac/roles` | 获取角色列表 |
| GET | `/api/rbac/users/:userId/roles` | 获取指定用户角色 |
| POST | `/api/rbac/users/:userId/roles` | 给用户分配角色 |
| DELETE | `/api/rbac/users/:userId/roles/:roleId` | 移除用户角色 |
| GET | `/api/rbac/users/:userId/permissions` | 获取指定用户权限 |
| GET | `/api/rbac/users/me/roles` | 获取当前用户角色 |
| GET | `/api/rbac/users/me/permissions` | 获取当前用户权限 |

### Post

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/post` | 获取文章列表 |
| POST | `/api/post` | 创建文章 |
| GET | `/api/post/:id` | 获取文章详情 |
| PATCH | `/api/post/:id` | 更新文章 |
| DELETE | `/api/post/:id` | 删除文章 |
| POST | `/api/post/:id/publish` | 发布文章 |
| POST | `/api/post/:id/unpublish` | 取消发布文章 |

### Preview

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | `/api/preview/markdown` | 生成 Markdown 预览 |

### Site Config

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/site-config` | 获取站点配置 |
| PUT | `/api/site-config` | 更新站点配置 |

### Media

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/media` | 获取媒体列表 |
| POST | `/api/media/upload` | 上传媒体 |
| GET | `/api/media/:id` | 获取媒体详情 |
| GET | `/api/media/:id/file` | 读取媒体文件 |
| DELETE | `/api/media/:id` | 删除媒体 |

### Comment

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/comment` | 获取评论列表 |
| GET | `/api/comment/:id` | 获取评论详情 |
| PATCH | `/api/comment/:id/status` | 更新评论状态 |
| DELETE | `/api/comment/:id` | 删除评论 |

## 鉴权写法

当前 route 常用这几种声明：

- `auth: 'required'`
  只要求登录。
- `permission`
  要求明确权限。
- `own`
  当前资源允许“自己访问自己”，也允许有 `:all` 权限的人访问。
- `me`
  用在 `/me` 这种当前用户接口。

## 改接口时的默认顺序

1. 改 `model.ts`
2. 改 `service.ts / repository.ts`
3. 改 `index.ts`
4. 打开 `/openapi` 看说明有没有同步
5. 跑 `bun run --filter @xdd-zone/nexus test`

## 前端怎么接

前端默认不手写 `fetch`，统一走：

- `packages/console/src/shared/api/eden.ts`

需要明确 HTTP 类型时，从 `@xdd-zone/nexus/*-types` 引入。
