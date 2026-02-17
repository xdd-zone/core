import { PermissionService } from '@/core/permissions/permission.service'
import { BadRequestError, ForbiddenError, NotFoundError } from '@/core/plugins'
import { PermissionRepository, RolePermissionRepository, RoleRepository, UserRoleRepository } from './repositories'
import type { RoleListQuery, PermissionListQuery } from './rbac.model'

export class RbacService {
  // ===== 角色管理 =====

  static async listRoles(query: RoleListQuery) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const { keyword, includeSystem } = query
    const skip = (page - 1) * pageSize

    const where: any = {}

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { displayName: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    if (includeSystem === false) {
      where.isSystem = false
    }

    const { roles, total } = await RoleRepository.findMany(where, skip, pageSize)

    return {
      items: roles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  static async getRoleDetail(id: string) {
    const role = await RoleRepository.findById(id)

    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    // Extract permission strings
    const permissions = role.permissions.map((rp) => {
      const perm = rp.permission
      return perm.scope ? `${perm.resource}:${perm.action}:${perm.scope}` : `${perm.resource}:${perm.action}`
    })

    return {
      ...role,
      permissions,
    }
  }

  static async createRole(data: { name: string; displayName?: string; description?: string; parentId?: string }) {
    // Check if name already exists
    const existing = await RoleRepository.findByName(data.name)
    if (existing) {
      throw new BadRequestError('角色名称已存在')
    }

    const role = await RoleRepository.create({
      ...data,
      isSystem: false,
    })

    return role
  }

  static async updateRole(
    id: string,
    data: {
      displayName?: string
      description?: string
      parentId?: string | null
    },
  ) {
    const role = await RoleRepository.findById(id)

    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    // System role protection
    if (role.isSystem && data.parentId !== undefined && data.parentId !== role.parentId) {
      throw new ForbiddenError('系统角色不能修改层级')
    }

    // Validate parent hierarchy if changing parent
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestError('不能将角色设置为自己的父角色')
      }

      if (data.parentId !== null) {
        const hasCycle = await this.validateRoleHierarchy(data.parentId, id)
        if (hasCycle) {
          throw new BadRequestError('无效的角色层级：检测到循环')
        }
      }
    }

    const updated = await RoleRepository.update(id, data)

    return updated
  }

  static async deleteRole(id: string) {
    const role = await RoleRepository.findById(id)

    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    // System role protection
    if (role.isSystem) {
      throw new ForbiddenError('系统角色不能删除')
    }

    await RoleRepository.delete(id)

    return { success: true }
  }

  static async setRoleParent(roleId: string, parentId: string | null) {
    if (parentId === roleId) {
      throw new BadRequestError('不能将角色设置为自己的父角色')
    }

    const role = await RoleRepository.findById(roleId)
    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    // System role protection
    if (role.isSystem) {
      throw new ForbiddenError('系统角色不能修改层级')
    }

    if (parentId !== null) {
      const hasCycle = await this.validateRoleHierarchy(parentId, roleId)
      if (hasCycle) {
        throw new BadRequestError('无效的角色层级：检测到循环')
      }

      // Verify parent exists
      const parent = await RoleRepository.findById(parentId)
      if (!parent) {
        throw new NotFoundError('父角色不存在')
      }
    }

    const updated = await RoleRepository.update(roleId, { parentId })

    return updated
  }

  static async getRoleChildren(roleId: string) {
    const role = await RoleRepository.findById(roleId)
    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    const children = await RoleRepository.findChildren(roleId)

    return children
  }

  // ===== 权限管理 =====

  static async listPermissions(query: PermissionListQuery) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const { resource } = query
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (resource) {
      where.resource = resource
    }

    const { permissions, total } = await PermissionRepository.findMany(where, skip, pageSize)

