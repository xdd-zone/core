/**
 * API 基础类型定义
 *
 * 提供统一的请求，与/响应类型 nexus 后端保持一致
 * 注意：分页相关类型从 @xdd-zone/schema 导入，避免重复定义
 */

import type { PaginationQuery, PaginationMeta, PaginatedList, ApiResponse } from '@xdd-zone/schema/shared'

/**
 * 分页查询参数
 *
 * 从 schema 包导入的基础类型
 */
export type { PaginationQuery }

/**
 * 分页响应结构
 *
 * 从 schema 包导入的基础类型
 */
export type { PaginationMeta as PaginationResponse }

/**
 * 分页列表响应
 *
 * 从 schema 包导入的基础类型
 */
export type { PaginatedList }

/**
 * API 统一响应格式
 *
 * 所有 API 响应遵循此格式：
 * { code: number; message: string; data: T }
 *
 * 从 schema 包导入的基础类型
 */
export type { ApiResponse }

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
