/**
 * 权限服务
 *
 * 核心权限检查逻辑，负责固定角色与权限计算。
 */

import type { PermissionContext, PermissionString } from './permissions.types'
import { prisma } from '@/infra/database/client'
import { Permissions, SYSTEM_PERMISSION_KEYS } from './permissions'
import { matchPermission, normalizePermission } from './helpers'

/**
 * 内存权限缓存
 * TODO: 生产环境应使用 Redis
 */
const permissionCache = new Map<string, { context: PermissionContext; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

export class PermissionService {
  /**
   * 获取用户权限上下文（带缓存）
   */
  static async getPermissionContext(userId: string): Promise<PermissionContext> {
    const cached = permissionCache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.context
    }

    const context = await this.loadPermissionContext(userId)

    // 缓存上下文
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
   * 检查用户是否有特定权限
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
   * 检查用户是否有任一指定权限（OR 逻辑）
   */
  static async hasAnyPermission(userId: string, permissions: (PermissionString | string)[]): Promise<boolean> {
    const results = await Promise.all(permissions.map((p) => this.hasPermission(userId, p)))
    return results.some((r) => r)
  }

  /**
   * 检查用户是否拥有所有指定权限（AND 逻辑）
   */
  static async hasAllPermissions(userId: string, permissions: (PermissionString | string)[]): Promise<boolean> {
    const results = await Promise.all(permissions.map((p) => this.hasPermission(userId, p)))
    return results.every((r) => r)
  }

  /**
   * 清除特定用户的权限缓存
   */
  static clearCache(userId: string): void {
    permissionCache.delete(userId)
  }

  /**
   * 清除所有权限缓存
   */
  static clearAllCache(): void {
    permissionCache.clear()
  }

  /**
   * 获取用户权限列表（供前端使用）
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    const context = await this.getPermissionContext(userId)
    if (context.isSuperAdmin) {
      return [...SYSTEM_PERMISSION_KEYS]
    }

    return Array.from(context.permissions)
  }

  /**
   * 获取用户角色
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

    return userRoles.map((ur) => ({
      roleId: ur.roleId,
      roleName: ur.role.name,
      roleDisplayName: ur.role.displayName,
      assignedAt: ur.assignedAt,
    }))
  }
}
