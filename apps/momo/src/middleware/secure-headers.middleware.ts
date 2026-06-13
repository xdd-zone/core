import type { MomoEnv } from '#momo/shared/env'
import type { HonoEnv } from '#momo/shared/hono-env'
import type { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

export function registerSecureHeaders(app: Hono<HonoEnv>, env: MomoEnv): void {
  app.use(
    '*',
    secureHeaders({
      strictTransportSecurity: env.APP_ENV === 'production',
    }),
  )
}
