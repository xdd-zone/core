import type { Elysia } from 'elysia'
import type { PermissionString } from '@/core/permissions'
import { PermissionService } from '@/core/permissions/permission.service'
import { ForbiddenError } from '@/core/plugins'

/**
 * 权限守卫插件
 *
 * 检查用户是否拥有所需权限
 * 依赖全局 derive 钩子注入的用户上下文
 *
 * 使用方式:
 * ```ts
 * import { Permissions } from '@/core/permissions'
 *
 * .use(permissionGuard({
 *   permissions: [Permissions.USER.CREATE, Permissions.USER.UPDATE],
 *   requireAll: true  // true = AND 逻辑, false = OR 逻辑
 * }))
 * ```
 */
export function permissionGuard(options: { permissions: (PermissionString | string)[]; requireAll?: boolean }) {
  return (app: Elysia) => {
    return app.onBeforeHandle(async (ctx: any) => {
      const { user } = ctx

      if (!user || !user.id) {
        throw new ForbiddenError('需要登录才能访问')
      }

      const { permissions, requireAll = true } = options

      const hasPermission = requireAll
        ? await PermissionService.hasAllPermissions(user.id, permissions)
        : await PermissionService.hasAnyPermission(user.id, permissions)

      if (!hasPermission) {
        throw new ForbiddenError('权限不足')
      }
    })
  }
}
