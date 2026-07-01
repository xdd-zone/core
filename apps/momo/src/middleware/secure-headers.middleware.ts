import type { Hono } from 'hono'
import type { MomoEnv } from '#momo/shared/env'
import type { HonoEnv } from '#momo/shared/hono-env'
import { secureHeaders } from 'hono/secure-headers'

export function registerSecureHeaders(app: Hono<HonoEnv>, env: MomoEnv): void {
  app.use('/rpc/fifa/profile/avatar/*', async (c, next) => {
    await next()
    c.res.headers.set('cross-origin-resource-policy', 'cross-origin')
  })

  app.use('/rpc/content/assets/:id/file', async (c, next) => {
    await next()
    c.res.headers.set('cross-origin-resource-policy', 'cross-origin')
  })

  app.use(
    '*',
    secureHeaders({
      strictTransportSecurity: env.APP_ENV === 'production',
    }),
  )
}
