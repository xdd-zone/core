import type { AccessPluginInstance } from '@nexus/core'

import { Elysia } from 'elysia'

import { SiteConfigSchema, UpdateSiteConfigBodySchema } from './model'
import { SiteConfigOpenApi } from './openapi'
import { SiteConfigPermissions } from './permissions'
import { SiteConfigService } from './service'

/**
 * 站点配置模块。
 */
export interface SiteConfigModuleOptions {
  accessPlugin: AccessPluginInstance
}

export function createSiteConfigModule({ accessPlugin }: SiteConfigModuleOptions) {
  return new Elysia({
    name: 'site-config-module',
    prefix: '/site-config',
    tags: ['SiteConfig'],
  })
    .use(accessPlugin)
    .get('', async () => await SiteConfigService.get(), {
      permission: SiteConfigPermissions.READ,
      response: SiteConfigSchema,
      detail: SiteConfigOpenApi.get,
    })
    .put('', async ({ body }) => await SiteConfigService.update(body), {
      permission: SiteConfigPermissions.WRITE,
      body: UpdateSiteConfigBodySchema,
      response: SiteConfigSchema,
      detail: SiteConfigOpenApi.update,
    })
}
