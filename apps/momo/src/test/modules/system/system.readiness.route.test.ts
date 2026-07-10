import type { ApiResponse, SystemReadinessResponse } from '@xdd-zone/contracts'
import type app from '#momo/app'
import { BizCode, SystemReadinessResponseSchema } from '@xdd-zone/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  bindFifaOwner,
  createCredentialUser,
  prepareAuthTestDatabase,
  resetAuthTestData,
  signInByEmail,
} from '#momo/test/helpers/auth-test-db'

let momoApp: typeof app
let ownerCookie: string

describe('system readiness 路由', () => {
  beforeAll(async () => {
    await prepareAuthTestDatabase()
    momoApp = (await import('#momo/app')).default
  })

  beforeEach(async () => {
    await resetAuthTestData()
    const owner = await createCredentialUser({ email: 'system-owner@example.com', name: 'System Owner' })
    await bindFifaOwner(owner.id)
    ownerCookie = await signInByEmail(momoApp, owner.email)
  })

  afterAll(async () => {
    const { closeDb } = await import('#momo/infra/db/client')
    await closeDb()
  })

  it('未登录请求 readiness 被拒绝', async () => {
    const response = await momoApp.request('/rpc/system/readiness')
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_UNAUTHENTICATED)
  })

  it('非 owner 请求 readiness 被拒绝', async () => {
    const user = await createCredentialUser({ email: 'system-user@example.com', name: 'System User' })
    const cookie = await signInByEmail(momoApp, user.email)
    const response = await momoApp.request('/rpc/system/readiness', { headers: { cookie } })
    const body = (await response.json()) as ApiResponse<never>

    expect(response.status).toBe(403)
    expect(body.ok).toBe(false)
    expect(!body.ok && body.error.code).toBe(BizCode.AUTH_OWNER_REQUIRED)
  })

  it('owner 可以读取依赖状态', async () => {
    const response = await momoApp.request('/rpc/system/readiness', {
      headers: { cookie: ownerCookie },
    })
    const body = (await response.json()) as ApiResponse<SystemReadinessResponse>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    if (!body.ok) throw new Error(body.error.message)

    const data = SystemReadinessResponseSchema.parse(body.data)
    expect(data.status).toBe('ready')
    expect(data.checks.map((check) => check.name)).toEqual(['database', 'cache', 'search', 'storage'])
  })
})
