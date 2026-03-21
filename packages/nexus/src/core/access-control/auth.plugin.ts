import { Elysia } from 'elysia'
import type { AuthenticatedSession, Session } from '@/modules/auth'
import { UnauthorizedError } from '@/core/http'
import { AuthService } from '@/modules/auth'

/**
 * 路由鉴权模式。
 */
export type AuthRequirement = 'optional' | 'required'

/**
 * 将会话断言为已登录状态。
 */
export function assertAuthenticated(auth: Session): asserts auth is AuthenticatedSession {
  if (!auth.isAuthenticated || !auth.session || !auth.user) {
    throw new UnauthorizedError('请先登录')
  }
}

/**
 * 路由级鉴权插件。
 */
export const authPlugin = new Elysia({ name: 'auth' })
  .resolve({ as: 'scoped' }, async ({ request }) => {
    const auth = await AuthService.getSession(request.headers)

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
          const auth = await AuthService.getSession(request.headers)
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
