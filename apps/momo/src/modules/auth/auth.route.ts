import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { BizCode } from '@xdd-zone/contracts'
import { Hono } from 'hono'

import { assertFifaOwner, ensureBoboVisitor } from './access.service'
import { getCurrentAuthUser, handleAuthRequest } from './auth.service'

export function createAuthRoute(_runtime: MomoRuntime) {
  return new Hono<HonoEnv>()
    .all('/api/auth/sign-up/email', () => {
      throw new AppError(BizCode.AUTH_METHOD_NOT_ALLOWED, '当前不开放邮箱注册', 403)
    })
    .all('/api/auth/*', (c) => {
      return handleAuthRequest(c.req.raw)
    })
    .get('/rpc/fifa/auth/me', async (c) => {
      const user = await getCurrentAuthUser(c.req.raw.headers)

      if (!user) {
        throw new AppError(BizCode.AUTH_UNAUTHENTICATED, '当前请求未登录', 401)
      }

      await assertFifaOwner(user.id)

      return c.json(createSuccessResponse({ user }, createMeta(c.var.requestId)))
    })
    .get('/rpc/bobo/auth/me', async (c) => {
      const user = await getCurrentAuthUser(c.req.raw.headers)

      if (!user) {
        return c.json(createSuccessResponse({ user: null }, createMeta(c.var.requestId)))
      }

      await ensureBoboVisitor(user.id)

      return c.json(createSuccessResponse({ user }, createMeta(c.var.requestId)))
    })
}

export default createAuthRoute
