import type app from '#momo/app'
import type { MomoAuth } from '#momo/modules/auth/auth.config'
import type { ApiResponse } from '@xdd-zone/contracts'
import { closeDb, getDb } from '#momo/infra/db/client'
import { userRoleBindings } from '#momo/infra/db/schema/index'
import { resolveBetterAuthBaseUrl, rewriteBetterAuthRequestUrl } from '#momo/modules/auth/better-auth-url'
import { getCurrentAuthUser } from '#momo/modules/auth/services/index'
import {
  bindFifaOwner,
  createCredentialUser,
  disableUser,
  prepareAuthTestDatabase,
  removeCredentialAccount,
  resetAuthTestData,
  signInByEmail,
} from '#momo/test/helpers/auth-test-db'
import { BizCode } from '@xdd-zone/contracts'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

let momoApp: typeof app

describe('auth 路由', () => {
  beforeAll(async () => {
    await prepareAuthTestDatabase()
    momoApp = (await import('#momo/app')).default
  })

  beforeEach(async () => {
    await resetAuthTestData()
  })

  afterAll(async () => {
    await closeDb()
  })

  it('public 邮箱注册被拒绝', async () => {
    const response = await momoApp.request('/api/auth/sign-up/email', {
      body: JSON.stringify({
        email: 'new-user@example.com',
        name: 'New User',
        password: 'test-password-123',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_METHOD_NOT_ALLOWED)
  })

  it('unauthenticated fifa 当前用户请求被拒绝', async () => {
    const response = await momoApp.request('/rpc/fifa/auth/me')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('bobo 当前用户在无会话时返回 null', async () => {
    const response = await momoApp.request('/rpc/bobo/auth/me')
    const body = (await response.json()) as ApiResponse<{ user: null }>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data.user).toBeNull()
  })

  it('session 对应的用户记录缺失时被拒绝', async () => {
    const auth = {
      api: {
        getSession: vi.fn(async () => ({
          user: {
            id: 'missing-user',
          },
        })),
      },
    } as unknown as MomoAuth

    await expect(getCurrentAuthUser(auth, new Headers())).rejects.toMatchObject({
      code: BizCode.AUTH_SESSION_INVALID,
      status: 401,
    })
  })

  it('code-server auth 代理路径会补给 better-auth 请求 URL', async () => {
    const request = new Request('http://localhost:7788/api/auth/sign-in/email', {
      body: JSON.stringify({
        email: 'owner@example.com',
        password: 'test-password-123',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })
    const publicBaseUrl = resolveBetterAuthBaseUrl('https://code.xdd.ink/proxy/7788')
    const rewrittenRequest = rewriteBetterAuthRequestUrl(request, publicBaseUrl)

    expect(publicBaseUrl).toBe('https://code.xdd.ink/proxy/7788/api/auth')
    expect(rewrittenRequest.url).toBe('https://code.xdd.ink/proxy/7788/api/auth/sign-in/email')
    expect(rewrittenRequest.method).toBe('POST')
    expect(rewrittenRequest.headers.get('content-type')).toBe('application/json')
  })

  it('普通 auth 请求 URL 不会被改写', () => {
    const request = new Request('http://localhost:7788/api/auth/sign-in/email', {
      method: 'POST',
    })
    const rewrittenRequest = rewriteBetterAuthRequestUrl(request, 'http://localhost:7788')

    expect(rewrittenRequest).toBe(request)
  })

  it('已包含 auth 路径的 better-auth URL 不会重复追加', () => {
    expect(resolveBetterAuthBaseUrl('https://code.xdd.ink/proxy/7788/api/auth')).toBe(
      'https://code.xdd.ink/proxy/7788/api/auth',
    )
  })

  it('disabled fifa 用户被拒绝', async () => {
    const testUser = await createCredentialUser({ email: 'disabled-fifa@example.com', name: 'Disabled Fifa' })
    await bindFifaOwner(testUser.id)
    const cookie = await signInByEmail(momoApp, testUser.email)

    await disableUser(testUser.id)

    const response = await momoApp.request('/rpc/fifa/auth/me', {
      headers: {
        cookie,
      },
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_USER_DISABLED)
  })

  it('password 账号缺失的 fifa 用户被拒绝', async () => {
    const testUser = await createCredentialUser({ email: 'no-password@example.com', name: 'No Password' })
    await bindFifaOwner(testUser.id)
    const cookie = await signInByEmail(momoApp, testUser.email)

    await removeCredentialAccount(testUser.id)

    const response = await momoApp.request('/rpc/fifa/auth/me', {
      headers: {
        cookie,
      },
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_METHOD_NOT_ALLOWED)
  })

  it('owner 角色缺失的 fifa 用户被拒绝', async () => {
    const testUser = await createCredentialUser({ email: 'not-owner@example.com', name: 'Not Owner' })
    const cookie = await signInByEmail(momoApp, testUser.email)

    const response = await momoApp.request('/rpc/fifa/auth/me', {
      headers: {
        cookie,
      },
    })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('current fifa owner 用户被返回', async () => {
    const testUser = await createCredentialUser({ email: 'owner@example.com', name: 'Owner' })
    await bindFifaOwner(testUser.id)
    const cookie = await signInByEmail(momoApp, testUser.email)

    const response = await momoApp.request('/rpc/fifa/auth/me', {
      headers: {
        cookie,
      },
    })
    const body = (await response.json()) as ApiResponse<{
      user: { avatarUrl: string | null; displayName: string; id: string }
    }>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data.user).toEqual({
      avatarUrl: null,
      displayName: 'Owner',
      id: testUser.id,
    })
  })

  it('bobo visitor 角色会添加给已登录用户', async () => {
    const testUser = await createCredentialUser({ email: 'bobo@example.com', name: 'Bobo User' })
    const cookie = await signInByEmail(momoApp, testUser.email)

    const response = await momoApp.request('/rpc/bobo/auth/me', {
      headers: {
        cookie,
      },
    })
    const body = (await response.json()) as ApiResponse<{
      user: { avatarUrl: string | null; displayName: string; id: string }
    }>
    const rows = await getDb()
      .select({ id: userRoleBindings.id, status: userRoleBindings.status })
      .from(userRoleBindings)
      .where(eq(userRoleBindings.userId, testUser.id))

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.ok && body.data.user).toEqual({
      avatarUrl: null,
      displayName: 'Bobo User',
      id: testUser.id,
    })
    expect(rows).toEqual([
      {
        id: expect.any(String),
        status: 'active',
      },
    ])
  })
})
