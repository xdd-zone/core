/**
 * 查询条件构建辅助函数
 * - 关键字搜索（多字段 OR 查询）
 * - 通用过滤条件构建
 */
import type { KeywordSearchOptions } from '../types'

/**
 * 构建关键字搜索条件（多字段 OR 查询）
 * @param keyword 搜索关键字
 * @param fields 要搜索的字段列表
 * @returns Prisma OR 查询条件
 */
export function buildKeywordSearch(keyword: string | undefined, fields: string[]) {
  if (!keyword || keyword.trim().length === 0 || fields.length === 0) {
    return undefined
  }

  return fields.map((field) => ({
    [field]: { contains: keyword, mode: 'insensitive' as const },
  }))
}

/**
 * 构建关键字搜索选项
 */
export function buildKeywordSearchOptions(options: KeywordSearchOptions) {
  if (!options.keyword || !options.searchFields || options.searchFields.length === 0) {
    return undefined
  }

  return buildKeywordSearch(options.keyword, options.searchFields)
}
