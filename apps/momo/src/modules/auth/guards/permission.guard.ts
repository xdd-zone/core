import type { MomoRuntime } from '#momo/bootstrap'
import type { HonoEnv } from '#momo/shared/hono-env'
import type { ContentPermissionCode } from '../auth.types'
import { AppError } from '#momo/shared/app-error'
import { BizCode } from '@xdd-zone/contracts'
import { createMiddleware } from 'hono/factory'

import { createMomoAuth } from '../auth.config'
import { CONTENT_PERMISSION_CODES } from '../auth.types'
import { assertFifaOwner, getCurrentAuthUser } from '../services/index'

const contentPermissionSet = new Set<string>(CONTENT_PERMISSION_CODES)

export function createRequirePermission(runtime: MomoRuntime, permissionCode: ContentPermissionCode) {
  const auth = createMomoAuth(runtime)

  return createMiddleware<HonoEnv>(async (c, next) => {
    if (!contentPermissionSet.has(permissionCode)) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, '当前账号没有操作权限', 403)
    }

    const user = await getCurrentAuthUser(auth, c.req.raw.headers)

    if (!user) {
      throw new AppError(BizCode.AUTH_UNAUTHENTICATED, '当前请求未登录', 401)
    }

    await assertFifaOwner(user.id)

    c.set('user', user)
    await next()
  })
}
