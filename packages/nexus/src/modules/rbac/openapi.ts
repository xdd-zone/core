import { apiDetail } from '@nexus/shared'

import {
  CurrentUserPermissionsSchema,
  CurrentUserRolesSchema,
  RoleListSchema,
  UserPermissionsSchema,
  UserRoleAssignmentSchema,
  UserRolesSchema,
} from './model'

export const RbacOpenApi = {
  listRoles: apiDetail({
    summary: '获取角色列表',
    description: '返回系统内置角色列表。',
    response: RoleListSchema,
    errors: [400, 401, 403],
  }),
  getUserRoles: apiDetail({
    summary: '获取用户角色列表',
    description: '超级管理员查看指定用户当前已分配的固定系统角色。',
    response: UserRolesSchema,
    errors: [401, 403, 404],
  }),
  assignRoleToUser: apiDetail({
    summary: '为用户分配角色',
    description: '为指定用户分配固定系统角色，并记录授权人。',
    response: UserRoleAssignmentSchema,
    errors: [400, 401, 403, 404, 409],
  }),
  removeRoleFromUser: apiDetail({
    summary: '移除用户角色',
    description: '移除指定用户已分配的固定系统角色。',
    successStatus: 204,
    responseDescription: '角色移除成功',
    errors: [401, 403, 404],
  }),
  getUserPermissions: apiDetail({
    summary: '获取用户权限',
    description: '超级管理员查看指定用户的有效权限集合。',
    response: UserPermissionsSchema,
    errors: [401, 403, 404],
  }),
  getCurrentUserPermissions: apiDetail({
    summary: '获取当前用户权限',
    description: '返回当前登录用户的有效权限集合和角色列表。',
    response: CurrentUserPermissionsSchema,
    errors: [401, 403, 404],
  }),
  getCurrentUserRoles: apiDetail({
    summary: '获取当前用户角色',
    description: '返回当前登录用户已分配的角色列表。',
    response: CurrentUserRolesSchema,
    errors: [401, 404],
  }),
}
