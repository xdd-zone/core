import type pino from 'pino'
import type { PrismaClient } from '../../generated'
import { parsePermission, SYSTEM_PERMISSION_DEFINITIONS } from '@nexus/core/security/permissions'
import { BUSINESS_PERMISSION_DEFINITIONS } from '@nexus/modules/permission-definitions'

const PERMISSION_DEFINITIONS = [...SYSTEM_PERMISSION_DEFINITIONS, ...BUSINESS_PERMISSION_DEFINITIONS] as const

/**
 * 初始化系统权限注册表。
 */
export async function seedPermissions(prisma: PrismaClient, logger: pino.Logger) {
  logger.info('🌱 开始同步权限注册表...')

  for (const definition of PERMISSION_DEFINITIONS) {
    const parsed = parsePermission(definition.key)

    await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: parsed.resource,
          action: parsed.action,
          scope: parsed.scope ?? '',
        },
      },
      update: {
        displayName: definition.displayName,
        description: definition.description,
      },
      create: {
        resource: parsed.resource,
        action: parsed.action,
        scope: parsed.scope ?? '',
        displayName: definition.displayName,
        description: definition.description,
      },
    })
  }

  await prisma.permission.deleteMany({
    where: {
      NOT: PERMISSION_DEFINITIONS.map((definition) => {
        const parsed = parsePermission(definition.key)

        return {
          resource: parsed.resource,
          action: parsed.action,
          scope: parsed.scope ?? '',
        }
      }),
    },
  })

  logger.info(`✅ 权限同步完成，共 ${PERMISSION_DEFINITIONS.length} 个权限`)
}
