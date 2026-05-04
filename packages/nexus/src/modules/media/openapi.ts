import { apiDetail } from '@nexus/shared'

import { MediaListSchema, MediaSchema } from './model'

export const MediaOpenApi = {
  list: apiDetail({
    summary: '获取媒体列表',
    description: '返回当前后台可管理的媒体资源列表。',
    response: MediaListSchema,
    errors: [400, 401, 403],
  }),
  upload: apiDetail({
    summary: '上传媒体',
    description: '上传一个媒体文件，并返回保存后的元信息。',
    response: MediaSchema,
    errors: [400, 401, 403],
  }),
  findById: apiDetail({
    summary: '获取媒体详情',
    description: '返回指定媒体的元信息。',
    response: MediaSchema,
    errors: [401, 403, 404],
  }),
  openFile: apiDetail({
    summary: '读取媒体文件',
    description: '返回指定媒体的文件内容。',
    responseDescription: '媒体文件内容',
    errors: [401, 403, 404],
  }),
  remove: apiDetail({
    summary: '删除媒体',
    description: '删除指定媒体和对应的本地文件。',
    successStatus: 204,
    responseDescription: '媒体删除成功',
    errors: [401, 403, 404],
  }),
}
