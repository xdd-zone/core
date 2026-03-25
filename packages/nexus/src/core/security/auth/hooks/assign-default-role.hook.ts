import { DEFAULT_ROLE_NAME, FIRST_USER_ROLE_NAME } from '@nexus/core/security/permissions'
import { prisma } from '@nexus/infra/database/client'
import { createModuleLogger } from '@nexus/infra/logger'

const logger = createModuleLogger('auth:assign-default-role-hook')

interface CreatedUser {
  id: string
  email?: string | null
}

/**
 * Better Auth 数据库钩子。
 */
export async function assignDefaultRoleToUser(user: CreatedUser, _context: unknown) {
  try {
    const userCount = await prisma.user.count()

    if (userCount === 1) {
      const superAdminRole = await prisma.role.findUnique({
        where: { name: FIRST_USER_ROLE_NAME },
      })

      if (!superAdminRole) {
        logger.warn({ roleName: FIRST_USER_ROLE_NAME }, '未找到首个用户默认角色，可能尚未执行种子数据')
        return
      }

      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: superAdminRole.id,
          assignedBy: null,
        },
      })

      logger.info({ userId: user.id, email: user.email }, '第一个用户已分配 superAdmin 角色')
      return
    }

    const userRole = await prisma.role.findUnique({
      where: { name: DEFAULT_ROLE_NAME },
    })

    if (!userRole) {
      logger.warn({ roleName: DEFAULT_ROLE_NAME }, '未找到默认用户角色，可能尚未执行种子数据')
      return
    }

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: userRole.id,
        assignedBy: null,
      },
    })

    logger.info({ userId: user.id, email: user.email }, '用户已分配默认 user 角色')
  } catch (error) {
    logger.error({ error, userId: user.id }, '角色分配失败')
  }
}
