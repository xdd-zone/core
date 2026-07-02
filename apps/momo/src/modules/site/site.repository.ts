import type { SiteKey, UpdateSiteConfigRequest } from '@xdd-zone/contracts'
import type { DbClient } from '#momo/infra/db/client'
import { eq } from 'drizzle-orm'
import { siteConfigs } from '#momo/infra/db/schema/index'

export function createSiteRepository(db: DbClient) {
  async function getSiteConfig(siteKey: SiteKey) {
    const [config] = await db.select().from(siteConfigs).where(eq(siteConfigs.siteKey, siteKey)).limit(1)
    return config
  }

  async function updateSiteConfig(siteKey: SiteKey, input: UpdateSiteConfigRequest) {
    const current = await getSiteConfig(siteKey)
    if (!current) {
      return undefined
    }

    const [config] = await db
      .update(siteConfigs)
      .set({
        homeSections: input.homeSections ?? current.homeSections,
        navigation: input.navigation ?? current.navigation,
        seo: input.seo ?? current.seo,
        updatedAt: new Date(),
      })
      .where(eq(siteConfigs.siteKey, siteKey))
      .returning()

    return config
  }

  return {
    getSiteConfig,
    updateSiteConfig,
  }
}

export type SiteRepository = ReturnType<typeof createSiteRepository>
