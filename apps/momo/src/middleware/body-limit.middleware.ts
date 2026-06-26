import type { Hono } from 'hono'
import type { HonoEnv } from '#momo/shared/hono-env'
import { BizCode, buildFailure } from '@xdd-zone/contracts'
import { bodyLimit } from 'hono/body-limit'
import { createMiddleware } from 'hono/factory'
import { createMeta } from '#momo/shared/meta'

const RPC_BODY_LIMIT_BYTES = 1024 * 1024
const AUTH_BODY_LIMIT_BYTES = 64 * 1024
const CONTENT_IMAGE_BODY_LIMIT_BYTES = 10 * 1024 * 1024

function createBodyLimitMiddleware(maxSize: number, excludePaths: string[] = []) {
  const limit = bodyLimit({
    maxSize,
    onError: (c) => {
      return c.json(
        buildFailure(
          {
            code: BizCode.COMMON_PAYLOAD_TOO_LARGE,
            message: '请求体过大',
          },
          createMeta(c.var.requestId),
        ),
        413,
      )
    },
  })

  return createMiddleware<HonoEnv>((c, next) => {
    if (c.req.method === 'GET' || c.req.method === 'HEAD') {
      return next()
    }

    if (excludePaths.includes(c.req.path)) {
      return next()
    }

    return limit(c, next)
  })
}

export function registerBodyLimit(app: Hono<HonoEnv>): void {
  app.use('/rpc/content/assets/images', createBodyLimitMiddleware(CONTENT_IMAGE_BODY_LIMIT_BYTES))
  app.use('/rpc/*', createBodyLimitMiddleware(RPC_BODY_LIMIT_BYTES, ['/rpc/content/assets/images']))
  app.use('/api/auth/*', createBodyLimitMiddleware(AUTH_BODY_LIMIT_BYTES))
}
