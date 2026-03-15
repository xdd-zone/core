import { Elysia } from 'elysia'
import { authPlugin } from './auth.plugin'

/**
 * 受保护路由插件。
 */
export const protectedPlugin = new Elysia({ name: 'protected' })
  .use(authPlugin)
  .onBeforeHandle(async ({ request, requireAuth }) => {
    await requireAuth(request)
  })
