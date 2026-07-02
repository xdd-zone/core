import type { SiteConfig, SiteKey, UpdateSiteConfigRequest } from '@xdd-zone/contracts'
import type { SiteRepository } from './site.repository'
import { BizCode, SiteConfigSchema } from '@xdd-zone/contracts'
import { AppError } from '#momo/shared/app-error'

export function createSiteService(repository: SiteRepository) {
  async function getSiteConfig(siteKey: SiteKey): Promise<SiteConfig> {
    const config = await repository.getSiteConfig(siteKey)
    if (!config) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '站点配置不存在', 404)
    }

    return toSiteConfig(config)
  }

  async function updateSiteConfig(siteKey: SiteKey, input: UpdateSiteConfigRequest): Promise<SiteConfig> {
    const config = await repository.updateSiteConfig(siteKey, input)
    if (!config) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, '站点配置不存在', 404)
    }

    return toSiteConfig(config)
  }

  return {
    getSiteConfig,
    updateSiteConfig,
  }
}

function toSiteConfig(config: {
  homeSections: unknown
  navigation: unknown
  seo: unknown
  siteKey: string
  updatedAt: Date
}): SiteConfig {
  return SiteConfigSchema.parse({
    homeSections: config.homeSections,
    navigation: config.navigation,
    seo: config.seo,
    siteKey: config.siteKey,
    updatedAt: config.updatedAt.toISOString(),
  })
}
