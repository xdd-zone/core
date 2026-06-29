import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { BizCode, LlmUseCaseSchema, UpdateLlmUseCaseConfigRequestSchema } from '@xdd-zone/contracts'
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

  return new Hono<HonoEnv>()
    .get('/rpc/llm/use-cases', createRequireFifaOwner(runtime), async (c) => {
      const result = await service.listUseCaseConfigs()
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/llm/use-cases/:useCase',
      createRequireFifaOwner(runtime),
      zValidator('json', UpdateLlmUseCaseConfigRequestSchema, (result) => {
        if (result.success) {
          return
        }
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
}
