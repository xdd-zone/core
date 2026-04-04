# XDD Zone Nexus 代码参考

## 目录

1. 当前后端结构
2. 写模块时先看哪里
3. 标准生成顺序
4. route / model / service / repository 骨架
5. `public/*` 导出约定
6. 检查清单

## 当前后端结构

当前 `packages/nexus/src/` 主要按下面几层组织：

```text
src/
├── app.ts
├── server.ts
├── modules/
├── core/
├── infra/
├── public/
├── shared/
└── eden/
```

关键结论：

- `modules/*/index.ts` 直接定义模块路由
- `model.ts` 统一放 body / query / params / response schema
- `service.ts` 做业务编排
- `repository.ts` 或 `*.repository.ts` 放 Prisma 查询
- `public/*-types.ts` 给 Console 复用 HTTP 类型
- `public/permissions.ts` 给 Console 复用权限常量和 helper
- `shared/openapi` 统一放 `apiDetail(...)`

不要继续参考旧的 `contract.ts`、`routes/*.route.ts`、`core/access-control` 结构。

## 写模块时先看哪里

最常用的现成实现：

- 用户模块：`packages/nexus/src/modules/user/`
- RBAC 模块：`packages/nexus/src/modules/rbac/`
- 认证模块：`packages/nexus/src/modules/auth/`

权限与认证：

- `packages/nexus/src/core/security/plugins/`
- `packages/nexus/src/core/security/auth/`
- `packages/nexus/src/core/security/permissions/`

公开导出：

- `packages/nexus/src/public/auth-types.ts`
- `packages/nexus/src/public/user-types.ts`
- `packages/nexus/src/public/rbac-types.ts`
- `packages/nexus/src/public/permissions.ts`
- `packages/nexus/src/public/eden.ts`

## 标准生成顺序

新增或修改接口时，默认按下面顺序：

1. 改 `model.ts`
2. 改 `service.ts / repository.ts`
3. 改模块 `index.ts`
4. 按需补 `packages/nexus/src/public/*-types.ts`
5. 回归 `/openapi`、Eden 和测试

如果只是内部能力，不要为了形式额外补一层调用方包装。

## route / model / service / repository 骨架

### model.ts

```ts
import { z } from 'zod'

import { createPaginatedListSchema, PaginationQuerySchema } from '@nexus/shared/schema'

export const ExampleIdParamsSchema = z.object({
  id: z.string().min(1, 'ID 不能为空'),
})

export const ExampleQuerySchema = PaginationQuerySchema.extend({
  keyword: z.string().trim().optional(),
})

export const ExampleSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const ExampleListSchema = createPaginatedListSchema(ExampleSchema)

export type ExampleIdParams = z.infer<typeof ExampleIdParamsSchema>
export type ExampleQuery = z.infer<typeof ExampleQuerySchema>
export type Example = z.infer<typeof ExampleSchema>
export type ExampleList = z.infer<typeof ExampleListSchema>
```

规则：

- 先用 schema 把 body / query / params / response 定义清楚
- route 复用的 HTTP 类型优先直接从 schema 推导
- 真正动态的数据先用 `unknown`，再 parse 或收窄

### index.ts

```ts
import { accessPlugin, Permissions } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'

import { ExampleIdParamsSchema, ExampleListSchema, ExampleQuerySchema } from './model'
import { ExampleService } from './service'

export const exampleModule = new Elysia({
  name: 'example-module',
  prefix: '/example',
  tags: ['Example'],
})
  .use(accessPlugin)
  .get('/', async ({ query }) => await ExampleService.list(query), {
    permission: Permissions.USER.READ_ALL,
    query: ExampleQuerySchema,
    response: ExampleListSchema,
    detail: apiDetail({
      summary: '获取示例列表',
      response: ExampleListSchema,
      errors: [400, 401, 403],
    }),
  })
  .get('/:id', async ({ params }) => await ExampleService.findById(params.id), {
    permission: Permissions.USER.READ_ALL,
    params: ExampleIdParamsSchema,
    response: ExampleListSchema,
    detail: apiDetail({
      summary: '获取示例详情',
      response: ExampleListSchema,
      errors: [401, 403, 404],
    }),
  })
```

规则：

- `index.ts` 只保留 HTTP 结构、鉴权声明和 service 调用
- 只要求登录但不做权限判断时，优先 `authPlugin + auth: 'required'`
- 需要权限、`own`、`me` 时，优先 `accessPlugin`
- `own` 只用于用户自己的资料场景
- 删除类接口返回 `204`

### service.ts

```ts
import type { Example, ExampleList, ExampleQuery } from './model'

import { ExampleRepository } from './repository'

/**
 * 示例服务。
 */
export class ExampleService {
  /**
   * 获取示例列表。
   */
  static async list(query: ExampleQuery): Promise<ExampleList> {
    return await ExampleRepository.list(query)
  }

  /**
   * 获取示例详情。
   */
  static async findById(id: string): Promise<Example> {
    return await ExampleRepository.findById(id)
  }
}
```

规则：

- service 负责业务编排、校验和规则判断
- 方法签名写清楚入参与返回值
- 不要把 Prisma 查询直接塞进 route

### repository.ts

```ts
import type { Prisma } from '@nexus/infra/database/prisma/generated'
import type { Example, ExampleList, ExampleQuery } from './model'

import { prisma } from '@nexus/infra/database'

export class ExampleRepository {
  static async list(query: ExampleQuery): Promise<ExampleList> {
    const where: Prisma.UserWhereInput = {}

    return {
      items: [],
      page: query.page,
      pageSize: query.pageSize,
      total: 0,
      totalPages: 0,
    }
  }

  static async findById(id: string): Promise<Example> {
    return {
      id,
      name: 'example',
    }
  }
}
```

规则：

- repository 负责 Prisma 查询、选择字段和持久化细节
- 优先复用 Prisma 生成类型
- 禁止 `any`、`as any`、`Record<string, any>`

## `public/*` 导出约定

如果 Console 页面要直接复用明确的 HTTP 类型，再按需补这些文件：

- `packages/nexus/src/public/auth-types.ts`
- `packages/nexus/src/public/user-types.ts`
- `packages/nexus/src/public/rbac-types.ts`

如果只是 Treaty 调用，一般不需要额外补导出。

权限运行时工具继续放：

- `packages/nexus/src/public/permissions.ts`

不要把 `permissions` 和 `public/index.ts` 混成一个入口后再到处二次转发。

## 检查清单

- `model.ts` 是否先于 route 更新
- route 是否继续使用 `apiDetail(...)`
- route 是否声明了正确的 `auth / permission / own / me`
- 是否优先复用了现有固定角色和现有权限常量
- service / repository 是否职责清楚
- 是否需要同步 `packages/nexus/src/public/*-types.ts`
- 成功响应是否直接返回业务数据
- 删除类接口是否返回 `204`
- 是否残留 `any`、`as any`、`Promise<any>`、`Record<string, any>`
- 是否需要同步 `/openapi`、Eden smoke、文档

推荐收尾命令：

```bash
rg -n '\\bany\\b|as any\\b' packages/nexus
bun run --filter @xdd-zone/nexus type-check
bun run --filter @xdd-zone/nexus test
```
