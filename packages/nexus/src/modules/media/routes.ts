import type { AccessPluginInstance } from '@nexus/core'

import { UnauthorizedError } from '@nexus/core/http'
import { Elysia } from 'elysia'

import { MediaIdParamsSchema, MediaListQuerySchema, MediaListSchema, MediaSchema, UploadMediaBodySchema } from './model'
import { MediaOpenApi } from './openapi'
import { MediaPermissions } from './permissions'
import { MediaService } from './service'

/**
 * 媒体模块。
 */
export interface MediaModuleOptions {
  accessPlugin: AccessPluginInstance
}

export function createMediaModule({ accessPlugin }: MediaModuleOptions) {
  return new Elysia({
    name: 'media-module',
    prefix: '/media',
    tags: ['Media'],
  })
    .use(accessPlugin)
    .get('/', async ({ query }) => await MediaService.list(query), {
      permission: MediaPermissions.READ_ALL,
      query: MediaListQuerySchema,
      response: MediaListSchema,
      detail: MediaOpenApi.list,
    })
    .post(
      '/upload',
      async ({ body, auth }) => {
        if (!auth.user) {
          throw new UnauthorizedError()
        }

        return await MediaService.upload(auth.user.id, body.file)
      },
      {
        permission: MediaPermissions.WRITE_ALL,
        body: UploadMediaBodySchema,
        response: MediaSchema,
        detail: MediaOpenApi.upload,
      },
    )
    .get('/:id', async ({ params }) => await MediaService.findById(params.id), {
      permission: MediaPermissions.READ_ALL,
      params: MediaIdParamsSchema,
      response: MediaSchema,
      detail: MediaOpenApi.findById,
    })
    .get('/:id/file', async ({ params }) => await MediaService.openFile(params.id), {
      permission: MediaPermissions.READ_ALL,
      params: MediaIdParamsSchema,
      detail: MediaOpenApi.openFile,
    })
    .delete(
      '/:id',
      async ({ params, set }) => {
        await MediaService.remove(params.id)
        set.status = 204
      },
      {
        permission: MediaPermissions.WRITE_ALL,
        params: MediaIdParamsSchema,
        detail: MediaOpenApi.remove,
      },
    )
}
