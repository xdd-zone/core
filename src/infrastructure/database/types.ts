/**
 * 数据库通用类型定义
 */

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  page?: number
  pageSize?: number
}

/**
 * 分页响应结构
 */
export interface PaginationResponse {
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  size: number
  total: number
  totalPage: number
}

/**
 * 分页列表响应
 */
export interface PaginatedList<T> {
  list: T[]
  pagination: PaginationResponse
}

/**
 * 软删除查询选项
 */
export interface SoftDeleteOptions {
  includeDeleted?: boolean
}

/**
 * 关键字搜索选项
 */
export interface KeywordSearchOptions {
  keyword?: string
  searchFields?: string[]
}
