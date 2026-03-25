import { APP_CONFIG } from '@nexus/core/config'
import { Elysia } from 'elysia'
import { authModule } from './auth'
import { healthModule } from './health'
import { rbacModule } from './rbac'
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

export * from './auth'
export * from './health'
export * from './rbac'
export * from './user'
