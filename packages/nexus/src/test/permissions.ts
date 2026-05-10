import type { PrismaClient } from '@nexus-prisma/generated/client'
import type { PermissionString } from '@nexus/core/permissions'

import { parsePermission } from '@nexus/core/permissions'
import { PERMISSION_DEFINITIONS } from '@nexus/public/permissions'

import { prisma as defaultPrisma } from '../infra/database'
import { createTestSuffix } from './db'

async function resolvePermissionIds(permissionKeys: readonly PermissionString[], prisma: PrismaClient) {
  return await Promise.all(
    permissionKeys.map(async (permissionKey) => {
      const parsedPermission = parsePermission(permissionKey)
      const definition = PERMISSION_DEFINITIONS.find((item) => item.key === permissionKey)
      const permission = await prisma.permission.upsert({
        where: {
          resource_action_scope: {
            resource: parsedPermission.resource,
            action: parsedPermission.action,
            scope: parsedPermission.scope ?? '',
          },
        },
        update: {},
        create: {
          resource: parsedPermission.resource,
          action: parsedPermission.action,
          scope: parsedPermission.scope ?? '',
          displayName: definition?.displayName ?? permissionKey,
          description: definition?.description ?? permissionKey,
        },
        select: {
          id: true,
        },
      })

      return permission.id
    }),
  )
}

export async function createRoleWithPermissions(
  name: string,
  permissionKeys: readonly PermissionString[],
  prisma: PrismaClient = defaultPrisma,
) {
  const permissionIds = await resolvePermissionIds(permissionKeys, prisma)
  const role = await prisma.role.create({
    data: {
      name,
      displayName: name,
      description: `Test role for ${name}`,
      isSystem: false,
    },
  })

  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
      skipDuplicates: true,
    })
  }

  return role
}

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  options: {
    assignedBy?: string | null
  } = {},
  prisma: PrismaClient = defaultPrisma,
) {
  return await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    create: {
      userId,
      roleId,
      assignedBy: options.assignedBy ?? null,
    },
    update: {
      assignedBy: options.assignedBy ?? null,
    },
  })
}

export async function grantPermissionsToUser(
  userId: string,
  permissionKeys: readonly PermissionString[],
  options: {
    roleName?: string
    assignedBy?: string | null
  } = {},
  prisma: PrismaClient = defaultPrisma,
) {
  const role = await createRoleWithPermissions(options.roleName ?? createTestSuffix('role'), permissionKeys, prisma)
  const assignment = await assignRoleToUser(userId, role.id, { assignedBy: options.assignedBy ?? null }, prisma)

  return {
    role,
    assignment,
  }
}
