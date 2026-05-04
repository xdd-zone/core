import type { Prisma } from '@nexus-prisma/generated/client'
import type { PublicSiteConfig, PublicSitePost, PublicSitePostSummary } from './model'
import type { PublicSiteCategoryData, PublicSitePostDetailData, PublicSitePostSummaryData } from './types'
import { serializeDateTime } from '@nexus/shared/schema'
import { PublicSiteConfigSchema } from './model'

export const DEFAULT_PUBLIC_SITE_CONFIG = {
  title: 'XDD Zone',
  subtitle: null,
  description: null,
  logo: null,
  favicon: null,
  footerText: null,
  socialLinks: {},
  defaultSeoTitle: null,
  defaultSeoDescription: null,
} satisfies PublicSiteConfig

export function normalizePublicSiteSocialLinks(value: Prisma.JsonValue | null | undefined) {
  return PublicSiteConfigSchema.shape.socialLinks.parse(value ?? {})
}

export function serializePublicSiteConfig(config: {
  title: string
  subtitle: string | null
  description: string | null
  logo: string | null
  favicon: string | null
  footerText: string | null
  socialLinks?: Prisma.JsonValue | null
  defaultSeoTitle: string | null
  defaultSeoDescription: string | null
}): PublicSiteConfig {
  return {
    ...config,
    socialLinks: normalizePublicSiteSocialLinks(config.socialLinks),
  }
}

export function serializePublicSiteCategory(category: PublicSiteCategoryData) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    postCount: category._count.posts,
  }
}

export function serializePublicSitePostSummary(post: PublicSitePostSummaryData): PublicSitePostSummary {
  return {
    ...post,
    publishedAt: serializeDateTime(post.publishedAt ?? post.createdAt),
    createdAt: serializeDateTime(post.createdAt),
    updatedAt: serializeDateTime(post.updatedAt),
  }
}

export function serializePublicSitePost(post: PublicSitePostDetailData): PublicSitePost {
  return {
    ...post,
    publishedAt: serializeDateTime(post.publishedAt ?? post.createdAt),
    createdAt: serializeDateTime(post.createdAt),
    updatedAt: serializeDateTime(post.updatedAt),
  }
}
