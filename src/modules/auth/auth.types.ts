import type { Session, User } from '@/infrastructure/database/prisma/generated'

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
 * 认证响应
 */
export interface AuthResponse {
  user: User
  session: Session | null
}

/**
 * 会话响应
 */
export interface SessionResponse {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
}

/**
 * 统一格式的认证响应
 */
export interface AuthResponseUnified {
  code: number
  message: string
  data: {
    user: User
    token?: string
    session?: Session | null
  }
}

/**
 * 统一格式的会话响应
 */
export interface SessionResponseUnified {
  code: number
  message: string
  data: {
    session: Session | null
    user: User | null
  }
}

/**
 * 统一格式的登出响应
 */
export interface SignOutResponse {
  code: number
  message: string
  data: null
}
