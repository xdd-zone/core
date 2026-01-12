import type { Session, User } from '@/infra/database/prisma/generated'

/**
 * 导出 Prisma 生成的类型
 */
export type { Session, User }

/**
 * 会话上下文类型
 * 注入到所有路由的上下文中
 */
export interface SessionContext {
  session: Session | null
  user: User | null
  isAuthenticated: boolean
}
