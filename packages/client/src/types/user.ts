import type { UserResponse, UserListQuery, CreateUserBody, UpdateUserBody, UserIdParams } from '@xdd-zone/schema/user'
import type { UserStatus } from '@xdd-zone/schema/auth'
import type { PaginatedList } from './api'

export type { UserResponse, UserListQuery, CreateUserBody, UpdateUserBody, UserIdParams }
export type { UserStatus }

export type UserListResponse = PaginatedList<UserResponse>

export interface CreateUserResponse {
  data: UserResponse
}

export interface GetUserResponse {
  data: UserResponse
}

export interface DeleteUserResponse {
  data: null
}
