import type { SystemRoleName } from '@nexus/modules/rbac/constants'
import type pino from 'pino'
import type { PrismaClient } from '../../generated'
import { SYSTEM_ROLE_NAMES } from '@nexus/modules/rbac/constants'

const ROLE_DEFINITIONS: Record<SystemRoleName, { displayName: string; description: string }> = {
  superAdmin: {
    displayName: '超级管理员',
    description: '平台级超级管理员，负责后台管理、角色分配和系统配置。',
  },
  user: {
    displayName: '普通用户',
    description: '普通登录用户，仅拥有自助资料与自助权限查看能力。',
  },
}

/**
 * 初始化固定系统角色。
 */
export async function seedRoles(prisma: PrismaClient, logger: pino.Logger) {
  logger.info('🌱 开始同步固定系统角色...')

  for (const roleName of SYSTEM_ROLE_NAMES) {
    const definition = ROLE_DEFINITIONS[roleName]

    await prisma.role.upsert({
      where: { name: roleName },
      update: {
        displayName: definition.displayName,
        description: definition.description,
        isSystem: true,
      },
      create: {
        name: roleName,
        displayName: definition.displayName,
        description: definition.description,
        isSystem: true,
      },
    })
  }

  await prisma.role.deleteMany({
    where: {
      name: {
        notIn: [...SYSTEM_ROLE_NAMES],
      },
    },
  })

  logger.info('✅ 固定系统角色同步完成')
}
