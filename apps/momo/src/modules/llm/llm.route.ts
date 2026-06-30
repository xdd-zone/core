import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import {
  BizCode,
  CreateLlmProviderRequestSchema,
  LlmCallLogListQuerySchema,
  LlmUseCaseSchema,
  UpdateLlmProviderRequestSchema,
  UpdateLlmUseCaseConfigRequestSchema,
} from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createRequireFifaOwner } from '#momo/modules/auth/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { createLlmConfigRepository } from './repositories/llm-config.repository'
import { createLlmService } from './services/llm.service'

export function createLlmRoute(runtime: MomoRuntime) {
  const repository = createLlmConfigRepository(getDb())
  const service = createLlmService(runtime, repository)
  const requireOwner = createRequireFifaOwner(runtime)

  return new Hono<HonoEnv>()
    .get('/rpc/llm/providers', requireOwner, async (c) => {
      const result = await service.listProviders()
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .post(
      '/rpc/llm/providers',
      requireOwner,
      zValidator('json', CreateLlmProviderRequestSchema, (result) => {
        if (result.success) return
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const result = await service.createProvider(c.req.valid('json'))
        return c.json(createSuccessResponse(result, createMeta(c.var.requestId)), 201)
      },
    )
    .patch(
      '/rpc/llm/providers/:providerId',
      requireOwner,
      zValidator('json', UpdateLlmProviderRequestSchema, (result) => {
        if (result.success) return
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const result = await service.updateProvider(c.req.param('providerId'), c.req.valid('json'))
        return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
      },
    )
    .delete('/rpc/llm/providers/:providerId/api-key', requireOwner, async (c) => {
      const result = await service.clearProviderApiKey(c.req.param('providerId'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .post('/rpc/llm/providers/:providerId/test', requireOwner, async (c) => {
      const result = await service.testProvider({
        actorId: c.var.user?.id,
        providerId: c.req.param('providerId'),
        requestId: c.var.requestId,
      })
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .get('/rpc/llm/use-cases', requireOwner, async (c) => {
      const result = await service.listUseCaseConfigs()
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/llm/use-cases/:useCase',
      requireOwner,
      zValidator('json', UpdateLlmUseCaseConfigRequestSchema, (result) => {
        if (result.success) return
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const parsedUseCase = LlmUseCaseSchema.safeParse(c.req.param('useCase'))
        if (!parsedUseCase.success) {
          throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'LLM 用例不存在', 400)
        }

        const result = await service.updateUseCaseConfig(parsedUseCase.data, c.req.valid('json'))
        return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
      },
    )
    .get('/rpc/llm/call-logs', requireOwner, zValidator('query', LlmCallLogListQuerySchema, (result) => {
      if (result.success) return
      const failure = createValidationFailure(result.error)
      throw new AppError(failure.code, failure.message, 400, failure.details)
    }), async (c) => {
      const result = await service.listCallLogs(c.req.valid('query'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .get('/rpc/llm/call-logs/:logId', requireOwner, async (c) => {
      const result = await service.getCallLog(c.req.param('logId'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .delete('/rpc/llm/call-logs/expired', requireOwner, async (c) => {
      const result = await service.deleteExpiredCallLogs()
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
}
