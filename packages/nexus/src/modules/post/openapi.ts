import { apiDetail } from '@nexus/shared'

import { PostListSchema, PostSchema } from './model'

export const PostOpenApi = {
  list: apiDetail({
    summary: '获取文章列表',
    description: '支持分页、关键字、状态、分类和标签过滤。',
    response: PostListSchema,
    errors: [400, 401, 403],
  }),
  create: apiDetail({
    summary: '创建文章',
    description: '创建一篇新的草稿文章。',
    response: PostSchema,
    errors: [400, 401, 403, 409],
  }),
  findById: apiDetail({
    summary: '获取文章详情',
    description: '返回指定文章的完整内容和发布信息。',
    response: PostSchema,
    errors: [401, 403, 404],
  }),
  update: apiDetail({
    summary: '更新文章',
    description: '更新指定文章的基础内容和元信息。',
    response: PostSchema,
    errors: [400, 401, 403, 404, 409],
  }),
  remove: apiDetail({
    summary: '删除文章',
    description: '删除指定文章。',
    successStatus: 204,
    responseDescription: '文章删除成功',
    errors: [401, 403, 404],
  }),
  publish: apiDetail({
    summary: '发布文章',
    description: '发布指定文章，并写入发布时间。',
    response: PostSchema,
    errors: [400, 401, 403, 404, 409],
  }),
  unpublish: apiDetail({
    summary: '取消发布文章',
    description: '将指定文章恢复为草稿，并清空发布时间。',
    response: PostSchema,
    errors: [401, 403, 404],
  }),
}
