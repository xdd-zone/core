# 开发指南

## 创建新模块

使用 `createModule()` 工厂创建新模块：

```typescript
// src/modules/my-module/index.ts
import { Elysia } from 'elysia'
import { responsePlugin, ok } from '@/core'

export const myModule = new Elysia({ prefix: '/my-resource' })
  .use(responsePlugin)
  .get('/', () => ok({ items: [] }, '获取成功'))
  .post('/', ({ body, ok }) => ok(body, '创建成功'))
```

在 `src/core/bootstrap/routes.ts` 中注册模块：

```typescript
import { myModule } from '@/modules/my-module'

export function setupRoutes(app: Elysia) {
  const api = new Elysia({ prefix: `/${APP_CONFIG.prefix}` })
  api.use(myModule)
  app.use(api)
  return app
}
```

## 添加认证保护

使用 `authGuard` 守卫保护需要登录的路由：

```typescript
import { authGuard } from '@/core'

export const myModule = new Elysia()
  .use(authGuard({ required: true })) // 需要认证
  .get('/protected', () => '需要登录才能访问')
```

## 添加权限控制

使用权限装饰器和守卫实现精细化权限控制：

```typescript
import { authGuard, RequirePermission } from '@/core'

export const myModule = new Elysia()
  .use(authGuard({ required: true })) // 首先需要登录
  .get(
    '/admin',
    // 在 handler 中使用 @RequirePermission 装饰器
    () => '需要管理员权限',
    {
      beforeHandle: [RequirePermission('user:delete')], // 权限守卫
    },
  )
```

## 添加数据库模型

1. 在 `src/infra/database/prisma/schema/` 创建新的 `.prisma` 文件：

```prisma
// src/infra/database/prisma/schema/post.prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. 在 `src/infra/database/prisma/schema/schema.prisma` 中导入：

```prisma
import Post from './post.prisma'
```

3. 运行命令生成客户端并应用迁移：

```bash
bun run prisma:generate
bun run prisma:migrate
```

## 使用日志

```typescript
import { createModuleLogger } from '@/infra/logger'

const logger = createModuleLogger('my-module')
logger.info({ userId: 123 }, 'User action completed')
logger.error({ error }, 'Operation failed')
```

## 数据库查询

直接使用 Prisma Client：

```typescript
import { prisma } from '@/infra/database'

const users = await prisma.user.findMany()
```

或使用 Repository 模式（推荐）：

```typescript
import { UserRepository } from '@/modules/user/user.repository'

const users = await UserRepository.findMany({ status: 'ACTIVE' })
```

## 开发命令

```bash
# 开发模式（热重载）
bun run dev

# 类型检查
bun run type-check

# 代码质量
bun run lint          # 检查代码
bun run lint:fix      # 自动修复问题
bun run format        # 格式化代码
bun run format:check  # 检查格式

# 数据库操作
bun run prisma:generate      # 生成 Prisma Client（schema 修改后必须执行）
bun run prisma:migrate       # 创建并应用新迁移
bun run prisma:reset         # 重置数据库（删除所有数据并重新迁移）
bun run seed                 # 填充种子数据

# 测试数据库（Docker）
bun run test-db              # 交互式菜单
bun run test-db start        # 启动测试数据库（端口 5433）
bun run test-db stop         # 停止测试数据库
bun run test-db status       # 查看测试数据库状态
bun run test-db reset        # 重置测试数据库
```
