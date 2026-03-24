import { APP_CONFIG } from '@nexus/core/config'
import { Elysia } from 'elysia'
import { authRoutes } from './auth.route'
import { healthRoutes } from './health.route'
import { rbacRoutes } from './rbac.route'
import { userRoutes } from './user.route'

/**
 * API 路由聚合。
 */
export const routes = new Elysia({
  prefix: `/${APP_CONFIG.prefix}`,
})
  .use(healthRoutes)
  .use(authRoutes)
  .use(userRoutes)
  .use(rbacRoutes)
