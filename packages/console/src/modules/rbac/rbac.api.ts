import type {
  AssignRoleToUserBody,
  CurrentUserPermissions,
  CurrentUserRoles,
  RoleList,
  RoleListQuery,
  UserPermissions,
  UserRoles,
} from './rbac.types'

import { api, unwrapEdenResponse } from '@console/shared/api'

export { ConsoleApiError as RbacRequestError } from '@console/shared/api'

const rbacApiRoot = api.rbac

/**
 * RBAC API。
 */
export const rbacApi = {
  /**
   * 获取角色列表。
   */
  async listRoles(query: RoleListQuery): Promise<RoleList> {
    return unwrapEdenResponse(
      await rbacApiRoot.roles.get({
        query: {
          page: query.page,
          pageSize: query.pageSize,
          keyword: query.keyword,
        },
      }),
    )
  },

  /**
   * 获取指定用户的角色列表。
   */
  async getUserRoles(userId: string): Promise<UserRoles> {
    return unwrapEdenResponse(await rbacApiRoot.users({ userId }).roles.get())
  },

  /**
   * 为用户分配角色。
   */
  async assignRoleToUser(userId: string, body: AssignRoleToUserBody): Promise<unknown> {
    return unwrapEdenResponse(await rbacApiRoot.users({ userId }).roles.post(body))
  },

  /**
   * 移除用户角色。
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await unwrapEdenResponse(await rbacApiRoot.users({ userId }).roles({ roleId }).delete())
  },

  /**
   * 获取指定用户的权限。
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    return unwrapEdenResponse(await rbacApiRoot.users({ userId }).permissions.get())
  },

  /**
   * 获取当前用户权限。
   */
  async getCurrentUserPermissions(): Promise<CurrentUserPermissions> {
    return unwrapEdenResponse(await rbacApiRoot.users.me.permissions.get())
  },

  /**
   * 获取当前用户角色。
   */
  async getCurrentUserRoles(): Promise<CurrentUserRoles> {
    return unwrapEdenResponse(await rbacApiRoot.users.me.roles.get())
  },
}
