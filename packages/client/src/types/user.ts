import type {
  CreateUserBody,
  UpdateUserBody,
  User,
  UserIdParams,
  UserList,
  UserListQuery,
} from '@xdd-zone/schema/contracts/user'
import type { UserStatus } from '@xdd-zone/schema/domains/auth'

export type { CreateUserBody, UpdateUserBody, User, UserIdParams, UserList, UserListQuery, UserStatus }

export type CreateUserResponse = User
export type GetUserResponse = User
