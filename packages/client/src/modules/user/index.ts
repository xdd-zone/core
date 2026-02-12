/**
 * User 模块访问器
 *
 * 用户相关 API 操作的访问器实现
 */

import type { RequestFn } from '../../core/request'
import type { XDDResponse, ApiResult } from '../../core/types'
import type {
  UserListResponse,
  UserListQuery,
  CreateUserBody,
  UpdateUserBody,
  CreateUserResponse,
  GetUserResponse,
  DeleteUserResponse,
} from '../../types/user'

/**
 * User ID 访问器接口
 * 用于访问特定用户的操作
 */
export interface UserIdAccessor {
  /** 获取用户详情 */
  get(): Promise<XDDResponse<ApiResult<GetUserResponse>>>
  /** 更新用户信息 */
  patch(body: UpdateUserBody): Promise<XDDResponse<ApiResult<GetUserResponse>>>
  /** 删除用户 */
  delete(): Promise<XDDResponse<ApiResult<DeleteUserResponse>>>
}

/**
 * User 模块访问器接口
 * 提供用户相关的所有 API 操作
 */
export interface UserAccessors {
  /** 用户列表操作 */
  list: {
    /** 获取用户列表 */
    get(query?: UserListQuery): Promise<XDDResponse<ApiResult<UserListResponse>>>
  }
  /** 创建用户 */
  create(body: CreateUserBody): Promise<XDDResponse<ApiResult<CreateUserResponse>>>
  /** 根据 ID 访问用户操作 */
  (id: string): UserIdAccessor
  /** 获取单个用户 */
  get(id: string): Promise<XDDResponse<ApiResult<GetUserResponse>>>
  /** 更新用户 */
  update(id: string, body: UpdateUserBody): Promise<XDDResponse<ApiResult<GetUserResponse>>>
  /** 删除用户 */
  delete(id: string): Promise<XDDResponse<ApiResult<DeleteUserResponse>>>
}

/**
 * 创建 User 模块访问器
 *
 * @param request - 统一请求函数
 * @returns User 访问器对象
 */
export function createUserAccessor(request: RequestFn): UserAccessors {
  const listGet = (query?: UserListQuery) =>
    request<ApiResult<UserListResponse>>('GET', 'user', { params: query as Record<string, unknown> })

  const create = (body: CreateUserBody) =>
    request<ApiResult<CreateUserResponse>>('POST', 'user', { body: JSON.stringify(body) })

  const get = (id: string) => request<ApiResult<GetUserResponse>>('GET', `user/${id}`)

  const update = (id: string, body: UpdateUserBody) =>
    request<ApiResult<GetUserResponse>>('PATCH', `user/${id}`, { body: JSON.stringify(body) })

  const del = (id: string) => request<ApiResult<DeleteUserResponse>>('DELETE', `user/${id}`)

  const accessor = Object.assign(
    (id: string) => ({
      get: () => get(id),
      patch: (body: UpdateUserBody) => update(id, body),
      delete: () => del(id),
    }),
    { list: { get: listGet }, create, get, update, delete: del },
  )

  return accessor
}
