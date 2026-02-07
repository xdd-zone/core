/**
 * Auth 模块类型定义
 *
 * 认证相关类型定义，与 nexus auth 模块保持一致
 */

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
}

/**
 * 用户基础信息
 */
export interface UserBase {
  id: string
  username: string | null
  name: string
  email: string | null
  emailVerified: boolean | null
  emailVerifiedAt: string | null | Date
  introduce: string | null
  image: string | null
  phone: string | null
  phoneVerified: boolean | null
  phoneVerifiedAt: string | null | Date
  lastLogin: string | null | Date
  lastLoginIp: string | null
  status: UserStatus
  createdAt: string | Date
  updatedAt: string | Date
  deletedAt: string | null | Date
}

/**
 * 会话信息
 */
export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

/**
 * 注册请求体
 */
export interface SignUpEmailBody {
  email: string
  password: string
  name: string
  image?: string
}

/**
 * 登录请求体
 */
export interface SignInEmailBody {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * 会话数据（不包含包装层）
 */
export interface SessionData {
  user: UserBase | null
  session: Session | null
  isAuthenticated: boolean
}

/**
 * 认证响应数据（不包含包装层）
 */
export interface AuthSessionData {
  user: UserBase
  token?: string
  session?: Session | null
}

/**
 * 认证响应（统一格式）
 *
 * 包含 code, message, data 包装层，与后端 ApiResponse<T> 保持一致
 */
export interface AuthResponse {
  /** 0 表示成功，非 0 表示错误 */
  code: number
  /** 消息描述 */
  message: string
  /** 认证数据 */
  data: AuthSessionData
}

/**
 * 会话响应
 */
export interface SessionResponse {
  /** 0 表示成功，非 0 表示错误 */
  code: number
  /** 消息描述 */
  message: string
  /** 会话数据 */
  data: SessionData
}

/**
 * 统一格式的会话响应（/api/auth/get-session, /api/auth/me）
 *
 * 包含 code, message, data 包装层，与后端 ApiResponse<T> 保持一致
 */
export type GetSessionResponse = SessionResponse

/**
 * 统一格式的登出响应
 */
export interface SignOutResponse {
  code: number
  message: string
  data: null
}
