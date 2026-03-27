import type { UpdateMyProfileBody, UpdateUserBody, UpdateUserStatusBody, UserList, UserListQuery, User as UserPayload } from './user.types'

import { api, unwrapEdenResponse } from '@console/shared/api'

export { ConsoleApiError as UserRequestError } from '@console/shared/api'

const userApiRoot = api.user

/**
 * 用户 API。
 */
export const userApi = {
  /**
   * 获取当前用户资料。
   */
  async getMe(): Promise<UserPayload> {
    return unwrapEdenResponse(await userApiRoot.me.get())
  },

  /**
   * 更新当前用户资料。
   */
  async updateMe(body: UpdateMyProfileBody): Promise<UserPayload> {
    return unwrapEdenResponse(await userApiRoot.me.patch(body))
  },

  /**
   * 获取用户列表。
   */
  async list(query: UserListQuery): Promise<UserList> {
    return unwrapEdenResponse(
      await userApiRoot.get({
        query: {
          page: query.page,
          pageSize: query.pageSize,
          status: query.status,
          keyword: query.keyword,
        },
      }),
    )
  },

  /**
   * 获取用户详情。
   */
  async findById(id: string): Promise<UserPayload> {
    return unwrapEdenResponse(await userApiRoot({ id }).get())
  },

  /**
   * 后台更新指定用户基础资料。
   */
  async updateByAdmin(id: string, body: UpdateUserBody): Promise<UserPayload> {
    return unwrapEdenResponse(await userApiRoot({ id }).patch(body))
  },

  /**
   * 后台更新指定用户状态。
   */
  async updateStatus(id: string, body: UpdateUserStatusBody): Promise<UserPayload> {
    return unwrapEdenResponse(await userApiRoot({ id }).status.patch(body))
  },
}
