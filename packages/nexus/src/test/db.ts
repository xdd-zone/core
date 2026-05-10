import type { PrismaClient } from '@nexus-prisma/generated/client'
import type { PermissionString } from '../core/permissions'

import { parsePermission, PermissionService, SYSTEM_PERMISSION_DEFINITIONS, SYSTEM_ROLE_NAMES } from '../core/permissions'
import { BUSINESS_PERMISSION_DEFINITIONS } from '../modules/permissions'
import { SYSTEM_ROLE_PERMISSION_KEYS } from '../modules/rbac/constants'
import { prisma as defaultPrisma } from '../infra/database'

const ROLE_DEFINITIONS = {
  superAdmin: {
    displayName: '超级管理员',
    description: '平台级超级管理员，负责后台管理、角色分配和系统配置。',
  },
  user: {
    displayName: '普通用户',
    description: '普通登录用户，仅拥有自助资料与自助权限查看能力。',
  },
} as const

const PERMISSION_DEFINITIONS = [...SYSTEM_PERMISSION_DEFINITIONS, ...BUSINESS_PERMISSION_DEFINITIONS] as const

export interface CleanupTestDataInput {
  userIds?: readonly string[]
  roleIds?: readonly string[]
  postIds?: readonly string[]
  categoryIds?: readonly string[]
  commentIds?: readonly string[]
  mediaIds?: readonly string[]
}

export function createTestSuffix(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function seedBasePermissions(prisma: PrismaClient = defaultPrisma) {
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
  const roleMap = new Map(roles.map((role) => [role.name, role.id]))

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
        continue
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId: permission.id,
        },
      })
    }
  }

  PermissionService.clearAllCache()
}

export async function cleanupTestData(input: CleanupTestDataInput, prisma: PrismaClient = defaultPrisma) {
  const userIds = [...(input.userIds ?? [])]
  const roleIds = [...(input.roleIds ?? [])]
  const postIds = [...(input.postIds ?? [])]
  const categoryIds = [...(input.categoryIds ?? [])]
  const commentIds = [...(input.commentIds ?? [])]
  const mediaIds = [...(input.mediaIds ?? [])]

  if (commentIds.length > 0 || postIds.length > 0) {
    await prisma.comment.deleteMany({
      where: {
        OR: [
          commentIds.length > 0
            ? {
                id: {
                  in: commentIds,
                },
              }
            : undefined,
          postIds.length > 0
            ? {
                postId: {
                  in: postIds,
                },
              }
            : undefined,
        ].filter((item): item is NonNullable<typeof item> => item !== undefined),
      },
    })
  }

  if (postIds.length > 0) {
    await prisma.post.deleteMany({
      where: {
        id: {
          in: postIds,
        },
      },
    })
  }

  if (categoryIds.length > 0) {
    await prisma.category.deleteMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    })
  }

  if (mediaIds.length > 0) {
    await prisma.media.deleteMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
    })
  }

  if (roleIds.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
    })

    await prisma.userRole.deleteMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
    })
  }

  if (userIds.length > 0) {
    await prisma.userRole.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    await prisma.session.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    await prisma.account.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })
  }

  if (roleIds.length > 0) {
    await prisma.role.deleteMany({
      where: {
        id: {
          in: roleIds,
        },
      },
    })
  }

  if (userIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    })
  }

  PermissionService.clearAllCache()
}
