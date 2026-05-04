import { apiDetail } from '@nexus/shared'

import { UpdateMyPasswordResponseSchema, UserListSchema, UserSchema } from './model'

export const UserOpenApi = {
  me: apiDetail({
    summary: '获取当前用户资料',
    description: '返回当前登录用户的基础资料。',
    response: UserSchema,
    errors: [401, 403, 404],
  }),
  updateMe: apiDetail({
    summary: '更新当前用户资料',
    description: '更新当前登录用户的基础资料，不包含角色和状态。',
    response: UserSchema,
    errors: [400, 401, 403, 404, 409],
  }),
  updateMyPassword: apiDetail({
    summary: '更新当前用户密码',
    description: '当前用户设置或更新自己的邮箱密码。已有密码时必须传当前密码。',
    response: UpdateMyPasswordResponseSchema,
    errors: [400, 401, 403, 404],
  }),
  list: apiDetail({
    summary: '获取用户列表',
    description: '支持分页、关键字搜索与状态过滤，默认只返回未归档用户。',
    response: UserListSchema,
    errors: [400, 401, 403],
  }),
  updateStatus: apiDetail({
    summary: '更新用户状态',
    description: '超级管理员启用、停用或封禁指定用户。',
    response: UserSchema,
    errors: [400, 401, 403, 404],
  }),
  findById: apiDetail({
    summary: '获取用户详情',
    description: '超级管理员查看指定用户的基础资料。',
    response: UserSchema,
    errors: [401, 403, 404],
  }),
  updateByAdmin: apiDetail({
    summary: '更新用户基础资料',
    description: '超级管理员更新指定用户的基础资料，不包含状态变更。',
    response: UserSchema,
    errors: [400, 401, 403, 404, 409],
  }),
}
