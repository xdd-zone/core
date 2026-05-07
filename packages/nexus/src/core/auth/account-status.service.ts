import { UnauthorizedError } from '@nexus/core/http'
import { prisma } from '@nexus/infra/database/client'
import type { BetterAuthAdapter } from './better-auth.adapter'
import type { AuthMutableHeaders } from './cookie.service'

export interface AccountStatusService {
  assertActiveSignedInUser: (userId: string, headers: AuthMutableHeaders) => Promise<void>
}

export function createAccountStatusService(betterAuthAdapter: BetterAuthAdapter): AccountStatusService {
  return {
    async assertActiveSignedInUser(userId: string, headers: AuthMutableHeaders): Promise<void> {
      const user = await prisma.user.findFirst({
        where: {
          deletedAt: null,
          id: userId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      })

      if (user) {
        return
      }

      await prisma.session.deleteMany({
        where: {
          userId,
        },
      })
      betterAuthAdapter.clearBetterAuthCookies(headers)
      throw new UnauthorizedError('账号已被停用')
    },
  }
}
