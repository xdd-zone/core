# @xdd-zone/client

XDD Zone HTTP Client SDK - HTTP 客户端

## 快速开始

```typescript
import { createClient } from '@xdd-zone/client'

const client = createClient({
  baseURL: 'http://localhost:7788',
  timeout: 30000,
})

// 树形语法 API
const users = await client.user.list.get({ page: 1, pageSize: 20 })
await client.auth.signIn.post({ email: 'user@example.com', password: 'password' })
```

## 安装

```bash
bun add @xdd-zone/client
# 或 npm/pnpm
```

## 核心 API

### 语法

```typescript
// Auth
await client.auth.signUp.post({ email, password, name })
await client.auth.signIn.post({ email, password, rememberMe: true })
const session = await client.auth.getSession.get()
const me = await client.auth.me.get()
await client.auth.signOut.post()

// User
const users = await client.user.list.get({ page: 1, pageSize: 20, keyword: '搜索' })
const user = await client.user('user-id').get()
await client.user.create.post({ name: '新用户', email: 'new@example.com' })
await client.user('user-id').patch({ name: '新名称' })
await client.user('user-id').delete()

// RBAC
const roles = await client.rbac.roles.list.get({ page: 1 })
const role = await client.rbac.roles('role-id').get()
```

### 认证

```typescript
// Cookie 自动管理（登录后自动保存，登出后自动清除）
await client.auth.signIn.post({ email, password })

// 手动控制
const cookies = client.getCookies()
client.setCookie('session=xxx')
client.clearCookies()
```

### 错误处理

```typescript
import { ApiError, UnauthorizedError, ForbiddenError, isAuthError } from '@xdd-zone/client'

try {
  const response = await client.get('/api/protected')
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // 401 未授权
  } else if (error instanceof ForbiddenError) {
    // 403 无权限
  } else if (error instanceof ApiError) {
    console.error(error.code, error.message)
  }
}

// 错误码
ERROR_CODES.UNAUTHORIZED  // 401
ERROR_CODES.FORBIDDEN     // 403
ERROR_CODES.NOT_FOUND     // 404
isAuthError(code)         // 401 或 403
```

### 日志

```typescript
import { logger, setLogLevel } from '@xdd-zone/client'

setLogLevel('DEBUG')  // DEBUG / INFO / WARN / OFF
logger.debug('调试', { data })
logger.info('信息', { data })
logger.warn('警告', { data })

// 环境变量: XDD_CLIENT_LOG_LEVEL=DEBUG
```

### 拦截器

```typescript
// 请求拦截器
client.onRequest(async (method, path, options) => {
  const token = getToken()
  return {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  }
})

// 响应拦截器
client.onResponse(async (data, status) => {
  if (status === 401) await refreshToken()
  return data
})
```

### 配置

```typescript
interface ClientOptions {
  baseURL: string           // API 基础地址
  headers?: Record<string, string>  // 默认请求头
  timeout?: number          // 超时时间（毫秒），默认 30000
}
```

## 构建

```bash
bun run dev          # 开发
bun run build        # 构建
bun run type-check   # 类型检查
bun run lint         # 代码检查
```

## 许可证

MIT
