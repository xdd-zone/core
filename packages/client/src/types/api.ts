/**
 * API 基础类型定义
 */

import type { ApiError, PaginatedList, PaginationQuery } from '@xdd-zone/schema/shared'

export type { ApiError, PaginatedList, PaginationQuery }

export interface PaginationResponse {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface SoftDeleteOptions {
  includeDeleted?: boolean
}

export interface KeywordSearchOptions {
  keyword?: string
  searchFields?: string[]
}
