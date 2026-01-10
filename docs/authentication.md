# 认证系统

项目使用 Better Auth 作为认证解决方案。

## 特性

- **基于 Session**: 使用 HttpOnly Cookie 存储 session token
- **自动刷新**: Session 有效期 7 天，自动续期
- **邮箱验证**: 支持邮箱验证流程
- **标准端点**: 提供标准的认证端点（sign-up, sign-in, sign-out）

## Session 机制

- 登录成功后，服务器返回 `Set-Cookie` header
- 客户端自动携带 cookie 访问需要认证的接口
- Session 存储在数据库中（`session` 表）

## 认证流程

1. **注册**: POST `/api/auth/sign-up/email`
2. **登录**: POST `/api/auth/sign-in/email` → 返回 session cookie
3. **访问受保护资源**: 自动携带 session cookie
4. **登出**: POST `/api/auth/sign-out` → 清除 session cookie

## API 端点

| 方法 | 路径                      | 描述                       |
| ---- | ------------------------- | -------------------------- |
| POST | `/api/auth/sign-up/email` | 用户注册（邮箱密码）       |
| POST | `/api/auth/sign-in/email` | 用户登录（邮箱密码）       |
| POST | `/api/auth/sign-out`      | 用户登出                   |
| GET  | `/api/auth/get-session`   | 获取当前会话               |
| GET  | `/api/auth/me`            | 获取当前用户信息（需认证） |

## 添加认证保护

使用 `authGuard` 守卫保护需要登录的路由：

```typescript
import { authGuard } from '@/core'

export const myModule = new Elysia()
  .use(authGuard({ required: true })) // 需要认证
  .get('/protected', () => '需要登录才能访问')
```

## 配置

在 `.env` 文件中配置：

```env
# Better Auth 配置
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:7788"
```

## 故障排查

1. 确保在请求中正确携带 cookie
2. 检查 `BETTER_AUTH_SECRET` 和 `BETTER_AUTH_URL` 配置
3. 使用 `/api/auth/get-session` 端点验证 session 状态
