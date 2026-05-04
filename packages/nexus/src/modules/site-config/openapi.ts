import { apiDetail } from '@nexus/shared'

import { SiteConfigSchema } from './model'

export const SiteConfigOpenApi = {
  get: apiDetail({
    summary: '获取站点配置',
    description: '返回当前后台使用的单例站点配置。',
    response: SiteConfigSchema,
    errors: [401, 403],
  }),
  update: apiDetail({
    summary: '更新站点配置',
    description: '更新当前后台使用的单例站点配置。',
    response: SiteConfigSchema,
    errors: [400, 401, 403],
  }),
}
