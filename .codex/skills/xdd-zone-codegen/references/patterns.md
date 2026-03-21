# XDD Zone 代码骨架

这个文件提供仓库内常见代码骨架与补漏清单。生成代码时，优先参考现有同类文件，再按这里的结构补齐。

## 分层落点

新增一个公开 API 时，通常涉及四层：

1. `packages/nexus/src/modules/<domain>/<domain>.contract.ts`
2. `packages/nexus/src/modules/<domain>/`
3. `packages/nexus/src/routes/*.route.ts`
4. `packages/nexus/openapi/openapi.json` 或相关导出

## 类型来源优先级

生成代码时，按下面顺序取类型：

1. contract / shared schema 推导类型
2. Prisma 生成类型
3. 现有基础泛型
4. 新增语义化模块类型

不要跳过前两层直接写宽泛对象，更不要用 `any` 占位。

## contract 骨架

```ts
import { z } from 'zod'

export const ExampleIdParamsSchema = z.object({
  id: z.string().min(1, 'ID 不能为空'),
})

export type ExampleIdParams = z.infer<typeof ExampleIdParamsSchema>
```

```ts
import { createPaginatedListSchema } from '@/shared/schema'

export const ExampleSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const ExampleListSchema = createPaginatedListSchema(ExampleSchema)

export type ExampleList = typeof ExampleListSchema._output
```

导出时别漏掉对应 `index.ts`。

## route 骨架

```ts
import { Elysia } from 'elysia'
import { Permissions, permissionPlugin } from '@/core/access-control'
import { apiDetail } from '@/shared/openapi'
import * as Schemas from '@/modules/example'
import { ExampleService } from '@/modules/example'

export const exampleRoutes = new Elysia({
  prefix: '/example',
  tags: ['Example'],
})
  .use(permissionPlugin)
  .get('/', async ({ query }) => await ExampleService.list(query), {
    permission: Permissions.EXAMPLE.READ_ALL,
    query: Schemas.ExampleListQuerySchema,
    response: Schemas.ExampleListSchema,
    detail: apiDetail({
      summary: '获取示例列表',
      response: Schemas.ExampleListSchema,
      errors: [400, 401, 403],
    }),
  })
```

路由文件只保留 HTTP 结构，不把复杂业务塞进 handler。

## service 骨架

```ts
import type { ExampleList, ExampleListQuery } from './example.contract'
import { ExampleRepository } from './example.repository'

/**
 * 示例服务类
 */
export class ExampleService {
  /**
   * 获取示例列表
   */
  static async list(query: ExampleListQuery): Promise<ExampleList> {
    return await ExampleRepository.paginate({}, query)
  }
}
```

service 负责业务编排、参数转换和调用 repository。

## repository 骨架

```ts
import type { Prisma } from '@/infra/database/prisma/generated'

import type { ExampleListQuery } from './example.contract'
import type { ExampleBaseData } from './example.types'
import type { PaginatedList } from '@/infra/database'
import { PrismaService } from '@/infra/database/prisma.service'

export class ExampleRepository {
  static async paginate(
    where: Prisma.ExampleWhereInput,
    query: ExampleListQuery,
  ): Promise<PaginatedList<ExampleBaseData>> {
    return await PrismaService.paginate<ExampleBaseData>('example', where, query, {
      orderBy: { createdAt: 'desc' },
    })
  }
}
```

如果只是轻量封装，也保持 repository 独立，避免 route / service 直接写 Prisma。
即使是示例骨架，也不要用 `object`、`any` 这类无意义类型占位。

## 常见坏味道与替代写法

坏味道：

```ts
async function getDetail(id: string): Promise<any> {}
```

替代：

```ts
async function getDetail(id: string): Promise<ExampleDetail | null> {}
```

坏味道：

```ts
const payload = body as any
```

替代：

```ts
const payload = CreateExampleBodySchema.parse(body)
```

坏味道：

```ts
type Query = Record<string, any>
```

替代：

```ts
type Query = ExampleListQuery
```

如果确实拿到外部动态数据，先定义为 `unknown`，再显式收窄。

## 生成完成后的检查清单

- contract 是否先于 route 更新
- `index.ts` 导出是否补齐
- route 是否使用正确 plugin 与声明式权限字段
- OpenAPI 是否统一用 `apiDetail(...)`
- 成功响应是否直接返回业务数据
- 删除接口是否返回 `204`
- 是否补了中文 JSDoc
- 是否残留 `any`、`as any`、`Promise<any>`、`Record<string, any>`
- 类型名是否表达业务语义，而不是 `Data`、`Result` 这类空泛命名
- 是否复用了现有模块而不是另起一套风格

推荐在收尾时执行：

```bash
rg -n '\\bany\\b|as any\\b' packages
```
