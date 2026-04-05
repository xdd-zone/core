import type { Prisma } from '@nexus/infra/database/prisma/generated/client'

/**
 * 评论响应字段选择器。
 */
export const COMMENT_BASE_SELECT = {
  id: true,
  postId: true,
  authorName: true,
  authorEmail: true,
  content: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CommentSelect

/**
 * 评论关键字搜索字段。
 */
export const COMMENT_SEARCH_FIELDS = ['authorName', 'authorEmail', 'content'] as const
