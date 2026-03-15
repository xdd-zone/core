# XDD Zone 代码骨架

这个文件只提供当前仓库的高频骨架与补漏清单。生成代码时，优先参考现有同类文件，再按这里的结构补齐。

## 分层落点

新增一个公开 API 时，通常涉及四层：

1. `packages/schema/src/contracts/<domain>/`
2. `packages/nexus/src/modules/<domain>/`
3. `packages/nexus/src/routes/*.route.ts`
4. `packages/client/src/modules/<domain>/index.ts`

## 类型来源优先级

生成代码时，按下面顺序取类型：

1. schema 推导类型
2. Prisma 生成类型
3. 现有基础泛型
4. 新增语义化模块类型

不要跳过前两层直接写宽泛对象，更不要用 `any` 占位。

## schema 骨架

```ts
import { z } from 'zod'

export const ExampleIdParamsSchema = z.object({
  id: z.string().min(1, 'ID 不能为空'),
})

export type ExampleIdParams = z.infer<typeof ExampleIdParamsSchema>
```

```ts
import { createPaginatedListSchema } from '../../shared/models/paginated-list.schema'
import { ExampleSchema } from './example-response.schema'

export const ExampleListSchema = createPaginatedListSchema(ExampleSchema)

export type ExampleList = typeof ExampleListSchema._output
```

导出时别漏掉对应 `index.ts`。

## route 骨架

```ts
import { Elysia } from 'elysia'
import { Permissions, permit, permissionPlugin } from '@/plugins'
import { apiDetail } from '@/shared'
import * as Schemas from '@/modules/example'
import { ExampleService } from '@/modules/example'

export const exampleRoutes = new Elysia({
  prefix: '/example',
  tags: ['Example'],
})
  .use(permissionPlugin)
  .get('/', async ({ query }) => await ExampleService.list(query), {
    beforeHandle: [permit.permission(Permissions.EXAMPLE.READ_ALL)],
    query: Schemas.ExampleListQuerySchema,
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
import type { ExampleList, ExampleListQuery } from './example.model'
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
import type { ExampleBaseData, ExampleWhereInput } from './example.types'
import type { PaginatedList, PaginationQuery } from '@/infra/database'
import { PrismaService } from '@/infra/database/prisma.service'

export class ExampleRepository {
  static async paginate(where: ExampleWhereInput, query: PaginationQuery): Promise<PaginatedList<ExampleBaseData>> {
    return PrismaService.paginate<ExampleBaseData>('example', where, query, {
      orderBy: { id: 'desc' },
    })
  }
}
```

如果只是轻量封装，也保持 repository 独立，避免 route / service 直接写 Prisma。
即使是示例骨架，也不要用 `object`、`any` 这类无意义类型占位。

## client accessor 骨架

```ts
import { ExampleListQuerySchema, ExampleListSchema, ExampleSchema } from '@xdd-zone/schema/contracts/example'
import type { RequestFn } from '../../core/request'
import type { ExampleList, ExampleListQuery, GetExampleResponse } from '../../types/example'

export function createExampleAccessor(request: RequestFn) {
  return {
    list: {
      get: (query?: ExampleListQuery) =>
        request<ExampleList>('GET', 'example', {
          params: query ? (ExampleListQuerySchema.parse(query) as Record<string, unknown>) : undefined,
          responseSchema: ExampleListSchema,
        }),
    },
    get: (id: string) =>
      request<GetExampleResponse>('GET', `example/${id}`, {
        responseSchema: ExampleSchema,
      }),
  }
}
```

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

- schema 是否先于 route / client 更新
- `index.ts` 导出是否补齐
- route 是否使用正确 plugin
- OpenAPI 是否统一用 `apiDetail(...)`
- 成功响应是否直接返回业务数据
- 删除接口是否返回 `204`
- client 是否只在公开 API 场景下新增
- 是否补了中文 JSDoc
- 是否残留 `any`、`as any`、`Promise<any>`、`Record<string, any>`
- 类型名是否表达业务语义，而不是 `Data`、`Result` 这类空泛命名
- 是否复用了现有模块而不是另起一套风格

推荐在收尾时执行：

```bash
rg -n '\\bany\\b|as any\\b' packages
```
