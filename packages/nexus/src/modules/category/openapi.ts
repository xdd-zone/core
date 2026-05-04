import { apiDetail } from '@nexus/shared'

import { CategoryListSchema, CategorySchema } from './model'

export const CategoryOpenApi = {
  list: apiDetail({
    summary: '获取分类列表',
    description: '支持分页、关键字和可见状态筛选。',
    response: CategoryListSchema,
    errors: [400, 401, 403],
  }),
  create: apiDetail({
    summary: '创建分类',
    description: '创建一个文章分类。',
    response: CategorySchema,
    errors: [400, 401, 403, 409],
  }),
  findById: apiDetail({
    summary: '获取分类详情',
    description: '返回指定分类和文章数量。',
    response: CategorySchema,
    errors: [401, 403, 404],
  }),
  update: apiDetail({
    summary: '更新分类',
    description: '更新指定分类的名称、slug、说明、排序和可见状态。',
    response: CategorySchema,
    errors: [400, 401, 403, 404, 409],
  }),
  remove: apiDetail({
    summary: '删除分类',
    description: '删除指定分类，已关联文章会保留并清空分类。',
    successStatus: 204,
    responseDescription: '分类删除成功',
    errors: [401, 403, 404],
  }),
}
