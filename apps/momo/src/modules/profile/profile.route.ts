import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { BizCode, UpdateFifaProfileRequestSchema, UpdatePublicProfileRequestSchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createRequireFifaOwner } from '#momo/modules/auth/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { createProfileRepository } from './profile.repository'
import { createProfileService } from './profile.service'

export function createProfileRoute(runtime: MomoRuntime) {
  const repository = createProfileRepository(getDb())
  const service = createProfileService(runtime, repository)

  return new Hono<HonoEnv>()
    .get('/rpc/fifa/profile', createRequireFifaOwner(runtime), async (c) => {
      const profile = await service.getProfile(c.var.user!.id)
      return c.json(createSuccessResponse(profile, createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/fifa/profile',
      createRequireFifaOwner(runtime),
      zValidator('json', UpdateFifaProfileRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const profile = await service.updateProfile(c.var.user!.id, c.req.valid('json'))
        return c.json(createSuccessResponse(profile, createMeta(c.var.requestId)))
      },
    )
    .post('/rpc/fifa/profile/avatar', createRequireFifaOwner(runtime), async (c) => {
      const form = await c.req.formData()
      const file = form.get('file')

      if (!(file instanceof File)) {
        throw new AppError(BizCode.COMMON_INVALID_REQUEST, '缺少上传文件', 400)
      }

      const result = await service.uploadAvatar(c.var.user!.id, file)
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)), 201)
    })
    .get('/rpc/fifa/profile/avatar/:storagePathToken', async (c) => {
      return service.openAvatarFile(c.req.param('storagePathToken'))
    })
    .get('/rpc/bobo/profile', async (c) => {
      const profile = await service.getPublicProfile()
      return c.json(createSuccessResponse({ profile }, createMeta(c.var.requestId)))
    })
    .get('/rpc/profile/public', createRequireFifaOwner(runtime), async (c) => {
      const profile = await service.getPublicProfile()
      return c.json(createSuccessResponse({ profile }, createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/profile/public',
      createRequireFifaOwner(runtime),
      zValidator('json', UpdatePublicProfileRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const profile = await service.updatePublicProfile(c.req.valid('json'))
        await runtime.boboRevalidate
          .revalidate({
            paths: ['/', '/about'],
            tags: ['profile:public', 'site:home', 'site:config'],
          })
          .catch(() => undefined)
        return c.json(createSuccessResponse({ profile }, createMeta(c.var.requestId)))
      },
    )
}

export default createProfileRoute
