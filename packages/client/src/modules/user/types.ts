/**
 * User 模块类型定义
 *
 * 用户相关类型定义，与 nexus user 模块保持一致
 */

import type { PaginationQuery, PaginatedList } from '../../types/api'
import type { UserBase, UserStatus } from '../../types/auth'

/**
 * 用户响应数据
 *
 * 复用 auth 模块的 UserBase 类型
 */
export type UserResponse = UserBase

/**
 * 用户列表查询参数
 */
export interface UserListQuery extends PaginationQuery {
  /** 状态过滤 */
  status?: UserStatus
  /** 关键字搜索（用户名、邮箱、昵称） */
  keyword?: string
  /** 是否包含已删除用户 */
  includeDeleted?: boolean
}

/**
 * 用户列表数据（不包含包装层）
 */
export interface UserListData {
  items: UserResponse[]
  pagination: {
    currentPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
    size: number
    total: number
    totalPage: number
  }
}

/**
 * 用户列表响应（统一格式）
 */
export type UserListResponse = PaginatedList<UserResponse>

/**
 * 创建用户请求体
 */
export interface CreateUserBody {
  /** 用户名，3-50 字符，唯一 */
  username?: string
  /** 显示名称，1-100 字符 */
  name: string
  /** 邮箱 */
  email?: string
  /** 电话号码 */
  phone?: string
  /** 个人简介，最多 500 字符 */
  introduce?: string
  /** 头像 URL */
  image?: string
  /** 用户状态，默认 ACTIVE */
  status?: UserStatus
}

/**
 * 更新用户请求体
 */
export interface UpdateUserBody {
  username?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  introduce?: string | null
  image?: string | null
  status?: UserStatus | null
}

/**
 * 创建用户响应（统一格式）
 */
export interface CreateUserResponse {
  data: UserResponse
}

/**
 * 获取用户响应（统一格式）
 */
export interface GetUserResponse {
  data: UserResponse
}

/**
 * 删除用户响应（统一格式）
 */
export interface DeleteUserResponse {
  data: null
}
