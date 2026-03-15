import { Elysia } from 'elysia'
import type { Session } from '@/modules/auth'
import type { PermissionString } from '@/core/permissions'
import { PermissionService } from '@/core/permissions/permission.service'
import { Permissions } from '@/core/permissions'
import { ForbiddenError, UnauthorizedError } from '@/core/plugins'
import { protectedPlugin } from './protected.plugin'

type PermissionGuardContext = {
  params?: Record<string, string | undefined>
  request: Request
  getAuth: (request: Request) => Promise<Session>
}

async function resolveUser(context: PermissionGuardContext) {
  const auth = await context.getAuth(context.request)
  return auth.user
}

/**
 * 权限约束工具。
 */
export const permit = {
  permission(permission: PermissionString | string) {
    return async (context: PermissionGuardContext) => {
      const user = await resolveUser(context)

      if (!user?.id) {
        throw new UnauthorizedError('请先登录')
      }

      const hasPermission = await PermissionService.hasPermission(user.id, permission)
      if (!hasPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  },

  own(permission: PermissionString | string, paramKey: string = 'id') {
    return async (context: PermissionGuardContext) => {
      const user = await resolveUser(context)

      if (!user?.id) {
        throw new UnauthorizedError('请先登录')
      }

      const basePermission = permission.replace(/:(own|all)$/, '')
      const hasAllPermission = await PermissionService.hasPermission(user.id, `${basePermission}:all`)
      if (hasAllPermission) {
        return
      }

      const isOwn = context.params?.[paramKey] === user.id
      if (!isOwn) {
        throw new ForbiddenError('权限不足')
      }

      const hasOwnPermission = await PermissionService.hasPermission(user.id, permission)
      if (!hasOwnPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  },

  me(permission: PermissionString | string) {
    return async (context: PermissionGuardContext) => {
      const user = await resolveUser(context)

      if (!user?.id) {
        throw new UnauthorizedError('请先登录')
      }

      const basePermission = permission.replace(/:(own|all)$/, '')
      const hasBasePermission = await PermissionService.hasPermission(user.id, basePermission)
      if (hasBasePermission) {
        return
      }

      const hasOwnPermission = await PermissionService.hasPermission(user.id, `${basePermission}:own`)
      if (!hasOwnPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  },
}

/**
 * 权限插件。
 *
 * 统一接入鉴权插件，并导出一套显式的权限约束工具。
 */
export const permissionPlugin = new Elysia({ name: 'permission' }).use(protectedPlugin)

export { Permissions }
