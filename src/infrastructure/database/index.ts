/**
 * 数据库模块统一导出
 * - Prisma 客户端实例
 * - 通用辅助函数
 * - 类型定义
 * - Zod 验证 Schemas
 */

// 导出 Prisma 客户端
export { prisma } from './client'

// 导出分页辅助函数
export { calculatePagination, calculateSkip, createPaginatedResponse, normalizePagination } from './helpers/pagination'

// 导出查询构建辅助函数
export { buildKeywordSearch, buildKeywordSearchOptions } from './helpers/query-builder'

// 导出 Prisma 通用服务
export { PrismaService } from './prisma.service'

// 导出 Zod 验证 Schemas
export * from './schemas'

// 导出类型
export type {
  KeywordSearchOptions,
  PaginatedList,
  PaginationQuery,
  PaginationResponse,
  SoftDeleteOptions,
} from './types'
