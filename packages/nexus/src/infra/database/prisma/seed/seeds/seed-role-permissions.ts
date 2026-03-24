import type { PermissionString } from '@nexus/core/permissions/permissions.types'
import type { SystemRoleName } from '@nexus/modules/rbac/rbac.constants'
import type pino from 'pino'
import type { PrismaClient } from '../../generated'
import { parsePermission } from '@nexus/core/permissions/helpers'
import { SYSTEM_ROLE_NAMES, SYSTEM_ROLE_PERMISSION_KEYS } from '@nexus/modules/rbac/rbac.constants'

/**
 * 初始化固定角色与权限映射。
 */
export async function seedRolePermissions(prisma: PrismaClient, logger: pino.Logger) {
  logger.info('🌱 开始同步角色权限映射...')

  const roles = await prisma.role.findMany({
    where: {
      name: {
        in: [...SYSTEM_ROLE_NAMES],
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const roleMap = new Map<SystemRoleName, string>()
  for (const role of roles) {
    roleMap.set(role.name as SystemRoleName, role.id)
  }

  if (roleMap.size !== SYSTEM_ROLE_NAMES.length) {
    throw new Error('固定角色未准备完成，请先运行 seedRoles')
  }

  await prisma.rolePermission.deleteMany({
    where: {
      role: {
        name: {
          in: [...SYSTEM_ROLE_NAMES],
        },
      },
    },
  })

  for (const roleName of SYSTEM_ROLE_NAMES) {
    const roleId = roleMap.get(roleName)
    if (!roleId) {
      continue
    }

    for (const permissionKey of SYSTEM_ROLE_PERMISSION_KEYS[roleName] as readonly PermissionString[]) {
      const parsed = parsePermission(permissionKey)
      const permission = await prisma.permission.findUnique({
        where: {
          resource_action_scope: {
            resource: parsed.resource,
            action: parsed.action,
            scope: parsed.scope ?? '',
          },
        },
        select: { id: true },
      })

      if (!permission) {
        throw new Error(`未找到权限：${permissionKey}`)
      }

      await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId: permission.id,
        },
      })
    }
  }

  logger.info('✅ 角色权限映射同步完成')
}
