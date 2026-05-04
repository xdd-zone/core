/**
 * 认证接口成功后的用户数据。
 */
export interface AuthApiUser {
  id: string
  username?: string | null
  name: string
  email?: string | null
  emailVerified?: boolean | null
  emailVerifiedAt?: Date | null
  introduce?: string | null
  image?: string | null
  phone?: string | null
  phoneVerified?: boolean | null
  phoneVerifiedAt?: Date | null
  lastLogin?: Date | null
  lastLoginIp?: string | null
  status?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

/**
 * 认证接口成功后的会话数据。
 */
export interface AuthApiSessionRecord {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

/**
 * 邮箱注册请求体。
 */
export interface SignUpEmailPayload {
  email: string
  password: string
  name: string
  image?: string
}

/**
 * 邮箱登录请求体。
 */
export interface SignInEmailPayload {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * 认证接口返回体。
 */
export interface AuthApiSession {
  user: AuthApiUser
  token?: string
  session?: AuthApiSessionRecord | null
}
