import type { AppBootstrapContext } from '../bootstrap'
import { Elysia } from 'elysia'
import { createAuthModule } from './auth'
import { createCommentModule } from './comment'
import { createHealthModule, HealthService } from './health'
import { createMediaModule } from './media'
import { createPostModule } from './post'
import { createPreviewModule } from './preview'
import { createRbacModule } from './rbac'
import { createSiteConfigModule } from './site-config'
import { createUserModule } from './user'

/**
 * API 模块聚合入口。
 */
export function createModules(context: AppBootstrapContext) {
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
    .use(createPostModule({ accessPlugin: context.security.accessPlugin }))
    .use(createPreviewModule({ accessPlugin: context.security.accessPlugin }))
    .use(createSiteConfigModule({ accessPlugin: context.security.accessPlugin }))
    .use(createMediaModule({ accessPlugin: context.security.accessPlugin }))
    .use(createCommentModule({ accessPlugin: context.security.accessPlugin }))
}

export * from './auth'
export * from './comment'
export * from './health'
export * from './media'
export * from './post'
export * from './preview'
export * from './rbac'
export * from './site-config'
export * from './user'
