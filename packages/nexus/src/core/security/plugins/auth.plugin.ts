import type { AuthenticatedSecuritySession, SecuritySession } from '../auth'
import { Elysia } from 'elysia'
import { SessionService } from '../auth'
import { assertAuthenticated } from '../guards'

/**
 * 路由鉴权模式。
 */
export type AuthRequirement = 'optional' | 'required'

/**
 * 路由级认证插件。
 */
export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .resolve({ as: 'scoped' }, async ({ request }) => {
    const auth = await SessionService.getSession(request.headers)

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
          const auth = await SessionService.getSession(request.headers)
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

export { assertAuthenticated }
export type { AuthenticatedSecuritySession, SecuritySession }
