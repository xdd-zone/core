import type { Session as PrismaSession, User } from '@nexus/infra/database/prisma/generated'

/**
 * 当前请求的登录态。
 */
export interface SecuritySession {
  user: User | null
  session: PrismaSession | null
  isAuthenticated: boolean
}

/**
 * 已登录的安全会话。
 */
export interface AuthenticatedSecuritySession extends SecuritySession {
  user: User
  session: PrismaSession
  isAuthenticated: true
}

/**
 * 注入到 Elysia handler 的安全上下文。
 */
export interface SecurityContext {
  auth: SecuritySession
  currentUser: User | null
  currentSession: PrismaSession | null
}
