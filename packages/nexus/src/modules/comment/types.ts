import type { Prisma } from '@nexus/infra/database/prisma/generated/client'
import type { COMMENT_BASE_SELECT } from './constants'

/**
 * 评论基础数据。
 */
export type CommentBaseData = Prisma.CommentGetPayload<{
  select: typeof COMMENT_BASE_SELECT
}>

/**
 * 评论查询条件。
 */
export type CommentWhereInput = Prisma.CommentWhereInput
