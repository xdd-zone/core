import type {
  CurrentUserPermissions,
  CurrentUserRoles,
  RoleList,
  UserPermissions,
  UserRoleAssignment,
  UserRoles,
} from './model'
import type { RoleRepository } from './role.repository'
import type { UserRoleRepository } from './user-role.repository'
import { normalizePermission, PermissionService } from '@nexus/core/permissions'
import { createPaginatedResponse } from '@nexus/infra/database'
import { serializeDateTime } from '@nexus/shared/schema'

type RoleRecord = Awaited<ReturnType<typeof RoleRepository.findMany>>['roles'][number]
type UserRoleRecord = Awaited<ReturnType<typeof UserRoleRepository.findByUser>>[number]
type AssignedUserRoleRecord = Awaited<ReturnType<typeof UserRoleRepository.assignRole>>
type UserWithRoles = NonNullable<Awaited<ReturnType<typeof UserRoleRepository.findUserWithRoles>>>

export function createRoleList(roles: RoleRecord[], total: number, page: number, pageSize: number): RoleList {
  return createPaginatedResponse(
    roles.map((role) => ({
      ...role,
      createdAt: serializeDateTime(role.createdAt),
      updatedAt: serializeDateTime(role.updatedAt),
    })),
    total,
    page,
    pageSize,
  )
}

export function serializeUserRoles(userRoles: UserRoleRecord[]): UserRoles {
  return userRoles.map((userRole) => ({
    id: userRole.id,
    roleId: userRole.roleId,
    roleName: userRole.role.name,
    roleDisplayName: userRole.role.displayName,
    assignedBy: userRole.assignedBy,
    assignedAt: serializeDateTime(userRole.assignedAt),
  }))
}

export function serializeUserRoleAssignment(userRole: AssignedUserRoleRecord): UserRoleAssignment {
  return {
    ...userRole,
    assignedAt: serializeDateTime(userRole.assignedAt),
    role: {
      ...userRole.role,
      createdAt: serializeDateTime(userRole.role.createdAt),
      updatedAt: serializeDateTime(userRole.role.updatedAt),
    },
  }
}

export function createUserPermissions(permissions: UserPermissions['permissions']): UserPermissions {
  return {
    permissions,
  }
}

export function createCurrentUserPermissions(
  userWithRoles: UserWithRoles,
  permissions: CurrentUserPermissions['permissions'],
): CurrentUserPermissions {
  return {
    permissions,
    roles: userWithRoles.roles.map((userRole) => ({
      id: userRole.role.id,
      name: userRole.role.name,
      displayName: userRole.role.displayName,
    })),
  }
}

export function createCurrentUserRoles(userWithRoles: UserWithRoles): CurrentUserRoles {
  return {
    roles: userWithRoles.roles.map((userRole) => ({
      id: userRole.role.id,
      name: userRole.role.name,
      displayName: userRole.role.displayName,
      description: userRole.role.description,
      isSystem: userRole.role.isSystem,
      source: userRole.assignedBy ? 'manual' : 'system',
      assignedBy: userRole.assignedBy,
      assignedAt: serializeDateTime(userRole.assignedAt),
      permissions: PermissionService.summarizePermissions(
        userRole.role.permissions.map((rolePermission) =>
          normalizePermission({
            resource: rolePermission.permission.resource,
            action: rolePermission.permission.action,
            scope:
              rolePermission.permission.scope === 'own' || rolePermission.permission.scope === 'all'
                ? rolePermission.permission.scope
                : undefined,
          }),
        ),
      ),
    })),
  }
}
