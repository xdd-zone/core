import type { AppBootstrapContext } from '../bootstrap'
import { registerPermissionDefinitions, SYSTEM_PERMISSION_DEFINITIONS } from '@nexus/core'
import { Elysia } from 'elysia'
import { createAuthModule } from './auth/routes'
import { createCategoryModule } from './category/routes'
import { createCommentModule } from './comment/routes'
import { HealthService } from './health'
import { createHealthModule } from './health/routes'
import { createMediaModule } from './media/routes'
import { BUSINESS_PERMISSION_DEFINITIONS } from './permissions'
import { createPostModule } from './post/routes'
import { createPreviewModule } from './preview/routes'
import { createPublicSiteModule } from './public-site/routes'
import { createRbacModule } from './rbac/routes'
import { createSiteConfigModule } from './site-config/routes'
import { createUserModule } from './user/routes'

/**
 * API 模块聚合入口。
 */
export function createModules(context: AppBootstrapContext) {
  registerPermissionDefinitions(SYSTEM_PERMISSION_DEFINITIONS)
  registerPermissionDefinitions(BUSINESS_PERMISSION_DEFINITIONS)

  return new Elysia({
    name: 'api-modules',
    prefix: context.config.app.apiPrefix,
  })
    .use(
      createHealthModule({
        healthService: new HealthService(context.config),
      }),
    )
    .use(
      createAuthModule({
        authApiService: context.security.authApiService,
        authMethodsService: context.security.authMethodsService,
        authPlugin: context.security.authPlugin,
      }),
    )
    .use(createUserModule({ accessPlugin: context.security.accessPlugin }))
    .use(createRbacModule({ accessPlugin: context.security.accessPlugin }))
    .use(createPublicSiteModule())
    .use(createPostModule({ accessPlugin: context.security.accessPlugin }))
    .use(createCategoryModule({ accessPlugin: context.security.accessPlugin }))
    .use(createPreviewModule({ accessPlugin: context.security.accessPlugin }))
    .use(createSiteConfigModule({ accessPlugin: context.security.accessPlugin }))
    .use(createMediaModule({ accessPlugin: context.security.accessPlugin }))
    .use(createCommentModule({ accessPlugin: context.security.accessPlugin }))
}

export * from './auth'
export * from './category'
export * from './comment'
export * from './health'
export * from './media'
export * from './post'
export * from './preview'
export * from './public-site'
export * from './rbac'
export * from './site-config'
export * from './user'
