import type {
  UserStatus,
  UserResponse,
  UserListQuery,
  CreateUserBody,
  UpdateUserBody,
  UserIdParams,
} from '@xdd-zone/schema/user'
import type { PaginatedList } from './api'

export type { UserStatus, UserResponse, UserListQuery, CreateUserBody, UpdateUserBody, UserIdParams }

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
