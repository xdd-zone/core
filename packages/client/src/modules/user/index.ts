/**
 * User 模块访问器
 */

import {
  CreateUserBodySchema,
  UpdateUserBodySchema,
  UserListQuerySchema,
  UserListSchema,
  UserSchema,
} from '@xdd-zone/schema/contracts/user'
import type { RequestFn } from '../../core/request'
import type {
  UserList,
  UserListQuery,
  CreateUserBody,
  UpdateUserBody,
  CreateUserResponse,
  GetUserResponse,
} from '../../types/user'

/**
 * User ID 访问器接口
 */
export interface UserIdAccessor {
  get(): Promise<GetUserResponse>
  patch(body: UpdateUserBody): Promise<GetUserResponse>
  delete(): Promise<void>
}

/**
 * User 模块访问器接口
 */
export interface UserAccessors {
  list: {
    get(query?: UserListQuery): Promise<UserList>
  }
  create(body: CreateUserBody): Promise<CreateUserResponse>
  (id: string): UserIdAccessor
  get(id: string): Promise<GetUserResponse>
  update(id: string, body: UpdateUserBody): Promise<GetUserResponse>
  delete(id: string): Promise<void>
}

/**
 * 创建 User 模块访问器
 */
export function createUserAccessor(request: RequestFn): UserAccessors {
  const listGet = (query?: UserListQuery) =>
    request<UserList>('GET', 'user', {
      params: query ? (UserListQuerySchema.parse(query) as Record<string, unknown>) : undefined,
      responseSchema: UserListSchema,
    })

  const create = (body: CreateUserBody) =>
    request<CreateUserResponse>('POST', 'user', {
      body: CreateUserBodySchema.parse(body),
      responseSchema: UserSchema,
    })

  const get = (id: string) => request<GetUserResponse>('GET', `user/${id}`, { responseSchema: UserSchema })

  const update = (id: string, body: UpdateUserBody) =>
    request<GetUserResponse>('PATCH', `user/${id}`, {
      body: UpdateUserBodySchema.parse(body),
      responseSchema: UserSchema,
    })

  const del = (id: string) => request<void>('DELETE', `user/${id}`)

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
