import type { AuthenticatedSecuritySession } from '../auth'
import type { OwnPermissionConfig } from '../guards'
import type { PermissionString } from '../permissions'
import type { AuthRequirement } from './auth.plugin'
import { Elysia } from 'elysia'
import { SessionService } from '../auth'
import { ensureOwnPermission, ensurePermission } from '../guards'
import { Permissions } from '../permissions/permissions'
import { assertAuthenticated } from './auth.plugin'

type RoutePermission = PermissionString | string

export interface AccessContext {
  params?: Record<string, string | undefined>
  request: Request
}

/**
 * 获取已登录会话。
 */
async function requireAuthenticatedSession(request: Request): Promise<AuthenticatedSecuritySession> {
  const auth = await SessionService.getSession(request.headers)
  assertAuthenticated(auth)

  return auth
}

/**
 * 提供 handler 可直接使用的安全上下文。
 */
async function resolveSecurityContext(context: { request: Request }) {
  const auth = await SessionService.getSession(context.request.headers)

  return {
    auth,
    currentUser: auth.user,
    currentSession: auth.session,
  }
}

/**
 * 提供 handler 可直接使用的已登录上下文。
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
 * 访问控制插件。
 */
export const accessPlugin = new Elysia({ name: 'access-plugin' })
  .resolve({ as: 'scoped' }, resolveSecurityContext)
  .macro({
    auth(mode: AuthRequirement = 'optional') {
      if (mode !== 'required') {
        return
      }

      return {
        resolve: resolveProtectedContext,
      }
    },
    permission(permission: RoutePermission | undefined) {
      if (!permission) {
        return
      }

      const beforeHandle = async (context: AccessContext) => {
        const auth = await requireAuthenticatedSession(context.request)
        await ensurePermission(auth.user.id, permission)
      }

      return {
        resolve: resolveProtectedContext,
        beforeHandle,
      }
    },
    own(input: OwnPermissionConfig | RoutePermission | undefined) {
      if (!input) {
        return
      }

      const beforeHandle = async (context: AccessContext) => {
        const auth = await requireAuthenticatedSession(context.request)
        await ensureOwnPermission(auth.user.id, context.params, input)
      }

      return {
        resolve: resolveProtectedContext,
        beforeHandle,
      }
    },
    me(permission: RoutePermission | undefined) {
      if (!permission) {
        return
      }

      const beforeHandle = async (context: AccessContext) => {
        const auth = await requireAuthenticatedSession(context.request)
        await ensurePermission(auth.user.id, permission)
      }

      return {
        resolve: resolveProtectedContext,
        beforeHandle,
      }
    },
  })

export { Permissions }
