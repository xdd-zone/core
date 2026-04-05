import { accessPlugin, Permissions } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'
import { SiteConfigSchema, UpdateSiteConfigBodySchema } from './model'
import { SiteConfigRepository } from './repository'
import { SiteConfigService } from './service'

/**
 * 站点配置模块。
 */
export const siteConfigModule = new Elysia({
  name: 'site-config-module',
  prefix: '/site-config',
  tags: ['SiteConfig'],
})
  .use(accessPlugin)
  .get('', async () => await SiteConfigService.get(), {
    permission: Permissions.SITE_CONFIG.READ,
    response: SiteConfigSchema,
    detail: apiDetail({
      summary: '获取站点配置',
      description: '返回当前后台使用的单例站点配置。',
      response: SiteConfigSchema,
      errors: [401, 403],
    }),
  })
  .put('', async ({ body }) => await SiteConfigService.update(body), {
    permission: Permissions.SITE_CONFIG.WRITE,
    body: UpdateSiteConfigBodySchema,
    response: SiteConfigSchema,
    detail: apiDetail({
      summary: '更新站点配置',
      description: '更新当前后台使用的单例站点配置。',
      response: SiteConfigSchema,
      errors: [400, 401, 403],
    }),
  })

export * from './model'
export { SiteConfigRepository }
export { SiteConfigService }
