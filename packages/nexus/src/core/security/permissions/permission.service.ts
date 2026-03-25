import type { PermissionContext, PermissionString } from './permissions.types'
import { prisma } from '@nexus/infra/database/client'
import { matchPermission, normalizePermission } from './helpers'
import { Permissions, SYSTEM_PERMISSION_KEYS } from './permissions'

const permissionCache = new Map<string, { context: PermissionContext; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000

/**
 * 权限服务。
 */
export class PermissionService {
  /**
   * 获取用户权限上下文。
   */
  static async getPermissionContext(userId: string): Promise<PermissionContext> {
    const cached = permissionCache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.context
    }

    const context = await this.loadPermissionContext(userId)

    permissionCache.set(userId, {
      context,
      expiresAt: Date.now() + CACHE_TTL,
    })

    return context
  }

  /**
   * 从数据库加载权限上下文。
   */
  static async loadPermissionContext(userId: string): Promise<PermissionContext> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    if (userRoles.length === 0) {
      return {
        permissions: new Set(),
        isSuperAdmin: false,
        roles: [],
      }
    }

    const roles: PermissionContext['roles'] = []
    const permissions = new Set<PermissionString>()
    let isSuperAdmin = false

    for (const userRole of userRoles) {
      const { role } = userRole
      roles.push({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
      })

      if (role.name === 'superAdmin') {
        isSuperAdmin = true
      }

      for (const rolePermission of role.permissions) {
        const scope =
          rolePermission.permission.scope === 'own' || rolePermission.permission.scope === 'all'
            ? rolePermission.permission.scope
            : undefined

        const permission = normalizePermission({
          resource: rolePermission.permission.resource,
          action: rolePermission.permission.action,
          scope,
        })

        permissions.add(permission)
      }
    }

    if (isSuperAdmin) {
      permissions.add(Permissions.SYSTEM.MANAGE)
    }

    return {
      permissions,
      isSuperAdmin,
      roles,
    }
  }

  /**
   * 检查用户是否拥有指定权限。
   */
  static async hasPermission(userId: string, permission: PermissionString | string): Promise<boolean> {
    const context = await this.getPermissionContext(userId)

    if (context.isSuperAdmin || context.permissions.has(Permissions.SYSTEM.MANAGE)) {
      return true
    }

    const normalizedPerm = normalizePermission(permission as PermissionString)

    for (const perm of context.permissions) {
      if (matchPermission(normalizedPerm, perm)) {
        return true
      }
    }

    return false
  }

  /**
   * 检查用户是否拥有任一指定权限。
   */
  static async hasAnyPermission(userId: string, permissions: (PermissionString | string)[]): Promise<boolean> {
    const results = await Promise.all(permissions.map((permission) => this.hasPermission(userId, permission)))
    return results.some(Boolean)
  }

  /**
   * 检查用户是否拥有全部指定权限。
   */
  static async hasAllPermissions(userId: string, permissions: (PermissionString | string)[]): Promise<boolean> {
    const results = await Promise.all(permissions.map((permission) => this.hasPermission(userId, permission)))
    return results.every(Boolean)
  }

  /**
   * 清除单个用户的权限缓存。
   */
  static clearCache(userId: string): void {
    permissionCache.delete(userId)
  }

  /**
   * 清除全部权限缓存。
   */
  static clearAllCache(): void {
    permissionCache.clear()
  }

  /**
   * 获取用户权限列表。
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    const context = await this.getPermissionContext(userId)
    if (context.isSuperAdmin) {
      return [...SYSTEM_PERMISSION_KEYS]
    }

    return Array.from(context.permissions)
  }

  /**
   * 获取用户角色列表。
   */
  static async getUserRoles(userId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })

    return userRoles.map((userRole) => ({
      roleId: userRole.roleId,
      roleName: userRole.role.name,
      roleDisplayName: userRole.role.displayName,
      assignedAt: userRole.assignedAt,
    }))
  }
}
