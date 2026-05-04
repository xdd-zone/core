import type { Prisma } from '@nexus-prisma/generated/client'

export const PUBLIC_SITE_CONFIG_SELECT = {
  title: true,
  subtitle: true,
  description: true,
  logo: true,
  favicon: true,
  footerText: true,
  socialLinks: true,
  defaultSeoTitle: true,
  defaultSeoDescription: true,
} satisfies Prisma.SiteConfigSelect

export const PUBLIC_SITE_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  sortOrder: true,
  _count: {
    select: {
      posts: {
        where: {
          status: 'PUBLISHED',
        },
      },
    },
  },
} satisfies Prisma.CategorySelect

export const PUBLIC_SITE_POST_SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
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

export const PUBLIC_SITE_POST_DETAIL_SELECT = {
  ...PUBLIC_SITE_POST_SUMMARY_SELECT,
  markdown: true,
} satisfies Prisma.PostSelect

export const PUBLIC_SITE_POST_SEARCH_FIELDS = ['title', 'slug', 'excerpt'] as const
export const PUBLIC_SITE_CATEGORY_SEARCH_FIELDS = ['name', 'slug', 'description'] as const
