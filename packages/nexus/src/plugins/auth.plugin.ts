import { Elysia } from 'elysia'
import type { AuthenticatedSession } from '@/modules/auth'
import { UnauthorizedError } from '@/core/plugins'
import { AuthService } from '@/modules/auth'

/**
 * 路由级鉴权插件。
 *
 * 通过装饰器方法统一暴露鉴权能力，避免依赖请求级上下文注入顺序。
 */
export const authPlugin = new Elysia({ name: 'auth' })
  .decorate('getAuth', async (request: Request) => await AuthService.getSession(request.headers))
  .decorate('requireAuth', async (request: Request) => {
    const auth = await AuthService.getSession(request.headers)

    if (!auth.isAuthenticated || !auth.session || !auth.user) {
      throw new UnauthorizedError('请先登录')
    }

    return auth as AuthenticatedSession
  })
