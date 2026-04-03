import type { SecuritySession } from './security.types'
import { prisma } from '@nexus/infra/database/client'
import { betterAuthInstance } from './better-auth'

/**
 * 会话服务。
 */
export class SessionService {
  /**
   * 根据请求头获取当前会话。
   */
  static async getSession(headers: Headers | HeadersInit): Promise<SecuritySession> {
    try {
      const session = await betterAuthInstance.api.getSession({
        headers: headers instanceof Headers ? headers : new Headers(headers),
      })
      const user = session?.user?.id
        ? await prisma.user.findUnique({
            where: {
              id: session.user.id,
            },
          })
        : null

      return {
        session: session?.session
          ? {
              ...session.session,
              ipAddress: session.session.ipAddress ?? null,
              userAgent: session.session.userAgent ?? null,
            }
          : null,
        user,
        isAuthenticated: !!session?.session && !!user,
      }
    } catch {
      return {
        session: null,
        user: null,
        isAuthenticated: false,
      }
    }
  }
}
