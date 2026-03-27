/**
 * 用户状态枚举。
 */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED'

/**
 * 用户资料。
 */
export interface User {
  id: string
  username: string | null
  name: string
  email: string | null
  emailVerified: boolean | null
  emailVerifiedAt: string | null
  introduce: string | null
  image: string | null
  phone: string | null
  phoneVerified: boolean | null
  phoneVerifiedAt: string | null
  lastLogin: string | null
  lastLoginIp: string | null
  status: UserStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/**
 * 分页用户列表。
 */
export interface UserList {
  items: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 用户列表查询参数。
 */
export interface UserListQuery {
  page?: number
  pageSize?: number
  status?: UserStatus
  keyword?: string
}

/**
 * 更新用户资料请求体。
 */
export interface UpdateMyProfileBody {
  username?: string | null
  name?: string
  email?: string | null
  phone?: string | null
  introduce?: string | null
  image?: string | null
}

/**
 * 更新用户请求体（与 UpdateMyProfileBody 相同）。
 */
export type UpdateUserBody = UpdateMyProfileBody

/**
 * 更新用户状态请求体。
 */
export interface UpdateUserStatusBody {
  status: UserStatus
}
