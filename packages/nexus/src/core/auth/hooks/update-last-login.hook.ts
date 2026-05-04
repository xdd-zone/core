import { prisma } from '@nexus/infra/database/client'
import { createModuleLogger } from '@nexus/infra/logger'

const logger = createModuleLogger('auth:update-last-login-hook')

interface CreatedSession {
  userId: string
  createdAt?: Date | string
  ipAddress?: string | null
}

export async function updateUserLastLogin(session: CreatedSession) {
  try {
    await prisma.user.update({
      where: {
        id: session.userId,
      },
      data: {
        lastLogin: session.createdAt ? new Date(session.createdAt) : new Date(),
        lastLoginIp: session.ipAddress ?? null,
      },
    })
  } catch (error) {
    logger.error({ error, userId: session.userId }, '最后登录信息更新失败')
  }
}
