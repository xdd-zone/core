/**
 * XDD Zone Client SDK
 *
 * 基于 Fetch API 的类型安全 HTTP 客户端
 * 参考 Eden Treaty 风格设计
 * 支持树形语法 API 访问
 */

// Re-export base types
export type {
  ApiResponse,
  PaginationQuery,
  PaginationResponse,
  PaginatedList,
  SoftDeleteOptions,
  KeywordSearchOptions,
} from './types/api'

// Re-export auth types
export type {
  UserStatus,
  UserBase,
  Session,
  SignUpEmailBody,
  SignInEmailBody,
  AuthResponse,
  SessionResponse,
  GetSessionResponse,
  SignOutResponse,
} from './types/auth'

// Re-export user types
export type {
  UserResponse,
  UserListResponse,
  UserListQuery,
  CreateUserBody,
  UpdateUserBody,
  CreateUserResponse,
  GetUserResponse,
  DeleteUserResponse,
} from './types/user'

// Re-export rbac types
export * from './types/rbac'

// Re-export logger
export * from './logger'

// Re-export error handling
export * from './error/error-codes'
export * from './error/api-error'

// Re-export interceptors
export * from './interceptors'

// Re-export client classes and functions
export { XDDClient, createClient } from './client'

// Re-export client types
export type { ClientOptions, RequestOptions, XDDResponse, ApiResult } from './core/types'

// Re-export module accessors and types
export type { AuthAccessors } from './modules/auth'
export type { UserAccessors, UserIdAccessor } from './modules/user'
export type {
  RbacAccessors,
  RolesAccessors,
  RoleIdAccessor,
  PermissionsAccessors,
  PermissionIdAccessor,
  RbacUsersAccessors,
} from './modules/rbac'
