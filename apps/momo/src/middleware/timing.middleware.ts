import type { Hono } from 'hono'
import type { MomoEnv } from '#momo/shared/env'
import type { HonoEnv } from '#momo/shared/hono-env'
import { timing } from 'hono/timing'

export function registerTiming(app: Hono<HonoEnv>, env: MomoEnv): void {
  if (env.APP_ENV !== 'development') {
    return
  }

  app.use('*', timing())
}
