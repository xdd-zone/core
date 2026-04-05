import { UnauthorizedError } from '@nexus/core/http'
import { accessPlugin, Permissions } from '@nexus/core/security'
import { apiDetail } from '@nexus/shared'
import { Elysia } from 'elysia'

import { MediaIdParamsSchema, MediaListQuerySchema, MediaListSchema, MediaSchema, UploadMediaBodySchema } from './model'
import { MediaRepository } from './repository'
import { MediaService } from './service'

/**
 * 媒体模块。
 */
export const mediaModule = new Elysia({
  name: 'media-module',
  prefix: '/media',
  tags: ['Media'],
})
  .use(accessPlugin)
  .get('/', async ({ query }) => await MediaService.list(query), {
    permission: Permissions.MEDIA.READ_ALL,
    query: MediaListQuerySchema,
    response: MediaListSchema,
    detail: apiDetail({
      summary: '获取媒体列表',
      description: '返回当前后台可管理的媒体资源列表。',
      response: MediaListSchema,
      errors: [400, 401, 403],
    }),
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
      permission: Permissions.MEDIA.WRITE_ALL,
      body: UploadMediaBodySchema,
      response: MediaSchema,
      detail: apiDetail({
        summary: '上传媒体',
        description: '上传一个媒体文件，并返回保存后的元信息。',
        response: MediaSchema,
        errors: [400, 401, 403],
      }),
    },
  )
  .get('/:id', async ({ params }) => await MediaService.findById(params.id), {
    permission: Permissions.MEDIA.READ_ALL,
    params: MediaIdParamsSchema,
    response: MediaSchema,
    detail: apiDetail({
      summary: '获取媒体详情',
      description: '返回指定媒体的元信息。',
      response: MediaSchema,
      errors: [401, 403, 404],
    }),
  })
  .get('/:id/file', async ({ params }) => await MediaService.openFile(params.id), {
    permission: Permissions.MEDIA.READ_ALL,
    params: MediaIdParamsSchema,
    detail: apiDetail({
      summary: '读取媒体文件',
      description: '返回指定媒体的文件内容。',
      responseDescription: '媒体文件内容',
      errors: [401, 403, 404],
    }),
  })
  .delete(
    '/:id',
    async ({ params, set }) => {
      await MediaService.remove(params.id)
      set.status = 204
    },
    {
      permission: Permissions.MEDIA.WRITE_ALL,
      params: MediaIdParamsSchema,
      detail: apiDetail({
        summary: '删除媒体',
        description: '删除指定媒体和对应的本地文件。',
        successStatus: 204,
        responseDescription: '媒体删除成功',
        errors: [401, 403, 404],
      }),
    },
  )

export * from './constants'
export * from './model'
export { MediaRepository }
export { MediaService }
