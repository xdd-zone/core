import type { AuthenticatedSecuritySession } from '../auth'
import type { SessionService } from '../auth/session.service'
import type { OwnPermissionConfig } from '../guards'
import type { PermissionString } from '../permissions'
import type { AuthRequirement } from './auth.plugin'
import { Elysia } from 'elysia'
import { ensureOwnPermission, ensurePermission } from '../guards'
import { Permissions } from '../permissions/permissions'
import { assertAuthenticated } from './auth.plugin'

type RoutePermission = PermissionString | string

export interface AccessContext {
  params?: Record<string, string | undefined>
  request: Request
}

/**
 * 访问控制插件。
 */
export function createAccessPlugin(sessionService: SessionService) {
  async function requireAuthenticatedSession(request: Request): Promise<AuthenticatedSecuritySession> {
    const auth = await sessionService.getSession(request.headers)
    assertAuthenticated(auth)

    return auth
  }

  async function resolveSecurityContext(context: { request: Request }) {
    const auth = await sessionService.getSession(context.request.headers)

    return {
      auth,
      currentUser: auth.user,
      currentSession: auth.session,
    }
  }

  async function resolveProtectedContext(context: { request: Request }) {
    const auth = await requireAuthenticatedSession(context.request)

    return {
      auth,
      currentUser: auth.user,
      currentSession: auth.session,
    }
  }

  return new Elysia({ name: 'access-plugin' }).resolve({ as: 'scoped' }, resolveSecurityContext).macro({
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
}

export type AccessPluginInstance = ReturnType<typeof createAccessPlugin>

export { Permissions }
