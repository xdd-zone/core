/**
 * Prisma 通用服务
 * 封装常用的数据库操作模式
 */

import type { PaginatedList, PaginationQuery } from './types'
import { prisma } from './client'
import { calculateSkip, createPaginatedResponse, normalizePagination } from './helpers/pagination'

/**
 * Prisma 模型键类型
 */
type PrismaModelKey = keyof typeof prisma

type PrismaOrderBy = Record<string, unknown> | Record<string, unknown>[]

interface PaginateDelegate<TItem, TWhere, TSelect, TOrderBy> {
  count: (args: { where: TWhere }) => Promise<number>
  findMany: (args: {
    where: TWhere
    skip: number
    take: number
    select?: TSelect
    orderBy?: TOrderBy
  }) => Promise<TItem[]>
}

interface PaginateOptions<TSelect, TOrderBy> {
  select?: TSelect
  orderBy?: TOrderBy
}

/**
 * Prisma 通用服务类
 * 提供跨模型的通用数据库操作方法
 */
export class PrismaService {
  /**
   * 通用分页查询
   * @param modelKey Prisma 模型键名（如 'user', 'post'）
   * @param where 查询条件
   * @param query 分页参数
   * @param options 额外选项（select, orderBy）
   * @returns 分页结果
   *
   * @example
   * ```typescript
   * const result = await PrismaService.paginate(
   *   'user',
   *   { status: 'ACTIVE' },
   *   { page: 1, pageSize: 20 },
   *   {
   *     select: USER_BASE_SELECT,
   *     orderBy: { id: 'desc' }
   *   }
   * );
   * ```
   */
  static async paginate<TItem, TWhere, TSelect, TOrderBy extends PrismaOrderBy>(
    modelKey: PrismaModelKey,
    where: TWhere,
    query: PaginationQuery,
    options?: PaginateOptions<TSelect, TOrderBy>,
  ): Promise<PaginatedList<TItem>> {
    // 标准化分页参数
    const { page, pageSize } = normalizePagination(query)
    const skip = calculateSkip(page, pageSize)

    // 获取模型委托
    const model = prisma[modelKey] as unknown as PaginateDelegate<TItem, TWhere, TSelect, TOrderBy>

    // 并行查询总数和数据
    const [total, items] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        skip,
        take: pageSize,
        select: options?.select,
        orderBy: options?.orderBy ?? ({ id: 'desc' } as unknown as TOrderBy),
      }),
    ])

    // 返回分页响应
    return createPaginatedResponse(items, total, page, pageSize)
  }
}
