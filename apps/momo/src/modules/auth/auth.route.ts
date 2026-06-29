import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { BizCode } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'

import { createMomoAuth } from './auth.config'
import { assertFifaOwner, ensureBoboVisitor, getCurrentAuthUser } from './services'

export function createAuthRoute(runtime: MomoRuntime) {
  const auth = createMomoAuth(runtime)

  return new Hono<HonoEnv>()
    .all('/api/auth/sign-up/email', () => {
      throw new AppError(BizCode.AUTH_METHOD_NOT_ALLOWED, '当前不开放邮箱注册', 403)
    })
    .all('/api/auth/*', (c) => {
      return auth.handler(c.req.raw)
    })
    .get('/rpc/fifa/auth/me', async (c) => {
      const user = await getCurrentAuthUser(auth, c.req.raw.headers)

      if (!user) {
        throw new AppError(BizCode.AUTH_UNAUTHENTICATED, '当前请求未登录', 401)
      }

      await assertFifaOwner(user.id)

      return c.json(createSuccessResponse({ user }, createMeta(c.var.requestId)))
    })
    .get('/rpc/bobo/auth/me', async (c) => {
      const user = await getCurrentAuthUser(auth, c.req.raw.headers)

      if (!user) {
        return c.json(createSuccessResponse({ user: null }, createMeta(c.var.requestId)))
      }

      await ensureBoboVisitor(user.id)

      return c.json(createSuccessResponse({ user }, createMeta(c.var.requestId)))
    })
}

export default createAuthRoute
