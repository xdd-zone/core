import { Elysia } from 'elysia'
import type { AuthenticatedSession } from '@/modules/auth'
import type { PermissionString } from '@/core/permissions/permissions.types'
import { PermissionService } from '@/core/permissions/permission.service'
import { Permissions } from '@/core/permissions/permissions'
import { ForbiddenError } from '@/core/http'
import { AuthService } from '@/modules/auth'
import { assertAuthenticated, authPlugin } from './auth.plugin'

type RoutePermission = PermissionString | string

/**
 * own 权限配置。
 *
 * 说明：当前仅用于“用户自己的资料”场景，不作为通用资源归属判断器。
 */
export interface OwnPermissionConfig {
  permission: RoutePermission
  paramKey?: string
}

type PermissionGuardContext = {
  params?: Record<string, string | undefined>
  request: Request
}

/**
 * 解析并断言当前请求已登录。
 */
async function requireAuthenticatedSession(request: Request): Promise<AuthenticatedSession> {
  const auth = await AuthService.getSession(request.headers)
  assertAuthenticated(auth)

  return auth
}

/**
 * 获取已登录用户。
 */
async function resolveAuthenticatedUser(context: PermissionGuardContext) {
  const auth = await requireAuthenticatedSession(context.request)

  return auth.user
}

/**
 * 生成 handler 可直接消费的已认证上下文。
 */
async function resolveProtectedContext(context: { request: Request }) {
  const auth = await requireAuthenticatedSession(context.request)

  return {
    auth,
    currentUser: auth.user,
    currentSession: auth.session,
  }
}

/**
 * 标准化 own 权限配置。
 */
function normalizeOwnPermission(input: OwnPermissionConfig | RoutePermission): Required<OwnPermissionConfig> {
  if (typeof input === 'string') {
    return {
      permission: input,
      paramKey: 'id',
    }
  }

  return {
    permission: input.permission,
    paramKey: input.paramKey ?? 'id',
  }
}

/**
 * 权限约束工具。
 */
export const permit = {
  permission(permission: RoutePermission) {
    return async (context: PermissionGuardContext) => {
      const user = await resolveAuthenticatedUser(context)

      const hasPermission = await PermissionService.hasPermission(user.id, permission)
      if (!hasPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  },

  own(input: OwnPermissionConfig | RoutePermission, paramKey?: string) {
    const config =
      typeof input === 'string' && paramKey
        ? normalizeOwnPermission({ permission: input, paramKey })
        : normalizeOwnPermission(input)

    return async (context: PermissionGuardContext) => {
      const user = await resolveAuthenticatedUser(context)

      const basePermission = config.permission.replace(/:(own|all)$/, '')
      const hasAllPermission = await PermissionService.hasPermission(user.id, `${basePermission}:all`)
      if (hasAllPermission) {
        return
      }

      const isOwn = context.params?.[config.paramKey] === user.id
      if (!isOwn) {
        throw new ForbiddenError('权限不足')
      }

      const hasOwnPermission = await PermissionService.hasPermission(user.id, config.permission)
      if (!hasOwnPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  },

  me(permission: RoutePermission) {
    return async (context: PermissionGuardContext) => {
      const user = await resolveAuthenticatedUser(context)

      const hasPermission = await PermissionService.hasPermission(user.id, permission)
      if (!hasPermission) {
        throw new ForbiddenError('权限不足')
      }
    }
  },
}

/**
 * 权限插件。
 */
export const permissionPlugin = new Elysia({ name: 'permission' }).use(authPlugin).macro({
  permission(permission: RoutePermission | undefined) {
    if (!permission) {
      return
    }

    const beforeHandle = permit.permission(permission)

    return {
      resolve: resolveProtectedContext,
      beforeHandle,
      onBeforeHandle: beforeHandle,
    }
  },
  own(input: OwnPermissionConfig | RoutePermission | undefined) {
    if (!input) {
      return
    }

    const beforeHandle = permit.own(input)

    return {
      resolve: resolveProtectedContext,
      beforeHandle,
      onBeforeHandle: beforeHandle,
    }
  },
  me(permission: RoutePermission | undefined) {
    if (!permission) {
      return
    }

    const beforeHandle = permit.me(permission)

    return {
      resolve: resolveProtectedContext,
      beforeHandle,
      onBeforeHandle: beforeHandle,
    }
  },
})

export { Permissions }