    return {
      items: permissions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  static async getPermissionDetail(id: string) {
    const permission = await PermissionRepository.findById(id)

    if (!permission) {
      throw new NotFoundError('权限不存在')
    }

    return permission
  }

  static async createPermission(data: {
    resource: string
    action: string
    scope?: string
    displayName?: string
    description?: string
  }) {
    const permission = await PermissionRepository.create(data)

    return permission
  }

  // ===== 角色权限分配 =====

  static async getRolePermissions(roleId: string) {
    const role = await RoleRepository.findWithPermissions(roleId)

    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    const permissions = role.permissions.map((rp) => ({
      id: rp.permission.id,
      resource: rp.permission.resource,
      action: rp.permission.action,
      scope: rp.permission.scope,
      displayName: rp.permission.displayName,
    }))

    return permissions
  }

  static async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await RoleRepository.findById(roleId)
    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    await RolePermissionRepository.batchAssign(roleId, permissionIds)

    // Clear cache for all users with this role
    const users = await UserRoleRepository.findUsersByRole(roleId)
    users.forEach((user) => PermissionService.clearCache(user.id))

    return { success: true, count: permissionIds.length }
  }

  static async removePermissionFromRole(roleId: string, permissionId: string) {
    const role = await RoleRepository.findById(roleId)
    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    await RolePermissionRepository.removePermission(roleId, permissionId)

    // Clear cache for all users with this role
    const users = await UserRoleRepository.findUsersByRole(roleId)
    users.forEach((user) => PermissionService.clearCache(user.id))

    return { success: true }
  }

  static async replaceRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await RoleRepository.findById(roleId)
    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    await RolePermissionRepository.replacePermissions(roleId, permissionIds)

    // Clear cache for all users with this role
    const users = await UserRoleRepository.findUsersByRole(roleId)
    users.forEach((user) => PermissionService.clearCache(user.id))

    return { success: true, count: permissionIds.length }
  }

  // ===== 用户角色管理 =====

  static async getUserRoles(userId: string) {
    const userRoles = await UserRoleRepository.findByUser(userId)

    return userRoles.map((ur) => ({
      id: ur.id,
      roleId: ur.roleId,
      roleName: ur.role.name,
      roleDisplayName: ur.role.displayName,
      assignedAt: ur.assignedAt,
    }))
  }

  static async assignRoleToUser(userId: string, roleId: string, _options: Record<string, never>) {
    const role = await RoleRepository.findById(roleId)
    if (!role) {
      throw new NotFoundError('角色不存在')
    }

    const userRole = await UserRoleRepository.assignRole(userId, roleId)

    // Clear cache immediately
    PermissionService.clearCache(userId)

    return userRole
  }

  static async removeRoleFromUser(userId: string, roleId: string) {
    await UserRoleRepository.removeRole(userId, roleId)

    // Clear cache immediately
    PermissionService.clearCache(userId)

    return { success: true }
  }

  static async updateUserRole(userId: string, roleId: string, _options: Record<string, never>) {
    await UserRoleRepository.updateUserRole(userId, roleId, {})

    // Clear cache immediately
    PermissionService.clearCache(userId)

    return { success: true }
  }

  // ===== 用户权限查询 =====

  static async getUserPermissions(userId: string) {
    const permissions = await PermissionService.getUserPermissions(userId)

    return {
      permissions,
    }
  }

  static async getCurrentUserPermissions(userId: string) {
    const userWithRoles = await UserRoleRepository.findUserWithRoles(userId)

    if (!userWithRoles) {
      throw new NotFoundError('用户不存在')
    }

    const permissions = await PermissionService.getUserPermissions(userId)

    const roles = userWithRoles.roles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
    }))

    return {
      permissions,
      roles,
    }
  }

  static async getCurrentUserRoles(userId: string) {
    const userRoles = await UserRoleRepository.findByUser(userId)

    return {
      roles: userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
        assignedAt: ur.assignedAt,
      })),
    }
  }

  // ===== 缓存管理 =====

  static clearUserPermissionCache(userId: string) {
    PermissionService.clearCache(userId)
  }

  static clearAllPermissionCache() {
    PermissionService.clearAllCache()
  }

  // ===== 辅助方法 =====

  private static async validateRoleHierarchy(parentId: string, childId: string): Promise<boolean> {
    let currentId = parentId
    const visited = new Set<string>()

    while (currentId) {
      if (currentId === childId) {
        return true // Cycle detected
      }

      if (visited.has(currentId)) {
        return true // Cycle detected
      }
      visited.add(currentId)

      const role = await RoleRepository.findById(currentId)
      if (!role || !role.parentId) {
        break
      }
      currentId = role.parentId
    }

    return false
  }
}
