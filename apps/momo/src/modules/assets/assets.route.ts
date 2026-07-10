import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import { AssetCleanupRequestSchema, AssetListQuerySchema, BizCode, UpdateAssetRequestSchema } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createRequirePermission } from '#momo/modules/auth/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'
import { createAssetsRepository } from './assets.repository'
import { createAssetsService } from './assets.service'

export function createAssetsRoute(runtime: MomoRuntime) {
  const service = createAssetsService(runtime, createAssetsRepository(getDb()))

  return new Hono<HonoEnv>()
    .get(
      '/rpc/assets',
      createRequirePermission(runtime, 'content.asset.read'),
      zValidator('query', AssetListQuerySchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const result = await service.listAssets(c.req.valid('query'))
        return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
      },
    )
    .post(
      '/rpc/assets/cleanup/preview',
      createRequirePermission(runtime, 'content.asset.delete'),
      zValidator('json', AssetCleanupRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) =>
        c.json(createSuccessResponse(await service.previewCleanup(c.req.valid('json')), createMeta(c.var.requestId))),
    )
    .post(
      '/rpc/assets/cleanup',
      createRequirePermission(runtime, 'content.asset.delete'),
      zValidator('json', AssetCleanupRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) =>
        c.json(createSuccessResponse(await service.cleanupAssets(c.req.valid('json')), createMeta(c.var.requestId))),
    )
    .get('/rpc/assets/:id', createRequirePermission(runtime, 'content.asset.read'), async (c) => {
      const result = await service.getAssetById(c.req.param('id'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .get('/rpc/assets/:id/file', async (c) => {
      return service.openAssetFile(c.req.param('id'))
    })
    .patch(
      '/rpc/assets/:id',
      createRequirePermission(runtime, 'content.asset.edit'),
      zValidator('json', UpdateAssetRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const asset = await service.updateAsset(c.req.param('id'), c.req.valid('json'))
        return c.json(createSuccessResponse({ asset }, createMeta(c.var.requestId)))
      },
    )
    .delete('/rpc/assets/:id', createRequirePermission(runtime, 'content.asset.delete'), async (c) => {
      const result = await service.deleteAsset(c.req.param('id'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .post('/rpc/assets/images', createRequirePermission(runtime, 'content.asset.upload'), async (c) => {
      const form = await c.req.formData()
      const file = form.get('file')

      if (!(file instanceof File)) {
        throw new AppError(BizCode.COMMON_INVALID_REQUEST, '缺少上传文件', 400)
      }

      const asset = await service.uploadImage(file, c.var.user!.id)
      return c.json(createSuccessResponse({ asset }, createMeta(c.var.requestId)), 201)
    })
}
