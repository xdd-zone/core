import type { BetterAuthInstance } from './better-auth'
import type { SecuritySession } from './security.types'
import { prisma } from '@nexus/infra/database/client'

/**
 * 会话服务。
 */
export interface SessionService {
  getSession: (headers: Headers | HeadersInit) => Promise<SecuritySession>
}

export function createSessionService(betterAuthInstance: BetterAuthInstance): SessionService {
  return {
    async getSession(headers: Headers | HeadersInit): Promise<SecuritySession> {
      const session = await betterAuthInstance.api.getSession({
        headers: headers instanceof Headers ? headers : new Headers(headers),
      })
      const user = session?.user?.id
        ? await prisma.user.findFirst({
            where: {
              deletedAt: null,
              id: session.user.id,
              status: 'ACTIVE',
            },
          })
        : null

      if (!session?.session || !user) {
        return {
          session: null,
          user: null,
          isAuthenticated: false,
        }
      }

      return {
        session: {
          ...session.session,
          ipAddress: session.session.ipAddress ?? null,
          userAgent: session.session.userAgent ?? null,
        },
        user,
        isAuthenticated: true,
      }
    },
  }
}
