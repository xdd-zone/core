import type { HonoEnv } from '#momo/shared/hono-env'
import routes from '#momo/routes'
import { AppError } from '#momo/shared/app-error'
import { getMomoEnv } from '#momo/shared/env'
import { createMeta } from '#momo/shared/meta'
import { BizCode, buildFailure } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

const env = getMomoEnv()
const app = new Hono<HonoEnv>()

app.use(
  '*',
  cors({
    allowHeaders: ['content-type'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    origin: env.CORS_ORIGINS,
  }),
)

app.onError((error, c) => {
  const meta = createMeta()

  if (error instanceof AppError) {
    return c.json(
      buildFailure(
        {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        meta,
      ),
      error.status,
    )
  }

  if (error instanceof HTTPException) {
    return c.json(
      buildFailure(
        {
          code: BizCode.COMMON_INVALID_REQUEST,
          message: error.message,
        },
        meta,
      ),
      error.status,
    )
  }

  console.error(error)

  return c.json(
    buildFailure(
      {
        code: BizCode.SYSTEM_INTERNAL_ERROR,
        message: '服务内部错误',
      },
      meta,
    ),
    500,
  )
})

app.notFound((c) => {
  return c.json(
    buildFailure(
      {
        code: BizCode.COMMON_NOT_FOUND,
        message: '接口不存在',
      },
      createMeta(),
    ),
    404,
  )
})

const appWithRoutes = app.route('/', routes)

export type AppType = typeof appWithRoutes

export { appWithRoutes as app }

export default appWithRoutes
