import type { MomoRuntime } from '#momo/bootstrap'
import type { ContentPermissionCode } from '#momo/modules/auth/auth.types'
import type { HonoEnv } from '#momo/shared/hono-env'
import type { ApiResponse } from '@xdd-zone/contracts'
import { createRequireAuth, createRequireFifaOwner, createRequirePermission } from '#momo/modules/auth/index'
import { AppError } from '#momo/shared/app-error'
import { createMeta } from '#momo/shared/meta'
import { createSuccessResponse } from '#momo/shared/response'
import { BizCode } from '@xdd-zone/contracts'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  assertFifaOwner: vi.fn(),
  createMomoAuth: vi.fn(() => ({})),
  getCurrentAuthUser: vi.fn(),
}))

vi.mock('#momo/modules/auth/auth.config', () => ({
  createMomoAuth: authMocks.createMomoAuth,
}))

vi.mock('#momo/modules/auth/services/index', () => ({
  assertFifaOwner: authMocks.assertFifaOwner,
  getCurrentAuthUser: authMocks.getCurrentAuthUser,
}))

describe('auth guard', () => {
  beforeEach(() => {
    authMocks.assertFifaOwner.mockReset()
    authMocks.createMomoAuth.mockClear()
    authMocks.getCurrentAuthUser.mockReset()
  })

  it('未登录请求 require auth 接口被拒绝', async () => {
    authMocks.getCurrentAuthUser.mockResolvedValue(null)

    const response = await createGuardTestApp().request('/guard/auth')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('disabled 用户请求 owner 接口被拒绝', async () => {
    authMocks.getCurrentAuthUser.mockResolvedValue(createTestUser())
    authMocks.assertFifaOwner.mockRejectedValue(new AppError(BizCode.AUTH_USER_DISABLED, '当前账号已停用', 403))

    const response = await createGuardTestApp().request('/guard/fifa-owner')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_USER_DISABLED)
  })

  it('没有 password 账号的 fifa 用户请求 owner 接口被拒绝', async () => {
    authMocks.getCurrentAuthUser.mockResolvedValue(createTestUser())
    authMocks.assertFifaOwner.mockRejectedValue(
      new AppError(BizCode.AUTH_METHOD_NOT_ALLOWED, '当前账号不能使用密码登录 fifa', 403),
    )

    const response = await createGuardTestApp().request('/guard/fifa-owner')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_METHOD_NOT_ALLOWED)
  })

  it('没有 fifa owner 角色的用户请求 owner 接口被拒绝', async () => {
    authMocks.getCurrentAuthUser.mockResolvedValue(createTestUser())
    authMocks.assertFifaOwner.mockRejectedValue(
      new AppError(BizCode.AUTH_OWNER_REQUIRED, '当前账号没有 fifa owner 权限', 403),
    )

    const response = await createGuardTestApp().request('/guard/fifa-owner')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('合法 fifa owner 可以访问 owner 接口并读取当前用户', async () => {
    authMocks.getCurrentAuthUser.mockResolvedValue(createTestUser())
    authMocks.assertFifaOwner.mockResolvedValue(undefined)

    const response = await createGuardTestApp().request('/guard/fifa-owner')
    const body = (await response.json()) as ApiResponse<{ userId: string }>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data.userId).toBe('test-user')
  })

  it('content 权限第一版等价于 fifa owner', async () => {
    authMocks.getCurrentAuthUser.mockResolvedValue(createTestUser())
    authMocks.assertFifaOwner.mockResolvedValue(undefined)

    const response = await createGuardTestApp().request('/guard/content-publish')
    const body = (await response.json()) as ApiResponse<{ userId: string }>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data.userId).toBe('test-user')
    expect(authMocks.assertFifaOwner).toHaveBeenCalledWith('test-user')
  })

  it('未知权限码被拒绝', async () => {
    const response = await createGuardTestApp().request('/guard/unknown-permission')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_FORBIDDEN)
    expect(authMocks.getCurrentAuthUser).not.toHaveBeenCalled()
  })
})

function createGuardTestApp() {
  const runtime = {} as MomoRuntime
  const app = new Hono<HonoEnv>()

  app.use('*', async (c, next) => {
    c.set('requestId', 'test-request-id')
    c.set('startedAt', Date.now())
    await next()
  })

  app.onError((error, c) => {
    const appError = error as { code?: string; details?: unknown; message: string; status?: number }
    const status = appError.status === 401 ? 401 : appError.status === 403 ? 403 : 500

    return c.json(
      {
        ok: false,
        error: {
          code: appError.code ?? BizCode.SYSTEM_INTERNAL_ERROR,
          details: appError.details,
          message: appError.message,
        },
        meta: createMeta(c.var.requestId),
      },
      status,
    )
  })

  app.get('/guard/auth', createRequireAuth(runtime), (c) => {
    return c.json(createSuccessResponse({ userId: c.var.user?.id }, createMeta(c.var.requestId)))
  })
  app.get('/guard/fifa-owner', createRequireFifaOwner(runtime), (c) => {
    return c.json(createSuccessResponse({ userId: c.var.user?.id }, createMeta(c.var.requestId)))
  })
  app.get('/guard/content-publish', createRequirePermission(runtime, 'content.post.publish'), (c) => {
    return c.json(createSuccessResponse({ userId: c.var.user?.id }, createMeta(c.var.requestId)))
  })
  app.get(
    '/guard/unknown-permission',
    createRequirePermission(runtime, 'content.unknown' as ContentPermissionCode),
    (c) => {
      return c.json(createSuccessResponse({ userId: c.var.user?.id }, createMeta(c.var.requestId)))
    },
  )

  return app
}

function createTestUser() {
  return {
    avatarUrl: null,
    displayName: 'Test User',
    id: 'test-user',
  }
}
