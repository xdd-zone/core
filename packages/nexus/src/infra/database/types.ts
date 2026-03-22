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
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/**
 * 分页列表响应
 */
export interface PaginatedList<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 关键字搜索选项
 */
export interface KeywordSearchOptions {
  keyword?: string
  searchFields?: string[]
}
