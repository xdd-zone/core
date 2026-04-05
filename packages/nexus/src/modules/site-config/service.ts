import type { Prisma } from '@nexus/infra/database/prisma/generated'
import type { SiteConfig, SiteSocialLinks, UpdateSiteConfigBody } from './model'
import type { SiteConfigRecord } from './repository'
import { SiteConfigSchema, SiteSocialLinksSchema } from './model'
import { SiteConfigRepository } from './repository'

const DEFAULT_SITE_CONFIG = {
  title: 'XDD Zone',
} as const

function normalizeSocialLinks(value: Prisma.JsonValue | null | undefined): SiteSocialLinks {
  return SiteSocialLinksSchema.parse(value ?? {})
}

function serializeSiteConfig(config: SiteConfigRecord): SiteConfig {
  return SiteConfigSchema.parse({
    ...config,
    socialLinks: normalizeSocialLinks(config.socialLinks),
  })
}

/**
 * 站点配置服务类。
 */
export class SiteConfigService {
  /**
   * 读取站点配置，不存在时自动初始化默认记录。
   */
  static async get(): Promise<SiteConfig> {
    return serializeSiteConfig(await SiteConfigRepository.ensureDefault(DEFAULT_SITE_CONFIG))
  }

  /**
   * 更新站点配置。
   */
  static async update(data: UpdateSiteConfigBody): Promise<SiteConfig> {
    return serializeSiteConfig(await SiteConfigRepository.updateDefault(data, DEFAULT_SITE_CONFIG))
  }
}
