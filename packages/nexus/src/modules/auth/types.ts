import type { Session as PrismaSession, User } from '@nexus/infra/database/prisma/generated'

/**
 * 登录成功后的会话数据。
 */
export interface AuthSession {
  user: User
  session: PrismaSession | null
}

/**
 * 当前会话数据。
 */
export interface Session {
  user: User | null
  session: PrismaSession | null
  isAuthenticated: boolean
}

/**
 * 已认证会话响应。
 */
export interface AuthenticatedSession extends Session {
  user: User
  session: PrismaSession
  isAuthenticated: true
}
