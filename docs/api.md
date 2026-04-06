# API 指南

## 基础信息

- Base URL: `http://localhost:7788/api`
- OpenAPI 页面: `http://localhost:7788/openapi`
- OpenAPI 文档接口: `http://localhost:7788/openapi/json`
- Health: `GET /api/health`

HTTP 接口定义主要放在：

- `packages/nexus/src/modules/*/model.ts`
- `packages/nexus/src/modules/*/index.ts`
- `packages/nexus/src/shared/schema/*`

OpenAPI 用来查看当前接口说明，可用于联调、调试和外部接入。

## 响应说明

### 成功响应

成功响应直接返回业务数据，不含 `{ code, message, data }`。

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
- `302 Found`

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
| GET | `/api/auth/methods` | 获取当前开放的登录方式 |
| POST | `/api/auth/sign-up/email` | 注册用户 |
| POST | `/api/auth/sign-in/email` | 登录 |
| GET | `/api/auth/sign-in/github` | 发起 GitHub 登录，成功返回 `302` |
| GET | `/api/auth/callback/github` | 处理 GitHub 回调，写 session cookie 后返回 `302` |
| POST | `/api/auth/sign-out` | 登出，返回 `204` |
| GET | `/api/auth/get-session` | 获取当前会话 |
| GET | `/api/auth/me` | 获取当前登录用户 |

补充说明：

- `/api/auth/methods` 返回 `methods` 数组，字段包含 `id`、`kind`、`enabled`、`allowSignUp`
- GitHub 登录相关接口由浏览器完成重定向，不返回 JSON body
- `/api/auth/sign-in/github` 支持 `callbackURL` query

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

### Post

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/post` | 获取文章列表 |
| POST | `/api/post` | 创建文章 |
| GET | `/api/post/:id` | 获取文章详情 |
| PATCH | `/api/post/:id` | 更新文章 |
| DELETE | `/api/post/:id` | 删除文章，返回 `204` |
| POST | `/api/post/:id/publish` | 发布文章 |
| POST | `/api/post/:id/unpublish` | 取消发布文章 |

补充说明：

- 列表 query 支持 `page`、`pageSize`、`keyword`、`status`、`category`、`tag`
- 创建和更新 body 使用这些字段：`title`、`slug`、`markdown`、`excerpt`、`coverImage`、`category`、`tags`
- `status` 当前只支持 `draft` 和 `published`

### Preview

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| POST | `/api/preview/markdown` | 生成 Markdown 预览 |

补充说明：

- body 支持 `type`、`markdown`、`title`、`excerpt`、`coverImage`
- `type` 当前只支持 `post`
- 返回字段包含 `html`、`toc`、`excerpt`

### SiteConfig

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/site-config` | 获取站点配置 |
| PUT | `/api/site-config` | 更新站点配置 |

补充说明：

- 当前是单例配置接口
- 更新 body 支持 `title`、`subtitle`、`description`、`logo`、`favicon`、`footerText`、`socialLinks`、`defaultSeoTitle`、`defaultSeoDescription`

### Media

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/media` | 获取媒体列表 |
| POST | `/api/media/upload` | 上传媒体 |
| GET | `/api/media/:id` | 获取媒体详情 |
| GET | `/api/media/:id/file` | 读取媒体文件 |
| DELETE | `/api/media/:id` | 删除媒体，返回 `204` |

补充说明：

- 列表 query 支持 `page`、`pageSize`
- 上传接口使用 `multipart/form-data`
- body 字段为 `file`，单文件最大 `10MB`

### Comment

| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET | `/api/comment` | 获取评论列表 |
| GET | `/api/comment/:id` | 获取评论详情 |
| PATCH | `/api/comment/:id/status` | 更新评论状态 |
| DELETE | `/api/comment/:id` | 删除评论，返回 `204` |

补充说明：

- 列表 query 支持 `page`、`pageSize`、`status`、`postId`、`keyword`、`createdFrom`、`createdTo`
- 评论状态当前支持 `pending`、`approved`、`hidden`、`deleted`
- 更新状态接口的 body 字段为 `status`，只允许传 `pending`、`approved`、`hidden`

## 接口来源与使用方式

### 服务端

服务端在模块 `index.ts` 中注册路由，并把 `response` schema 挂到 Elysia 配置中，再通过 `apiDetail(...)` 进入 OpenAPI。

### 内部开发

内部联调优先使用 Eden：

- 直接基于 `createApp()` 的 route 类型
- Console 的 HTTP 类型统一从 `packages/nexus/src/public/*-types.ts` 导出
- Console 的 query / mutation 直接调用 Treaty 客户端
- 用于 smoke test 与类型漂移检查

### OpenAPI 入口

```text
模块 model / index.ts
  -> /openapi
  -> /openapi/json
```
