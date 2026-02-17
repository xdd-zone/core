/**
 * 分页辅助函数
 * - 标准化分页参数
 * - 计算分页元数据
 * - 生成统一的分页响应
 */
import type { PaginatedList, PaginationQuery, PaginationResponse } from '../types'

/**
 * 标准化分页参数
 * 提供默认值并进行边界校验
 */
export function normalizePagination(query: PaginationQuery) {
  const page = typeof query.page === 'number' && Number.isFinite(query.page) && query.page > 0 ? query.page : 1
  const pageSize =
    typeof query.pageSize === 'number' && Number.isFinite(query.pageSize) && query.pageSize > 0 ? query.pageSize : 20

  return { page, pageSize }
}

/**
 * 计算分页元数据
 */
export function calculatePagination(total: number, page: number, pageSize: number): PaginationResponse {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const hasPrevPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  return {
    currentPage,
    hasNextPage,
    hasPrevPage,
    size: pageSize,
    total,
    totalPage: totalPages,
  }
}

/**
 * 创建分页列表响应
 */
export function createPaginatedResponse<T>(list: T[], total: number, page: number, pageSize: number): PaginatedList<T> {
  return {
    list,
    pagination: calculatePagination(total, page, pageSize),
  }
}

/**
 * 计算 Prisma skip 参数
 */
export function calculateSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}
