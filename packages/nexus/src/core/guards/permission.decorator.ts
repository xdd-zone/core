import type { PermissionString } from '@/core/permissions'
import { Permissions } from '@/core/permissions'
import { PermissionService } from '@/core/permissions/permission.service'
import { ForbiddenError } from '@/core/plugins'

type BeforeHandleHook = any // Elysia hook function

/**
 * 权限装饰器 - 快捷函数
 *
 * 提供便捷的装饰器用于常见权限检查
 *
 * 使用方式:
 * ```ts
 * .post('/', handler, {
 *   beforeHandle: [Require.UserCreate()]
 * })
 * ```
 */

export class Require {
  /**
   * 要求单个权限
   */
  static Permission(permission: PermissionString | string): BeforeHandleHook {
    return async (ctx: any) => {
      const { user } = ctx

      if (!user || !user.id) {
        throw new ForbiddenError('需要登录才能访问')
      }

      const hasPermission = await PermissionService.hasPermission(user.id, permission)

      if (!hasPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  }

  /**
   * 要求拥有任一指定权限（OR 逻辑）
   */
  static Any(...permissions: (PermissionString | string)[]): BeforeHandleHook {
    return async (ctx: any) => {
      const { user } = ctx

      if (!user || !user.id) {
        throw new ForbiddenError('需要登录才能访问')
      }

      const hasPermission = await PermissionService.hasAnyPermission(user.id, permissions)

      if (!hasPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  }

  /**
   * 要求拥有所有指定权限（AND 逻辑）
   */
  static All(...permissions: (PermissionString | string)[]): BeforeHandleHook {
    return async (ctx: any) => {
      const { user } = ctx

      if (!user || !user.id) {
        throw new ForbiddenError('需要登录才能访问')
      }

      const hasPermission = await PermissionService.hasAllPermissions(user.id, permissions)

      if (!hasPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  }

  /**
   * 要求操作自己的资源（支持 scope 权限检查）
   *
   * 检查逻辑：
   * 1. 如果有 `resource:action:own` 权限且操作的是自己的资源 → 允许
   * 2. 如果有 `resource:action:all` 权限 → 允许
   * 3. 否则 → 拒绝
   *
   * 使用示例:
   * ```ts
   * .get('/user/:id', handler, {
   *   beforeHandle: [Require.OwnPermission(Permissions.USER.READ)]
   * })
   * ```
   */
  static OwnPermission(permission: PermissionString | string, paramKey: string = 'id'): BeforeHandleHook {
    return async (ctx: any) => {
      const { user, params } = ctx
      if (!user || !user.id) {
        throw new ForbiddenError('需要登录才能访问')
      }

      const isOwn = params?.[paramKey] === user.id

      const basePermission = (permission as string).replace(/:(own|all)$/, '')
      const allPermission = `${basePermission}:all` as PermissionString
      const hasAll = await PermissionService.hasPermission(user.id, allPermission)
      if (hasAll) {
        return
      }

      if (isOwn) {
        const hasOwn = await PermissionService.hasPermission(user.id, permission)
        if (!hasOwn) {
          throw new ForbiddenError('权限不足')
        }
        return
      }

      throw new ForbiddenError('权限不足')
    }
  }

  /**
   * 用于 /users/me/* 路由的权限检查
   *
   * 专门用于"当前用户"相关的路由，不需要检查路径参数
   * 因为路径本身就表示"当前用户"（如 /users/me/permissions）
   *
   * 检查逻辑：
   * 自动检查 `resource:action:own` 权限
   *
   * 使用示例:
   * ```ts
   * .get('/users/me/permissions', handler, {
   *   beforeHandle: [Require.MePermission(Permissions.USER_PERMISSION.READ)]
   * })
   * ```
   */
  static MePermission(permission: PermissionString | string): BeforeHandleHook {
    return async (ctx: any) => {
      const { user } = ctx

      if (!user || !user.id) {
        throw new ForbiddenError('需要登录才能访问')
      }

      const basePermission = permission.replace(/:(own|all)$/, '')

      const hasBase = await PermissionService.hasPermission(user.id, basePermission as PermissionString)
      if (hasBase) {
        return
      }

      const ownPermission = `${basePermission}:own` as PermissionString
      const hasOwn = await PermissionService.hasPermission(user.id, ownPermission)
      if (!hasOwn) {
        throw new ForbiddenError('权限不足')
      }
    }
  }

  // ==================== User Permissions ====================

  static UserCreate = () => Require.Permission(Permissions.USER.CREATE)
  static UserReadOwn = () => Require.OwnPermission(Permissions.USER.READ_OWN)
  static UserReadAll = () => Require.Permission(Permissions.USER.READ_ALL)
  static UserUpdateOwn = () => Require.OwnPermission(Permissions.USER.UPDATE_OWN)
  static UserUpdateAll = () => Require.Permission(Permissions.USER.UPDATE_ALL)
  static UserDeleteOwn = () => Require.OwnPermission(Permissions.USER.DELETE_OWN)
  static UserDeleteAll = () => Require.Permission(Permissions.USER.DELETE_ALL)

  // ==================== Role Permissions ====================

  static RoleCreate = () => Require.Permission(Permissions.ROLE.CREATE)
  static RoleRead = () => Require.Permission(Permissions.ROLE.READ)
  static RoleUpdateOwn = () => Require.OwnPermission(Permissions.ROLE.UPDATE_OWN)
  static RoleUpdateAll = () => Require.Permission(Permissions.ROLE.UPDATE_ALL)
  static RoleDeleteOwn = () => Require.OwnPermission(Permissions.ROLE.DELETE_OWN)
  static RoleDeleteAll = () => Require.Permission(Permissions.ROLE.DELETE_ALL)

  // ==================== Permission Management ====================

  static PermissionCreate = () => Require.Permission(Permissions.PERMISSION.CREATE)
  static PermissionRead = () => Require.Permission(Permissions.PERMISSION.READ)
  static PermissionUpdateOwn = () => Require.OwnPermission(Permissions.PERMISSION.UPDATE_OWN)
  static PermissionUpdateAll = () => Require.Permission(Permissions.PERMISSION.UPDATE_ALL)
  static PermissionDeleteOwn = () => Require.OwnPermission(Permissions.PERMISSION.DELETE_OWN)
  static PermissionDeleteAll = () => Require.Permission(Permissions.PERMISSION.DELETE_ALL)

  // ==================== User Role Management ====================

  static UserRoleCreateOwn = () => Require.MePermission(Permissions.USER_ROLE.CREATE_OWN)
  static UserRoleCreateAll = () => Require.Permission(Permissions.USER_ROLE.CREATE_ALL)
  static UserRoleReadOwn = () => Require.OwnPermission(Permissions.USER_ROLE.READ_OWN, 'userId')
  static UserRoleReadAll = () => Require.Permission(Permissions.USER_ROLE.READ_ALL)
  static UserRoleUpdateOwn = () => Require.MePermission(Permissions.USER_ROLE.UPDATE_OWN)
  static UserRoleUpdateAll = () => Require.Permission(Permissions.USER_ROLE.UPDATE_ALL)
  static UserRoleDeleteOwn = () => Require.MePermission(Permissions.USER_ROLE.DELETE_OWN)
  static UserRoleDeleteAll = () => Require.Permission(Permissions.USER_ROLE.DELETE_ALL)

  // ==================== User Permission Query ====================

  static UserPermissionReadOwn = () => Require.OwnPermission(Permissions.USER_PERMISSION.READ_OWN, 'userId')
  static UserPermissionReadAll = () => Require.Permission(Permissions.USER_PERMISSION.READ_ALL)
  static UserPermissionReadMe = () => Require.MePermission(Permissions.USER_PERMISSION.READ_OWN)

  // ==================== Role Permission Management ====================

  static RolePermissionCreate = () => Require.Permission(Permissions.ROLE_PERMISSION.CREATE)
  static RolePermissionDelete = () => Require.Permission(Permissions.ROLE_PERMISSION.DELETE)

  // ==================== Current User (Me) Endpoints ====================

  static UserRoleReadMe = () => Require.MePermission(Permissions.USER_ROLE.READ_OWN)
}

// 导出权限常量供直接使用
export { Permissions } from '@/core/permissions'
