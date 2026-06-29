import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { zValidator } from '@hono/zod-validator'
import {
  AssetListQuerySchema,
  BizCode,
  CreateCategoryRequestSchema,
  CreatePostRequestSchema,
  CreateTagRequestSchema,
  GeneratePostMetaRequestSchema,
  SavePostDraftRequestSchema,
  UpdateAssetRequestSchema,
  UpdateCategoryRequestSchema,
  UpdateTagRequestSchema,
} from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { getDb } from '#momo/infra/db/client'
import { createRequirePermission } from '#momo/modules/auth/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { createValidationFailure } from '#momo/shared/validator'

import { createContentRepository } from './repositories/content.repository'
import { createTaxonomyRepository } from './repositories/taxonomy.repository'
import { createContentService } from './services/content.service'
import { createTaxonomyService } from './services/taxonomy.service'

export function createContentRoute(runtime: MomoRuntime) {
  const repository = createContentRepository(getDb())
  const taxonomyRepository = createTaxonomyRepository(getDb())
  const service = createContentService(runtime, repository, taxonomyRepository)
  const taxonomyService = createTaxonomyService(taxonomyRepository)

  return new Hono<HonoEnv>()
    .get('/rpc/content/posts', createRequirePermission(runtime, 'content.post.read'), async (c) => {
      const posts = await service.listPosts()
      return c.json(createSuccessResponse({ posts }, createMeta(c.var.requestId)))
    })
    .get(
      '/rpc/content/assets',
      createRequirePermission(runtime, 'content.asset.read'),
      zValidator('query', AssetListQuerySchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const query = c.req.valid('query')
        const result = await service.listAssets(query)
        return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
      },
    )
    .post(
      '/rpc/content/posts/meta-suggestion',
      createRequirePermission(runtime, 'content.post.edit'),
      zValidator('json', GeneratePostMetaRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const result = await service.generatePostMetaSuggestion(c.req.valid('json'))
        return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
      },
    )
    .post(
      '/rpc/content/posts',
      createRequirePermission(runtime, 'content.post.create'),
      zValidator('json', CreatePostRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const payload = c.req.valid('json')
        const post = await service.createPost(payload, c.var.user!.id)
        return c.json(createSuccessResponse({ post }, createMeta(c.var.requestId)), 201)
      },
    )
    .get('/rpc/content/posts/:id', createRequirePermission(runtime, 'content.post.read'), async (c) => {
      const post = await service.getPostById(c.req.param('id'))
      return c.json(createSuccessResponse({ post }, createMeta(c.var.requestId)))
    })
    .get('/rpc/content/assets/:id', createRequirePermission(runtime, 'content.asset.read'), async (c) => {
      const result = await service.getAssetById(c.req.param('id'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .get('/rpc/content/assets/:id/file', async (c) => {
      const response = await service.openAssetFile(c.req.param('id'))
      return response
    })
    .patch(
      '/rpc/content/posts/:id/draft',
      createRequirePermission(runtime, 'content.post.edit'),
      zValidator('json', SavePostDraftRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const post = await service.saveDraft(c.req.param('id'), c.req.valid('json'), c.var.user!.id)
        return c.json(createSuccessResponse({ post }, createMeta(c.var.requestId)))
      },
    )
    .post(
      '/rpc/content/posts/:id/preview-token',
      createRequirePermission(runtime, 'content.preview.generate'),
      async (c) => {
        const token = await service.createPreviewToken(c.req.param('id'), c.var.user!.id)
        return c.json(createSuccessResponse(token, createMeta(c.var.requestId)))
      },
    )
    .post('/rpc/content/posts/:id/publish', createRequirePermission(runtime, 'content.post.publish'), async (c) => {
      const post = await service.publishPost(c.req.param('id'), c.var.user!.id)
      return c.json(createSuccessResponse({ post }, createMeta(c.var.requestId)))
    })
    .get('/rpc/content/mdx-components', createRequirePermission(runtime, 'content.post.read'), async (c) => {
      return c.json(createSuccessResponse(service.getMdxComponents(), createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/content/assets/:id',
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
    .delete('/rpc/content/assets/:id', createRequirePermission(runtime, 'content.asset.delete'), async (c) => {
      const result = await service.deleteAsset(c.req.param('id'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .post('/rpc/content/assets/images', createRequirePermission(runtime, 'content.asset.upload'), async (c) => {
      const form = await c.req.formData()
      const file = form.get('file')

      if (!(file instanceof File)) {
        throw new AppError(BizCode.COMMON_INVALID_REQUEST, '缺少上传文件', 400)
      }

      const asset = await service.uploadImage(file, c.var.user!.id)
      return c.json(createSuccessResponse({ asset }, createMeta(c.var.requestId)), 201)
    })
    .get('/rpc/content/previews/:token', async (c) => {
      const result = await service.getPreviewPost(c.req.param('token'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .get('/rpc/content/categories', createRequirePermission(runtime, 'content.category.read'), async (c) => {
      const categories = await taxonomyService.listCategories()
      return c.json(createSuccessResponse({ categories }, createMeta(c.var.requestId)))
    })
    .post(
      '/rpc/content/categories',
      createRequirePermission(runtime, 'content.category.create'),
      zValidator('json', CreateCategoryRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const category = await taxonomyService.createCategory(c.req.valid('json'), c.var.user!.id)
        return c.json(createSuccessResponse({ category }, createMeta(c.var.requestId)), 201)
      },
    )
    .get('/rpc/content/categories/:id', createRequirePermission(runtime, 'content.category.read'), async (c) => {
      const category = await taxonomyService.getCategoryById(c.req.param('id'))
      return c.json(createSuccessResponse({ category }, createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/content/categories/:id',
      createRequirePermission(runtime, 'content.category.edit'),
      zValidator('json', UpdateCategoryRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const category = await taxonomyService.updateCategory(c.req.param('id'), c.req.valid('json'))
        return c.json(createSuccessResponse({ category }, createMeta(c.var.requestId)))
      },
    )
    .delete('/rpc/content/categories/:id', createRequirePermission(runtime, 'content.category.delete'), async (c) => {
      const result = await taxonomyService.deleteCategory(c.req.param('id'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
    .get('/rpc/content/tags', createRequirePermission(runtime, 'content.tag.read'), async (c) => {
      const tags = await taxonomyService.listTags()
      return c.json(createSuccessResponse({ tags }, createMeta(c.var.requestId)))
    })
    .post(
      '/rpc/content/tags',
      createRequirePermission(runtime, 'content.tag.create'),
      zValidator('json', CreateTagRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const tag = await taxonomyService.createTag(c.req.valid('json'), c.var.user!.id)
        return c.json(createSuccessResponse({ tag }, createMeta(c.var.requestId)), 201)
      },
    )
    .get('/rpc/content/tags/:id', createRequirePermission(runtime, 'content.tag.read'), async (c) => {
      const tag = await taxonomyService.getTagById(c.req.param('id'))
      return c.json(createSuccessResponse({ tag }, createMeta(c.var.requestId)))
    })
    .patch(
      '/rpc/content/tags/:id',
      createRequirePermission(runtime, 'content.tag.edit'),
      zValidator('json', UpdateTagRequestSchema, (result) => {
        if (result.success) {
          return
        }
        const failure = createValidationFailure(result.error)
        throw new AppError(failure.code, failure.message, 400, failure.details)
      }),
      async (c) => {
        const tag = await taxonomyService.updateTag(c.req.param('id'), c.req.valid('json'))
        return c.json(createSuccessResponse({ tag }, createMeta(c.var.requestId)))
      },
    )
    .delete('/rpc/content/tags/:id', createRequirePermission(runtime, 'content.tag.delete'), async (c) => {
      const result = await taxonomyService.deleteTag(c.req.param('id'))
      return c.json(createSuccessResponse(result, createMeta(c.var.requestId)))
    })
}
