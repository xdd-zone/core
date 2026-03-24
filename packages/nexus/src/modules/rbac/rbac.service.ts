import type { Prisma } from '@nexus/infra/database/prisma/generated'
import type { RoleListQuery } from './rbac.contract'
import { NotFoundError } from '@nexus/core/http'
import { PermissionService } from '@nexus/core/permissions/permission.service'
import { createPaginatedResponse } from '@nexus/infra/database'
import { UserRepository } from '@nexus/modules/user'
import {
  CurrentUserPermissionsSchema,
  CurrentUserRolesSchema,
  RoleListSchema,
  UserPermissionsSchema,
  UserRoleAssignmentSchema,
  UserRolesSchema,
} from './rbac.contract'
import { RoleRepository, UserRoleRepository } from './repositories'

/**
 * RBAC 服务类。
 */
export class RbacService {
  /**
   * 断言用户存在且未归档。
   */
  private static async assertUserExists(userId: string) {
    const user = await UserRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('用户不存在')
    }
  }

  /**
   * 获取固定角色列表。
   */
  static async listRoles(query: RoleListQuery) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: Prisma.RoleWhereInput = {}
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { displayName: { contains: query.keyword, mode: 'insensitive' } },
      ]
    }

    const { roles, total } = await RoleRepository.findMany(where, skip, pageSize)

    return RoleListSchema.parse(createPaginatedResponse(roles, total, page, pageSize))
  }

  /**
   * 获取指定用户的角色列表。
   */
  static async getUserRoles(userId: string) {
    await this.assertUserExists(userId)

    const userRoles = await UserRoleRepository.findByUser(userId)

    return UserRolesSchema.parse(
      userRoles.map((userRole) => ({
        id: userRole.id,
        roleId: userRole.roleId,
        roleName: userRole.role.name,
        roleDisplayName: userRole.role.displayName,
        assignedBy: userRole.assignedBy,
        assignedAt: userRole.assignedAt,
      })),
    )
  }

  /**
   * 为指定用户分配角色。
   */
  static async assignRoleToUser(userId: string, roleId: string, assignedBy: string | null = null) {
    await this.assertUserExists(userId)

    const role = await RoleRepository.findById(roleId)
    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    const userRole = await UserRoleRepository.assignRole(userId, roleId, assignedBy)
    PermissionService.clearCache(userId)

    return UserRoleAssignmentSchema.parse(userRole)
  }

  /**
   * 移除指定用户角色。
   */
  static async removeRoleFromUser(userId: string, roleId: string) {
    await this.assertUserExists(userId)

    const result = await UserRoleRepository.removeRole(userId, roleId)
    if (result.count === 0) {
      throw new NotFoundError('用户角色关联不存在')
    }

    PermissionService.clearCache(userId)
  }

  /**
   * 获取指定用户的有效权限。
   */
  static async getUserPermissions(userId: string) {
    await this.assertUserExists(userId)

    const permissions = await PermissionService.getUserPermissions(userId)

    return UserPermissionsSchema.parse({
      permissions,
    })
  }

  /**
   * 获取当前用户的有效权限与角色。
   */
  static async getCurrentUserPermissions(userId: string) {
    const userWithRoles = await UserRoleRepository.findUserWithRoles(userId)
    if (!userWithRoles || userWithRoles.deletedAt) {
      throw new NotFoundError('用户不存在')
    }

    const permissions = await PermissionService.getUserPermissions(userId)

    return CurrentUserPermissionsSchema.parse({
      permissions,
      roles: userWithRoles.roles.map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        displayName: userRole.role.displayName,
      })),
    })
  }

  /**
   * 获取当前用户的角色列表。
   */
  static async getCurrentUserRoles(userId: string) {
    await this.assertUserExists(userId)

    const userRoles = await UserRoleRepository.findByUser(userId)

    return CurrentUserRolesSchema.parse({
      roles: userRoles.map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        displayName: userRole.role.displayName,
        assignedBy: userRole.assignedBy,
        assignedAt: userRole.assignedAt,
      })),
    })
  }
}
