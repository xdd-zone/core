/**
 * 权限服务
 *
 * 核心权限检查逻辑，支持角色继承和缓存
 */

import type { PermissionContext, PermissionString } from './permissions.types'
import { prisma } from '@/infrastructure/database/client'
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
   * 从数据库加载权限上下文，包含角色继承
   */
  static async loadPermissionContext(userId: string): Promise<PermissionContext> {
    // 获取所有用户角色
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            // 包含父角色以实现继承
            parent: true,
          },
        },
      },
    })

    if (userRoles.length === 0) {
      return { permissions: new Set(), roles: [] }
    }

    // 收集所有角色ID，包括父角色
    const roleIds = new Set<string>()
    const roles: PermissionContext['roles'] = []

    for (const userRole of userRoles) {
      const { role } = userRole
      roles.push({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
      })
      roleIds.add(role.id)

      // 添加父角色ID以实现继承
      let currentRole = role
      while (currentRole.parentId) {
        roleIds.add(currentRole.parentId)
        const parentRole = await prisma.role.findUnique({
          where: { id: currentRole.parentId },
          select: { id: true, parentId: true },
        })
        if (!parentRole) break
        currentRole = parentRole as typeof currentRole & { parentId: string | null }
      }
    }

    // 获取这些角色的所有权限
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: { in: Array.from(roleIds) },
      },
      include: {
        permission: true,
      },
    })

    // 构建权限集合
    const permissions = new Set<PermissionString>()
    for (const rp of rolePermissions) {
      const { resource, action, scope } = rp.permission
      const perm = scope ? `${resource}:${action}:${scope}` : `${resource}:${action}`
      permissions.add(perm as PermissionString)
    }

    return { permissions, roles }
  }

  /**
   * 检查用户是否有特定权限
   */
  static async hasPermission(userId: string, permission: PermissionString | string): Promise<boolean> {
    const context = await this.getPermissionContext(userId)

    // 检查是否为超级管理员
    if (context.permissions.has('*')) {
      return true
    }

    const normalizedPerm = normalizePermission(permission as PermissionString)

    // 检查精确匹配或通配符匹配
    for (const perm of context.permissions) {
      if (matchPermission(normalizedPerm, perm as PermissionString)) {
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
    return Array.from(context.permissions) as string[]
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
