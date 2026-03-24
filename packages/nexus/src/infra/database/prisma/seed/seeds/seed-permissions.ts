import type pino from 'pino'
import type { PrismaClient } from '../../generated'
import { parsePermission } from '@nexus/core/permissions/helpers'
import { SYSTEM_PERMISSION_DEFINITIONS } from '@nexus/core/permissions/permissions'

/**
 * 初始化系统权限注册表。
 */
export async function seedPermissions(prisma: PrismaClient, logger: pino.Logger) {
  logger.info('🌱 开始同步权限注册表...')

  for (const definition of SYSTEM_PERMISSION_DEFINITIONS) {
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
      NOT: SYSTEM_PERMISSION_DEFINITIONS.map((definition) => {
        const parsed = parsePermission(definition.key)

        return {
          resource: parsed.resource,
          action: parsed.action,
          scope: parsed.scope ?? '',
        }
      }),
    },
  })

  logger.info(`✅ 权限同步完成，共 ${SYSTEM_PERMISSION_DEFINITIONS.length} 个权限`)
}
