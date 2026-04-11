import type { AuthenticatedSecuritySession, SecuritySession } from '../auth'
import type { SessionService } from '../auth/session.service'
import { Elysia } from 'elysia'
import { assertAuthenticated } from '../guards'

/**
 * 路由鉴权模式。
 */
export type AuthRequirement = 'optional' | 'required'

/**
 * 路由级认证插件。
 */
export function createAuthPlugin(sessionService: SessionService) {
  return new Elysia({ name: 'auth-plugin' })
    .resolve({ as: 'scoped' }, async ({ request }) => {
      const auth = await sessionService.getSession(request.headers)

      return {
        auth,
        currentUser: auth.user,
        currentSession: auth.session,
      }
    })
    .macro({
      auth(mode: AuthRequirement = 'optional') {
        if (mode !== 'required') {
          return
        }

        return {
          resolve: async ({ request }) => {
            const auth = await sessionService.getSession(request.headers)
            assertAuthenticated(auth)

            return {
              auth,
              currentUser: auth.user,
              currentSession: auth.session,
            }
          },
        }
      },
    })
}

export type AuthPluginInstance = ReturnType<typeof createAuthPlugin>

export { assertAuthenticated }
export type { AuthenticatedSecuritySession, SecuritySession }
