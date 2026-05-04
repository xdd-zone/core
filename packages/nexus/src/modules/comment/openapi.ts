import { apiDetail } from '@nexus/shared'

import { CommentListSchema, CommentSchema } from './model'

export const CommentOpenApi = {
  list: apiDetail({
    summary: '获取评论列表',
    description: '支持按状态、关联文章、关键字和时间范围筛选评论。',
    response: CommentListSchema,
    errors: [400, 401, 403],
  }),
  create: apiDetail({
    summary: '创建评论',
    description: '给已发布文章提交一条待审核评论。',
    response: CommentSchema,
    errors: [400, 404],
  }),
  findById: apiDetail({
    summary: '获取评论详情',
    description: '返回指定评论的基础内容和当前审核状态。',
    response: CommentSchema,
    errors: [401, 403, 404],
  }),
  updateStatus: apiDetail({
    summary: '更新评论状态',
    description: '将评论切换为待审核、已通过或已隐藏状态。',
    response: CommentSchema,
    errors: [400, 401, 403, 404],
  }),
  remove: apiDetail({
    summary: '删除评论',
    description: '将指定评论标记为已删除。',
    successStatus: 204,
    responseDescription: '评论删除成功',
    errors: [401, 403, 404],
  }),
}
