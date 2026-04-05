import type { Prisma } from '@nexus/infra/database/prisma/generated/client'
import type { POST_BASE_SELECT } from './constants'

/**
 * 文章基础数据。
 */
export type PostBaseData = Prisma.PostGetPayload<{
  select: typeof POST_BASE_SELECT
}>

/**
 * 文章查询条件。
 */
export type PostWhereInput = Prisma.PostWhereInput
