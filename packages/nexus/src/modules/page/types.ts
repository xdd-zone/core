import type { Prisma } from '@nexus/infra/database/prisma/generated/client'
import type { PAGE_BASE_SELECT, PAGE_LIST_SELECT } from './constants'

/**
 * 页面列表基础数据。
 */
export type PageListItemBaseData = Prisma.PageGetPayload<{
  select: typeof PAGE_LIST_SELECT
}>

/**
 * 页面详情基础数据。
 */
export type PageBaseData = Prisma.PageGetPayload<{
  select: typeof PAGE_BASE_SELECT
}>

/**
 * 页面查询条件。
 */
export type PageWhereInput = Prisma.PageWhereInput
