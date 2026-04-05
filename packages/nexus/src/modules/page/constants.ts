import type { Prisma } from '@nexus/infra/database/prisma/generated/client'

/**
 * 页面列表响应字段选择器。
 */
export const PAGE_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  status: true,
  showInNavigation: true,
  sortOrder: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PageSelect

/**
 * 页面详情响应字段选择器。
 */
export const PAGE_BASE_SELECT = {
  ...PAGE_LIST_SELECT,
  markdown: true,
} satisfies Prisma.PageSelect

/**
 * 页面关键字搜索字段。
 */
export const PAGE_SEARCH_FIELDS = ['title', 'slug', 'excerpt'] as const
