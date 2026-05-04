import type { Prisma } from '@nexus-prisma/generated/client'

/**
 * 文章响应字段选择器。
 */
export const POST_BASE_SELECT = {
  id: true,
  title: true,
  slug: true,
  markdown: true,
  excerpt: true,
  coverImage: true,
  status: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  tags: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PostSelect

/**
 * 文章关键字搜索字段。
 */
export const POST_SEARCH_FIELDS = ['title', 'slug', 'excerpt'] as const
