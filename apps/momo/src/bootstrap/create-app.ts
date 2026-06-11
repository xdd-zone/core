import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { registerCors, registerRequestContext, registerRequestLog } from '#momo/middleware'
import { createRoutes } from '#momo/routes'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { BizCode, buildFailure } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export function createMomoApp(runtime: MomoRuntime) {
  const app = new Hono<HonoEnv>()

  registerRequestContext(app)
  registerRequestLog(app, runtime.env)
  registerCors(app, runtime.env)

  app.onError((error, c) => {
    const meta = createMeta(c.var.requestId)

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
        createMeta(c.var.requestId),
      ),
      404,
    )
  })

  return app.route('/', createRoutes(runtime))
}
