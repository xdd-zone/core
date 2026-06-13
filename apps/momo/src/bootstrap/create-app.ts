import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { configureDbClient } from '#momo/infra/db/client'
import { createChildLogger, createErrorLogFields } from '#momo/infra/logger'
import {
  registerBodyLimit,
  registerCors,
  registerRequestContext,
  registerRequestLog,
  registerSecureHeaders,
  registerTimeout,
  registerTiming,
} from '#momo/middleware'
import { createRoutes } from '#momo/routes'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { BizCode, buildFailure } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

export function createMomoApp(runtime: MomoRuntime) {
  const app = new Hono<HonoEnv>()
  const httpLogger = createChildLogger(runtime.logger, 'http')
  const dbLogger = createChildLogger(runtime.logger, 'db')

  configureDbClient({ env: runtime.env, logger: dbLogger })

  registerRequestContext(app)
  registerSecureHeaders(app, runtime.env)
  registerRequestLog(app, httpLogger)
  registerCors(app, runtime.env)
  registerBodyLimit(app)
  registerTiming(app, runtime.env)
  registerTimeout(app)

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
      if (error.status === 504) {
        return c.json(
          buildFailure(
            {
              code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
              message: error.message,
            },
            meta,
          ),
          504,
        )
      }

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

    httpLogger.error(
      {
        event: 'http.request.failed',
        requestId: c.var.requestId,
        ...createErrorLogFields(error instanceof Error ? error : undefined, {
          includeStack: runtime.env.APP_ENV === 'development',
        }),
      },
      '请求处理失败',
    )

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
