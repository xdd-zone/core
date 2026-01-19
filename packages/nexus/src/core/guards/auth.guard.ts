import type { Elysia } from 'elysia'
import { UnauthorizedError } from '@/core/plugins'

/**
 * 认证守卫插件
 *
 * 说明:
 * - 依赖全局 derive 钩子注入的 user, session, isAuthenticated 字段
 * - 必须在 setupGlobalHooks 之后注册（已在 setupGlobalHooks 中注入）
 * - 当 required: true 时，未登录用户将被拦截并返回 401 错误
 *
 * 使用方式:
 * ```ts
 * .use(authGuard({ required: true }))
 * .get('/protected', () => {
 *   // 可以通过 ctx.user, ctx.session 访问
 * })
 * ```
 */
export function authGuard(options: { required?: boolean } = {}) {
  return (app: Elysia) =>
    app.onBeforeHandle((ctx: any) => {
      if (options.required) {
        const { user, session, isAuthenticated } = ctx
        if (!user || !session || !isAuthenticated) {
          throw new UnauthorizedError('请先登录')
        }
      }
    })
}
