import type { Prisma } from '@nexus-prisma/generated/client'
import type { SiteConfig, SiteSocialLinks } from './model'
import type { SiteConfigRecord } from './repository'
import { serializeDateTime } from '@nexus/shared/schema'
import { SiteSocialLinksSchema } from './model'

export function normalizeSiteSocialLinks(value: Prisma.JsonValue | null | undefined): SiteSocialLinks {
  return SiteSocialLinksSchema.parse(value ?? {})
}

export function serializeSiteConfig(config: SiteConfigRecord): SiteConfig {
  return {
    ...config,
    socialLinks: normalizeSiteSocialLinks(config.socialLinks),
    createdAt: serializeDateTime(config.createdAt),
    updatedAt: serializeDateTime(config.updatedAt),
  }
}
