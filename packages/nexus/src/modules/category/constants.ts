import type { Prisma } from '@nexus-prisma/generated/client'

export const CATEGORY_BASE_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  sortOrder: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      posts: true,
    },
  },
} satisfies Prisma.CategorySelect

export const CATEGORY_SEARCH_FIELDS = ['name', 'slug', 'description'] as const
