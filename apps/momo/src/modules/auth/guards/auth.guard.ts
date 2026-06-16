import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'
import { createMiddleware } from 'hono/factory'

import { createMomoAuth } from '../auth.config'
import { assertFifaOwner, getCurrentAuthUser } from '../services/index'

export function createRequireAuth(runtime: MomoRuntime) {
  const auth = createMomoAuth(runtime)

  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = await getCurrentAuthUser(auth, c.req.raw.headers)

    if (!user) {
      throw new AppError(BizCode.AUTH_UNAUTHENTICATED, '当前请求未登录', 401)
    }

    c.set('user', user)
    await next()
  })
}

export function createRequireFifaOwner(runtime: MomoRuntime) {
  const auth = createMomoAuth(runtime)

  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = await getCurrentAuthUser(auth, c.req.raw.headers)

    if (!user) {
      throw new AppError(BizCode.AUTH_UNAUTHENTICATED, '当前请求未登录', 401)
    }

    await assertFifaOwner(user.id)

    c.set('user', user)
    await next()
  })
}
