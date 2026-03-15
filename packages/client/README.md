# @xdd-zone/client

`@xdd-zone/client` 是 XDD Zone Core 的 HTTP Client SDK。

设计目标：

- 默认直接返回业务数据
- 内置 cookie 管理
- 通过 schema 对请求与响应做 parse
- 对错误状态抛出结构化异常

## 安装

```bash
bun add @xdd-zone/client
```

## 快速开始

```ts
import { createClient } from '@xdd-zone/client'

const client = createClient({
  baseURL: 'http://localhost:7788/api',
  timeout: 30000,
})

await client.auth.signIn.post({
  email: 'user@example.com',
  password: 'password',
})

const me = await client.auth.me.get()
const users = await client.user.list.get({ page: 1, pageSize: 20 })
```

## 当前行为

### 成功响应

高层 API 默认直接返回业务数据：

```ts
const user = await client.user.get('user-id')
const roles = await client.rbac.roles.list.get({ page: 1 })
```

### 原始响应

如果需要 `status` 和 `headers`，使用 `requestRaw(...)`：

```ts
const response = await client.requestRaw('GET', 'user', {
  params: { page: 1, pageSize: 20 },
})

console.log(response.status)
console.log(response.data)
```

### 错误处理

```ts
import { ApiError, UnauthorizedError, ForbiddenError } from '@xdd-zone/client'

try {
  await client.auth.me.get()
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // 401
  } else if (error instanceof ForbiddenError) {
    // 403
  } else if (error instanceof ApiError) {
    console.error(error.status, error.code, error.message)
  }
}
```

## 认证与 cookie

登录成功后，client 会自动保存 cookie，后续请求自动附带。

```ts
await client.auth.signIn.post({ email, password })

const session = await client.auth.getSession.get()
console.log(session.isAuthenticated)
```

也可以手动控制：

```ts
client.setCookie('session=xxx')
client.getCookies()
client.clearCookies()
```

## 配置

```ts
const client = createClient({
  baseURL: 'http://localhost:7788/api',
  headers: {
    Authorization: 'Bearer token',
  },
  timeout: 30000,
})
```

说明：

- 默认 `headers` 会注入所有请求
- 默认 `timeout` 会作用于所有请求
- 单次请求可以覆盖默认 timeout

## headers 合并规则

client 会保留内部头并与自定义头合并：

- 默认 headers
- 单次请求 headers
- 请求拦截器返回的 headers
- 内部 `Cookie` / `Origin` / `Content-Type`

因此，自定义 `Authorization` 不会再覆盖自动 cookie。

## 请求拦截器

```ts
client.onRequest((method, path, options) => {
  return {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${getToken()}`,
    },
  }
})
```

## 响应拦截器

```ts
client.onResponse((data, status) => {
  console.log(status)
  return data
})
```

## 模块访问器

### Auth

```ts
await client.auth.signUp.post({ email, password, name })
await client.auth.signIn.post({ email, password })
await client.auth.getSession.get()
await client.auth.me.get()
await client.auth.signOut.post()
```

### User

```ts
await client.user.list.get({ page: 1, pageSize: 20 })
await client.user.create({ name: 'Alice', email: 'alice@example.com' })
await client.user('user-id').get()
await client.user('user-id').patch({ name: 'Alice 2' })
await client.user('user-id').delete()
```

### RBAC

```ts
await client.rbac.roles.list.get({ page: 1 })
await client.rbac.roles('role-id').get()
await client.rbac.permissions.list.get({ page: 1 })
await client.rbac.users.me.roles.get()
await client.rbac.users.me.permissions.get()
```

## 集成脚本

仓库内提供了一个权限边界集成脚本：

```bash
bun packages/client/test-integration.ts
```

它会：

- 校验管理员 happy path
- 校验匿名 `401`
- 自动注册临时普通用户
- 校验普通用户 own/me 成功与管理员接口 `403`
- 最后自动删除临时用户
