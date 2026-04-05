import { APP_CONFIG } from '@nexus/core/config'
import { Elysia } from 'elysia'
import { authModule } from './auth'
import { commentModule } from './comment'
import { healthModule } from './health'
import { mediaModule } from './media'
import { pageModule } from './page'
import { postModule } from './post'
import { previewModule } from './preview'
import { rbacModule } from './rbac'
import { siteConfigModule } from './site-config'
import { userModule } from './user'

/**
 * API 模块聚合入口。
 */
export const modules = new Elysia({
  name: 'api-modules',
  prefix: `/${APP_CONFIG.prefix}`,
})
  .use(healthModule)
  .use(authModule)
  .use(userModule)
  .use(rbacModule)
  .use(postModule)
  .use(pageModule)
  .use(previewModule)
  .use(siteConfigModule)
  .use(mediaModule)
  .use(commentModule)

export * from './auth'
export * from './comment'
export * from './health'
export * from './media'
export * from './page'
export * from './post'
export * from './preview'
export * from './rbac'
export * from './site-config'
export * from './user'
