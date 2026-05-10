import type { AuthenticatedSecuritySession, SecuritySession } from '../auth'
import type { SessionService } from '../auth/session.service'
import type { PermissionString } from '../permissions'
import type { AuthRequirement } from './auth.plugin'
import type { OwnPermissionConfig } from './ownership.guard'
import { Elysia } from 'elysia'
import { assertAuthenticated } from './auth.guard'
import { ensureOwnPermission } from './ownership.guard'
import { ensureAnyPermission, ensurePermission } from './permission.guard'

type RoutePermission = PermissionString | string
type RoutePermissionRequirement =
  | RoutePermission
  | {
      any?: readonly RoutePermission[]
    }

export interface AccessContext {
  params?: Record<string, string | undefined>
  request: Request
}

/**
 * 访问控制插件。
 */
export function createAccessPlugin(sessionService: SessionService) {
  const authCache = new WeakMap<Request, Promise<AuthenticatedSecuritySession | SecuritySession>>()

  function getCachedSession(request: Request) {
    const cached = authCache.get(request)
    if (cached) {
      return cached
    }

    const pending = sessionService.getSession(request.headers)
    authCache.set(request, pending)

    return pending
  }

  async function requireAuthenticatedSession(request: Request): Promise<AuthenticatedSecuritySession> {
    const auth = await getCachedSession(request)
    assertAuthenticated(auth)

    return auth
  }

  async function resolveSecurityContext(context: { request: Request }) {
    const auth = await getCachedSession(context.request)

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
    permission(permission: RoutePermissionRequirement | undefined) {
      if (!permission) {
        return
      }

      const beforeHandle = async (context: AccessContext) => {
        const auth = await requireAuthenticatedSession(context.request)

        if (typeof permission === 'object') {
          if (permission.any?.length) {
            await ensureAnyPermission(auth.user.id, [...permission.any])
          }
          return
        }

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
