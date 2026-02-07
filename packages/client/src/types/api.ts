/**
 * API 基础类型定义
 *
 * 提供统一的请求，与/响应类型 nexus 后端保持一致
 */

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  /** 页码，从 1 开始 */
  page?: number
  /** 每页数量，默认 20 */
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
 * API 统一响应格式
 *
 * 所有 API 响应遵循此格式：
 * { code: number; message: string; data: T }
 */
export interface ApiResponse<T = unknown> {
  /** 0 表示成功，非 0 表示错误 */
  code: number
  /** 消息描述 */
  message: string
  /** 业务数据 */
  data: T
}

/**
 * 软删除查询选项
 */
export interface SoftDeleteOptions {
  /** 是否包含已删除记录 */
  includeDeleted?: boolean
}

/**
 * 关键字搜索选项
 */
export interface KeywordSearchOptions {
  /** 搜索关键字 */
  keyword?: string
  /** 搜索字段列表 */
  searchFields?: string[]
}
