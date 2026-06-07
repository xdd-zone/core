import type { HonoEnv } from './shared/hono-env'
import { BizCode, buildFailure } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import routes from './routes'
import { AppError } from './shared/app-error'
import { createMeta } from './shared/meta'

const app = new Hono<HonoEnv>()

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
